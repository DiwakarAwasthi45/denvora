import { connectDB } from "@/lib/db";
import { InvoiceModel, type Invoice } from "@/models/Invoice";
import { TransactionModel } from "@/models/Transaction";
import { SubscriptionModel } from "@/models/Subscription";
import { PaymentGatewayService } from "./payment-gateway.service";
import { ApiError } from "@/lib/api";
import { DEFAULT_CURRENCY } from "@/constants/config";
import type { TenantContext } from "@/types";
import { Types } from "mongoose";
import { PRICING, type PricingPlan } from "@/constants/config";

export interface CreateInvoiceInput {
  patientId?: string | null;
  branchId?: string | null;
  items: Array<{
    label: string;
    type?: "service" | "membership" | "addon" | "discount";
    quantity?: number;
    unitPrice: number;
  }>;
  taxRate?: number;
  discount?: number;
  dueAt?: string | null;
  currency?: string;
  notes?: string;
}

export interface PaymentIntentResult {
  invoiceId: string;
  intentId: string;
  amount: number;
  currency: string;
  gateway: string;
  redirectUrl: string | null;
  payload: Record<string, unknown>;
  expiresAt: string;
}

function nextInvoiceNumber(): string {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

function planByName(name: string): PricingPlan | undefined {
  return PRICING.plans.find((p) => p.name.toLowerCase() === name.toLowerCase());
}

/** Billing service: invoices + payments + subscription upgrades. */
export class BillingService {
  /** Compute invoice totals (subtotal, tax, discount, grand total). */
  static computeTotals(input: CreateInvoiceInput): {
    subtotal: number;
    taxAmount: number;
    discount: number;
    total: number;
  } {
    const subtotal = input.items.reduce((sum, it) => {
      const lineTotal = it.unitPrice * (it.quantity ?? 1);
      const signed = it.type === "discount" ? -lineTotal : lineTotal;
      return sum + signed;
    }, 0);

    const discount = input.discount ?? 0;
    const taxable = Math.max(subtotal - discount, 0);
    const taxRate = input.taxRate ?? 0;
    const taxAmount = taxable * (taxRate / 100);
    const total = Math.max(taxable + taxAmount, 0);

    return { subtotal, taxAmount, discount, total };
  }

  /** Create a draft invoice. */
  static async createInvoice(context: TenantContext, input: CreateInvoiceInput): Promise<Invoice> {
    await connectDB();
    const clinicId = context.clinicId;
    if (!clinicId) throw ApiError.forbidden("No clinic context");

    const totals = this.computeTotals(input);

    const invoice = await InvoiceModel.create({
      clinicId,
      branchId: input.branchId ?? null,
      patientId: input.patientId ?? null,
      number: nextInvoiceNumber(),
      status: "draft",
      currency: input.currency ?? DEFAULT_CURRENCY,
      subtotal: totals.subtotal,
      taxRate: input.taxRate ?? 0,
      taxAmount: totals.taxAmount,
      discount: totals.discount,
      total: totals.total,
      items: input.items.map((it) => ({
        label: it.label,
        type: it.type ?? "service",
        quantity: it.quantity ?? 1,
        unitPrice: it.unitPrice,
        total: (it.unitPrice * (it.quantity ?? 1)) * (it.type === "discount" ? -1 : 1),
      })),
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      notes: input.notes,
    });

    return invoice;
  }

  /** Finalize a draft invoice into 'open' and return a payment intent. */
  static async createPaymentIntent(context: TenantContext, invoiceId: string): Promise<PaymentIntentResult> {
    await connectDB();
    const clinicId = context.clinicId;
    if (!clinicId) throw ApiError.forbidden("No clinic context");

    const invoice = await InvoiceModel.findOne({ _id: invoiceId, clinicId }).lean();
    if (!invoice) throw ApiError.notFound("Invoice not found");
    if (invoice.status !== "draft") throw ApiError.badRequest("Only draft invoices can be paid");

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing/payments/callback`;
    const intent = await PaymentGatewayService.createIntent(
      invoice.total,
      invoice.currency,
      `Invoice ${invoice.number}`,
      returnUrl
    );

    await InvoiceModel.updateOne(
      { _id: invoice._id },
      { $set: { status: "open" } }
    ).exec();

    await TransactionModel.create({
      clinicId,
      invoiceId: invoice._id,
      gateway: intent.gateway,
      gatewayTxId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: "pending",
    });

    return {
      invoiceId: String(invoice._id),
      intentId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      gateway: intent.gateway,
      redirectUrl: intent.redirectUrl,
      payload: intent.payload,
      expiresAt: intent.expiresAt,
    };
  }

  /** Verify a payment after gateway redirect and update invoice/transaction. */
  static async verifyPayment(context: TenantContext, intentId: string): Promise<void> {
    await connectDB();
    const clinicId = context.clinicId;
    if (!clinicId) throw ApiError.forbidden("No clinic context");

    const tx = await TransactionModel.findOne({ gatewayTxId: intentId, clinicId }).exec();
    if (!tx) throw ApiError.notFound("Transaction not found");

    const invoice = await InvoiceModel.findById(tx.invoiceId).exec();
    if (!invoice) throw ApiError.notFound("Invoice not found");

    const result = await PaymentGatewayService.verify(intentId, tx.amount, tx.currency);

    if (!result.ok || result.status !== "completed") {
      await TransactionModel.updateOne(
        { _id: tx._id },
        { $set: { status: result.status === "pending" ? "pending" : "failed" } }
      ).exec();
      throw ApiError.badRequest(result.message ?? "Payment not completed");
    }

    await TransactionModel.updateOne(
      { _id: tx._id },
      {
        $set: {
          status: "completed",
          paidAt: new Date(),
          gatewayTxId: result.transactionId ?? intentId,
        },
      }
    ).exec();

    const newAmountPaid = invoice.amountPaid + invoice.total;
    const status = newAmountPaid >= invoice.total ? "paid" : "partial";
    await InvoiceModel.updateOne(
      { _id: invoice._id },
      { $set: { status, amountPaid: newAmountPaid, paidAt: status === "paid" ? new Date() : invoice.paidAt } }
    ).exec();
  }

  /** Upgrade a clinic subscription to a named plan. */
  static async subscribeToPlan(context: TenantContext, planName: string, billingCycle: "monthly" | "annual"): Promise<void> {
    const plan = planByName(planName);
    if (!plan) throw ApiError.badRequest("Unknown plan");

    await connectDB();
    const clinicId = context.clinicId;
    if (!clinicId) throw ApiError.forbidden("No clinic context");

    const price = billingCycle === "annual" ? plan.monthlyPrice * 10 : plan.monthlyPrice;
    const startsAt = new Date();
    const expiresAt = new Date(startsAt);
    expiresAt.setMonth(expiresAt.getMonth() + (billingCycle === "annual" ? 12 : 1));

    await SubscriptionModel.findOneAndUpdate(
      { clinicId },
      {
        $set: {
          plan: planName as "trial" | "starter" | "professional" | "enterprise",
          status: "active",
          billingCycle,
          price,
          currency: DEFAULT_CURRENCY,
          startsAt,
          expiresAt,
          cancelledAt: null,
        },
      },
      { upsert: true }
    ).exec();
  }

  /** List invoices for the clinic. */
  static async listInvoices(context: TenantContext, opts: { status?: string; page?: number; limit?: number }) {
    await connectDB();
    const clinicId = context.clinicId;
    if (!clinicId) throw ApiError.forbidden("No clinic context");

    const page = Math.max(1, Number(opts.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(opts.limit ?? 20)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { clinicId };
    if (opts.status) filter.status = opts.status;

    const [items, total] = await Promise.all([
      InvoiceModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      InvoiceModel.countDocuments(filter).exec(),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /** List transactions for the clinic. */
  static async listTransactions(context: TenantContext, opts: { status?: string; page?: number; limit?: number }) {
    await connectDB();
    const clinicId = context.clinicId;
    if (!clinicId) throw ApiError.forbidden("No clinic context");

    const page = Math.max(1, Number(opts.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(opts.limit ?? 20)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { clinicId };
    if (opts.status) filter.status = opts.status;

    const [items, total] = await Promise.all([
      TransactionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      TransactionModel.countDocuments(filter).exec(),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
