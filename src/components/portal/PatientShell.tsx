"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, CalendarDays, Activity, CreditCard, FileText, MessageSquare, User, LogOut } from "lucide-react";

export interface PortalPatient { id: string; name: string; phone: string; email: string; dob: string | null; gender: string | null; avatar?: string; }
export interface PortalAppointment { id: string; date: string; startTime: string; endTime: string; status: string; dentistName: string | null; reason: string; type: string; }
export interface PortalInvoice { id: string; number: string; status: string; total: number; currency: string; issuedAt?: string; paidAt?: string; }
export interface PortalDoc { id: string; type: string; title: string; fileUrl?: string; createdAt?: string; }
export interface PortalXRay { id: string; type: string; region: string; imageUrl?: string; thumbnailUrl?: string; capturedAt?: string; }
export interface PortalTreatment { id: string; diagnosis: string; procedure: string; status: string; cost: number; priority: string; notes: string; createdAt?: string; }
export interface PortalData {
  patient: PortalPatient;
  appointments: PortalAppointment[];
  invoices: PortalInvoice[];
  documents: PortalDoc[];
  xrays: PortalXRay[];
  treatments: PortalTreatment[];
}

interface Ctx { data: PortalData; clinicSlug: string; phone: string; reload: () => void; }
const PatientCtx = createContext<Ctx | null>(null);
export const usePatient = () => {
  const c = useContext(PatientCtx);
  if (!c) throw new Error("usePatient must be used within PatientShell");
  return c;
};

const NAV = [
  { href: "/portal", label: "Home", icon: Home },
  { href: "/portal/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/portal/treatment", label: "Treatment", icon: Activity },
  { href: "/portal/payments", label: "Payments", icon: CreditCard },
  { href: "/portal/documents", label: "Documents", icon: FileText },
  { href: "/portal/messages", label: "Messages", icon: MessageSquare },
  { href: "/portal/profile", label: "Profile", icon: User },
];

