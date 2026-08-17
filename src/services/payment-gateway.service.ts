import { PAYMENT_CONFIG, type Gateway, type PaymentIntent, type VerifyResult } from "@/constants/payments";
import { ApiError } from "@/lib/api";
import { devLog } from "@/lib/dev-log";
import { randomHex } from "@/lib/utils";

function khaltiBaseUrl(): string {
  if (process.env.KHALTI_BASE_URL) return process.env.KHALTI_BASE_URL.replace(/\/$/, "");
  return process.env.NODE_ENV === "production" ? "https://khalti.com" : "https://dev.khalti.com";
}

/**
 * Payment gateway service.
 * - esewa: server-side verify via GET to esewa's verify endpoint.
 * - khalti: server-side verify via POST to khalti's lookup endpoint.
 * - fonepay: merchant can verify status via the Fonepay KHALTI-style REST lookup.
 * - mock (dev): logs + always succeeds.
 *
 * Checkout redirects are generated per gateway. Merchant secrets come from env;
 * in dev mode the `mock` gateway is used so billing is testable offline.
 */
export class PaymentGatewayService {
  /** Create a payment intent (checkout payload) for the given amount. */
  static async createIntent(
    amount: number,
    currency: string,
    description: string,
    returnUrl: string
  ): Promise<PaymentIntent> {
    const gateway = PAYMENT_CONFIG.gateway;
    const intentId = randomHex(8);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    if (gateway === "mock") {
      devLog("[payment/mock] createIntent", { amount, currency, description });
      return {
        id: intentId,
        amount,
        currency,
        gateway,
        redirectUrl: null,
        payload: { amount, currency, description },
        expiresAt,
      };
    }

    switch (gateway) {
      case "esewa": {
        const payload = {
          amount: amount.toFixed(2),
          tax_amount: "0",
          total_amount: amount.toFixed(2),
          currency: currency,
          product_code: process.env.ESEWA_MERCHANT_ID,
          purchase_order_id: intentId,
          purchase_order_name: description,
          success_url: returnUrl,
          failure_url: returnUrl,
        };
        return {
          id: intentId,
          amount,
          currency,
          gateway,
          redirectUrl: "https://rc.esewa.com.np/main",
          payload,
          expiresAt,
        };
      }

      case "khalti": {
        const base = khaltiBaseUrl();
        const websiteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const res = await fetch(`${base}/api/v2/epayment/initiate/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          },
          body: JSON.stringify({
            return_url: returnUrl,
            website_url: websiteUrl,
            amount: Math.round(amount * 100),
            purchase_order_id: intentId,
            purchase_order_name: description,
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          devLog("[payment/khalti] initiate failed", err);
          throw ApiError.badRequest(`Khalti initiate failed: ${JSON.stringify(err)}`);
        }
        const data = (await res.json()) as { pidx: string; payment_url: string; expires_at?: string };
        return {
          id: data.pidx,
          amount,
          currency,
          gateway,
          redirectUrl: data.payment_url,
          payload: { pidx: data.pidx },
          expiresAt: data.expires_at ?? expiresAt,
        };
      }

      case "fonepay": {
        const payload = {
          merchant_code: process.env.FONEPAY_MERCHANT_CODE,
          merchant_rnc: process.env.FONEPAY_MERCHANT_RNC,
          amount: amount.toFixed(2),
          purchase_order_id: intentId,
          purchase_order_name: description,
        };
        return {
          id: intentId,
          amount,
          currency,
          gateway,
          redirectUrl: `${process.env.FONEPAY_RETURN_URL ?? ""}`,
          payload,
          expiresAt,
        };
      }

      default: {
        devLog("[payment/mock] createIntent (unknown gateway)", { amount, currency });
        return {
          id: intentId,
          amount,
          currency,
          gateway: "mock",
          redirectUrl: null,
          payload: { amount, currency, description },
          expiresAt,
        };
      }
    }
  }

  /** Verify a payment after the user returns from the gateway. */
  static async verify(
    gatewayTxId: string,
    amount: number,
    currency: string
  ): Promise<VerifyResult> {
    const gateway = PAYMENT_CONFIG.gateway;

    if (gateway === "mock") {
      devLog("[payment/mock] verify", { gatewayTxId, amount, currency });
      return { ok: true, transactionId: gatewayTxId, status: "completed" };
    }

    switch (gateway) {
      case "esewa": {
        const url = `https://rc.esewa.com.np/api/verify?product_code=${process.env.ESEWA_MERCHANT_ID}&purchase_order_id=${gatewayTxId}&amount=${amount.toFixed(2)}`;
        const res = await fetch(url, { method: "GET" });
        if (res.ok) return { ok: true, transactionId: gatewayTxId, status: "completed" };
        return { ok: false, status: "failed", message: "eSewa verification failed" };
      }

      case "khalti": {
        const base = khaltiBaseUrl();
        const res = await fetch(`${base}/api/v2/epayment/lookup/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          },
          body: JSON.stringify({ pidx: gatewayTxId }),
        });
        const data = (await res.json().catch(() => ({}))) as { status?: string; transaction_id?: string };
        if (data.status === "Completed") {
          return { ok: true, transactionId: data.transaction_id ?? gatewayTxId, status: "completed" };
        }
        if (data.status === "Pending" || data.status === "Initiated") {
          return { ok: false, status: "pending", message: data.status };
        }
        return { ok: false, status: "failed", message: data.status ?? "Khalti verification failed" };
      }

      case "fonepay": {
        const url = `https://developer.fonepay.com/api/v1/checkMerchantTransaction?merchantCode=${process.env.FONEPAY_MERCHANT_CODE}&merchantRnc=${process.env.FONEPAY_MERCHANT_RNC}&purchaseOrderId=${gatewayTxId}`;
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.FONEPAY_SECRET}`,
          },
        });
        if (res.ok) return { ok: true, transactionId: gatewayTxId, status: "completed" };
        return { ok: false, status: "failed", message: "Fonepay verification failed" };
      }

      default:
        return { ok: false, status: "failed", message: `Unsupported gateway: ${gateway}` };
    }
  }
}
