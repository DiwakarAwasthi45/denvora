import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { AppointmentModel } from "@/models/Appointment";
import { PatientModel } from "@/models/Patient";
import { InvoiceModel } from "@/models/Invoice";
import { TreatmentModel } from "@/models/Treatment";
import { RecallModel } from "@/models/Recall";
import { InventoryModel } from "@/models/Inventory";
import { AiService } from "./ai.service";
import { requireClinic, requirePermission } from "./access.service";
import type { TenantContext } from "@/types";

async function clinicContext(context: TenantContext) {
  try {
    await connectDB();
    const clinicId = new Types.ObjectId(await requireClinic(context));
    const [patients, appointments, invoices, treatments, recalls] = await Promise.all([
      PatientModel.find({ clinicId }).lean(),
      AppointmentModel.find({ clinicId }).sort({ date: -1 }).limit(50).lean(),
      InvoiceModel.find({ clinicId }).sort({ createdAt: -1 }).limit(50).lean(),
      TreatmentModel.find({ clinicId }).lean(),
      RecallModel.find({ clinicId, status: { $in: ["scheduled", "sent"] } }).lean(),
    ]);
    return { clinicId, patients, appointments, invoices, treatments, recalls };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal(error instanceof Error ? error.message : "Failed to load clinic data");
  }
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-NP", { maximumFractionDigits: 0 }).format(n);
}

/** 7 — AI Clinic Copilot: daily summary, pending tasks, revenue insights, patient priorities, recommendations. */
export async function clinicCopilot(context: TenantContext, question?: string): Promise<{ summary: string; insights: string[] }> {
  const { clinicId, patients, appointments, invoices, treatments, recalls } = await clinicContext(context);
  void clinicId;
  const pending = treatments.filter((t) => ["proposed", "planned"].includes(t.status)).length;
  const unpaid = invoices.filter((i) => ["open", "partial"].includes(i.status)).length;
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.date === today).length;
  const revenue = invoices.filter((i) => ["paid", "partial"].includes(i.status)).reduce((s, i) => s + (i.amountPaid ?? 0), 0);

  const prompt = `You are the Denvora Clinic Copilot. Summarize the clinic's day concisely.
Patients: ${patients.length}. Today's appointments: ${todayAppts}. Pending treatments: ${pending}.
Unpaid invoices: ${unpaid}. Revenue (paid): NPR ${fmt(revenue)}. Active recalls: ${recalls.length}.
Give: 1) a 2-sentence daily summary, 2) 3 prioritized recommended actions as bullet points.
${question ? `\n\nAdditional question from the owner: "${question}". Answer it using the clinic context above.` : ""}`;
  const result = await AiService.chat(context, { messages: [{ role: "user", content: prompt }], maxTokens: 400 });

  const insights = [
    `Today: ${todayAppts} appointments scheduled`,
    `${pending} treatments awaiting acceptance`,
    `${unpaid} unpaid invoices to follow up`,
    `${recalls.length} active recall reminders`,
  ];
  return { summary: result.text, insights };
}

/** 8 — AI Business Advisor: revenue analysis, growth recommendations. */
export async function businessAdvisor(context: TenantContext, question?: string): Promise<{ advice: string }> {
  const { appointments, invoices, patients, treatments } = await clinicContext(context);
  const revenue = invoices.filter((i) => ["paid", "partial"].includes(i.status)).reduce((s, i) => s + (i.amountPaid ?? 0), 0);
  const completed = appointments.filter((a) => a.status === "completed").length;
  const noShows = appointments.filter((a) => a.status === "no_show").length;
  const rate = appointments.length ? Math.round((noShows / appointments.length) * 100) : 0;
  const accepted = treatments.filter((t) => ["planned", "completed", "in_progress"].includes(t.status)).length;
  const acceptance = treatments.length ? Math.round((accepted / treatments.length) * 100) : 0;

  const prompt = `You are the Denvora Business Advisor for a dental clinic in Nepal.
Metrics: ${patients.length} patients, NPR ${fmt(revenue)} revenue, ${completed} completed visits,
no-show rate ${rate}%, treatment acceptance ${acceptance}%.
${question ? `Owner's question: "${question}". ` : ""}Provide 3 concrete growth recommendations.`;
  const result = await AiService.chat(context, { messages: [{ role: "user", content: prompt }], maxTokens: 450 });
  return { advice: result.text };
}

/** 25 — No-Show Prediction: rate per appointment (high/medium/low). */
export async function noShowPrediction(context: TenantContext, appointmentId: string): Promise<{ risk: "high" | "medium" | "low"; reasons: string[] }> {
  await connectDB();
  requirePermission(context, "appointments.view");
  const clinicId = new Types.ObjectId(await requireClinic(context));
  const appt = await AppointmentModel.findOne({ _id: appointmentId, clinicId }).lean();
  if (!appt) throw ApiError.notFound("Appointment not found");

  const patientAppts = await AppointmentModel.find({ clinicId, patientId: appt.patientId }).lean();
  const patientNoShows = patientAppts.filter((a) => a.status === "no_show").length;
  const total = patientAppts.length || 1;
  const ratio = patientNoShows / total;

  let risk: "high" | "medium" | "low" = "low";
  const reasons: string[] = [];
  if (ratio >= 0.5) { risk = "high"; reasons.push("Patient history shows frequent no-shows"); }
  else if (ratio >= 0.25) { risk = "medium"; reasons.push("Patient has some past no-shows"); }
  if (appt.status === "scheduled") reasons.push("Appointment not yet confirmed");
  if (reasons.length === 0) reasons.push("No negative history");

  return { risk, reasons };
}