export function PatientShell({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PortalData | null>(null);
  const [clinicSlug, setClinicSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [clinics, setClinics] = useState<{ slug: string; name: string; city: string }[]>([]);
  const [phase, setPhase] = useState<"checking" | "login" | "portal">("checking");
  const [loginStep, setLoginStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentPhone, setSentPhone] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/public/clinics").then((r) => r.json()).then((d) => {
      const list = d.success ? d.data.clinics : [];
      setClinics(list);
      if (list.length === 1) setClinicSlug(list[0].slug);
    }).catch(() => {});

    // Restore session if a patient cookie exists.
    fetch("/api/patient/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.success) {
          setClinicSlug(d.data.clinicSlug);
          setPhone(d.data.phone);
          setPhase("portal");
          loadData();
        } else {
          setPhase("login");
        }
      })
      .catch(() => setPhase("login"));
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/patient-portal");
      const d = await res.json();
      if (d.success) setData(d.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone || !clinicSlug) { setError("Enter your phone number and select the clinic"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/patient/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, clinicSlug }),
      });
      const d = await res.json();
      if (!d.success) { setError("Could not send code. Try again."); return; }
      setSentPhone(phone);
      setDevOtp(d.data?.code ?? "");
      setLoginStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const otp = (e.target as HTMLFormElement).otp?.value ?? "";
    if (!/^\d{6}$/.test(otp)) { setError("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/patient/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: sentPhone, clinicSlug, otp }),
      });
      const d = await res.json();
      if (!d.success) { setError(d.message ?? "Invalid code"); return; }
      const me = await (await fetch("/api/patient/auth/me")).json();
      if (me?.success) {
        setClinicSlug(me.data.clinicSlug);
        setPhone(me.data.phone);
      }
      setPhase("portal");
      await loadData();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    fetch("/api/patient/auth/logout", { method: "POST" }).catch(() => {});
    setData(null); setPhone(""); setClinicSlug(""); setLoginStep("phone"); setError("");
    setPhase("login");
  }

  if (phase !== "portal" || !data) {
    return <LoginScreen phase={phase} error={error} clinics={clinics} clinicSlug={clinicSlug} setClinicSlug={setClinicSlug}
      phone={phone} setPhone={setPhone} loginStep={loginStep} loading={loading} devOtp={devOtp}
      onSend={sendCode} onVerify={verifyCode} onBack={() => setLoginStep("phone")} />;
  }

  function book() { window.location.assign(`/booking${clinicSlug ? `?clinic=${clinicSlug}` : ""}`); }

  return (
    <PatientCtx.Provider value={{ data, clinicSlug, phone, reload: loadData }}>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white pb-24">
        <header className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4 text-white sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <div>
              <p className="text-xs font-light opacity-80">Denvora · Patient Portal</p>
              <p className="text-lg font-semibold">Hi, {data.patient.name.split(" ")[0]}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={book} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25">Book</button>
              <button onClick={signOut} className="rounded-full bg-white/15 p-1.5 hover:bg-white/25" aria-label="Sign out"><LogOut size={16} /></button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-stretch justify-between px-1">
            {NAV.map((n) => {
              const active = n.href === "/portal" ? pathname === "/portal" : pathname.startsWith(n.href);
              const Icon = n.icon;
              return (
                <Link key={n.href} href={n.href} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${active ? "text-indigo-600" : "text-slate-400"}`}>
                  <Icon size={20} />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </PatientCtx.Provider>
  );
}

function LoginScreen(props: {
  phase: "checking" | "login" | "portal";
  error: string;
  clinics: { slug: string; name: string; city: string }[];
  clinicSlug: string;
  setClinicSlug: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  loginStep: "phone" | "otp";
  loading: boolean;
  devOtp: string;
  onSend: (e: React.FormEvent) => void;
  onVerify: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  if (props.phase === "checking") {
    return <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-white"><p className="text-sm text-slate-400">Loading…</p></div>;
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-white px-4">
      <div className="w-full max-w-md rounded-3xl border border-indigo-100 bg-white p-8 shadow-xl shadow-indigo-100">
        <p className="text-sm font-light text-indigo-500">Denvora</p>
        <h1 className="text-2xl font-semibold text-slate-900">Patient Portal</h1>
        <p className="mt-1 text-sm text-slate-500">
          {props.loginStep === "phone" ? "Enter your phone to receive a login code." : `We sent a 6-digit code to ${props.phone}.`}
        </p>

        {props.loginStep === "phone" ? (
          <form onSubmit={props.onSend} className="mt-6 space-y-4">
            {props.clinics.length > 1 && (
              <div>
                <label className="text-sm font-medium text-slate-700">Clinic</label>
                <select value={props.clinicSlug} onChange={(e) => props.setClinicSlug(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm">
                  <option value="">Select clinic</option>
                  {props.clinics.map((c) => <option key={c.slug} value={c.slug}>{c.name}{c.city ? ` — ${c.city}` : ""}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700">Phone number</label>
              <input value={props.phone} onChange={(e) => props.setPhone(e.target.value)} inputMode="tel" placeholder="+977 98XXXXXXXX" className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            {props.error && <p className="text-sm text-rose-600">{props.error}</p>}
            <button type="submit" disabled={props.loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {props.loading ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={props.onVerify} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">6-digit code</label>
              <input name="otp" inputMode="numeric" maxLength={6} placeholder="123456" className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm tracking-[0.5em] focus:border-indigo-500 focus:outline-none" />
              {props.devOtp && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Dev code: <span className="font-mono font-semibold tracking-[0.3em]">{props.devOtp}</span> (shown because server is not in production)
                </p>
              )}
            </div>
            {props.error && <p className="text-sm text-rose-600">{props.error}</p>}
            <button type="submit" disabled={props.loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {props.loading ? "Verifying…" : "Verify & sign in"}
            </button>
            <button type="button" onClick={props.onBack} className="w-full text-center text-sm text-slate-400 hover:text-slate-600">Use a different number</button>
          </form>
        )}
        <p className="mt-4 text-center text-xs text-slate-400">New here? <a href={`/booking${props.clinicSlug ? `?clinic=${props.clinicSlug}` : ""}`} className="font-medium text-indigo-600 hover:underline">Book an appointment</a></p>
      </div>
    </div>
  );
}