/** 38 — Smart Recall Engine: recommend recalls due soon. */
export async function smartRecall(context: TenantContext): Promise<{ recommendations: Array<{ patientId: string; name: string; type: string; dueInDays: number }> }> {
  const { patients, recalls } = await clinicContext(context);
  const now = Date.now();
  const recByPatient = new Map(recalls.map((r) => [String(r.patientId), r]));
  const recommendations = patients
    .filter((p) => !recByPatient.has(String(p._id)))
    .slice(0, 20)
    .map((p) => {
      const last = (p.updatedAt as Date)?.getTime?.() ?? now - 180 * 864e5;
      const dueInDays = Math.max(0, Math.round((now - last) / 864e5));
      return { patientId: String(p._id), name: p.name, type: dueInDays > 180 ? "checkup" : "cleaning", dueInDays };
    })
    .filter((r) => r.dueInDays >= 150);
  return { recommendations };
}

/** 64 — Inventory Prediction: predicted stock-out dates. */
export async function inventoryPrediction(context: TenantContext): Promise<{ predictions: Array<{ id: string; name: string; daysLeft: number }> }> {
  await connectDB();
  requirePermission(context, "inventory.view");
  const clinicId = new Types.ObjectId(await requireClinic(context));
  const items = await InventoryModel.find({ clinicId }).lean();
  const predictions = items
    .filter((i) => i.quantity <= (i.reorderLevel || 0) + 5)
    .map((i) => ({ id: String(i._id), name: i.name, daysLeft: Math.max(0, i.quantity) }));
  return { predictions };
}

/** 84 — Clinic Growth Score. */
export async function clinicGrowthScore(context: TenantContext): Promise<{ score: number; factors: Record<string, number> }> {
  const { patients, appointments, treatments } = await clinicContext(context);
  const active = patients.filter((p) => p.status === "active").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const accepted = treatments.filter((t) => ["planned", "completed", "in_progress"].includes(t.status)).length;
  const acceptance = treatments.length ? accepted / treatments.length : 0;
  const factors = {
    patientBase: Math.min(100, active),
    visitVolume: Math.min(100, completed),
    acceptanceRate: Math.round(acceptance * 100),
  };
  const score = Math.round((factors.patientBase + factors.visitVolume + factors.acceptanceRate) / 3);
  return { score, factors };
}

/** 107 — AI Revenue Forecast. */
export async function revenueForecast(context: TenantContext, months = 3): Promise<{ forecast: Array<{ month: string; projected: number }> }> {
  const { invoices } = await clinicContext(context);
  const byMonth = new Map<string, number>();
  for (const i of invoices) {
    if (!["paid", "partial"].includes(i.status)) continue;
    const m = (i.createdAt as Date).toISOString().slice(0, 7);
    byMonth.set(m, (byMonth.get(m) ?? 0) + (i.amountPaid ?? 0));
  }
  const values = [...byMonth.values()];
  const avg = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
  const last = new Date();
  const forecast = Array.from({ length: months }, (_, k) => {
    const d = new Date(last.getFullYear(), last.getMonth() + k + 1, 1);
    return { month: d.toISOString().slice(0, 7), projected: Math.round(avg) };
  });
  return { forecast };
}

/** 108 — AI Recall Prediction: patients likely overdue. */
export async function recallPrediction(context: TenantContext): Promise<{ overdue: Array<{ patientId: string; name: string; lastVisitDays: number }> }> {
  const { patients } = await clinicContext(context);
  const now = Date.now();
  const overdue = patients
    .map((p) => {
      const last = (p.updatedAt as Date)?.getTime?.() ?? 0;
      return { patientId: String(p._id), name: p.name, lastVisitDays: last ? Math.round((now - last) / 864e5) : 999 };
    })
    .filter((x) => x.lastVisitDays > 180)
    .sort((a, b) => b.lastVisitDays - a.lastVisitDays)
    .slice(0, 30);
  return { overdue };
}

/** 109 — AI Patient Segmentation. */
export async function patientSegmentation(context: TenantContext): Promise<{ segments: Record<string, number> }> {
  const { patients, appointments, invoices } = await clinicContext(context);
  const segs: Record<string, number> = { new: 0, loyal: 0, inactive: 0, high_value: 0, treatment_pending: 0 };
  for (const p of patients) {
    const pAppts = appointments.filter((a) => String(a.patientId) === String(p._id));
    const pInv = invoices.filter((i) => String(i.patientId) === String(p._id));
    const spend = pInv.reduce((s, i) => s + (i.amountPaid ?? 0), 0);
    if (spend > 50000) segs.high_value++;
    if (pAppts.length >= 5) segs.loyal++;
    if (p.status === "inactive") segs.inactive++;
    if (pAppts.length <= 1) segs.new++;
  }
  return { segments: segs };
}

/** 110 — AI Campaign Generator. */
export async function campaignGenerator(context: TenantContext, goal: string): Promise<{ messages: string[] }> {
  const prompt = `You are Denvora's campaign assistant for a Nepali dental clinic. Goal: ${goal}.
Generate 3 short, friendly patient message variants (under 120 chars each) for SMS/WhatsApp.`;
  const result = await AiService.chat(context, { messages: [{ role: "user", content: prompt }], maxTokens: 300, temperature: 0.9 });
  const messages = result.text.split("\n").filter((l) => l.trim().length > 0).map((l) => l.replace(/^\d+\.\s*/, "")).slice(0, 3);
  return { messages: messages.length ? messages : [result.text] };
}
