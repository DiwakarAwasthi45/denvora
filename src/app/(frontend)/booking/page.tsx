"use client";

import { useEffect, useState } from "react";

interface Clinic { slug: string; name: string; city: string; }
interface Service { id: string; name: string; durationMinutes: number; price: number; }
interface Slot { startTime: string; endTime: string; dentistName: string | null; chairName: string; }

export default function BookingPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [clinicSlug, setClinicSlug] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ appointmentId: string } | null>(null);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/public/clinics")
      .then((r) => r.json())
      .then((d) => {
        const list: Clinic[] = d.success ? d.data.clinics : [];
        setClinics(list);
        if (list.length === 1) setClinicSlug(list[0].slug);
      })
      .catch(() => setError("Could not load clinics"));
  }, []);

  useEffect(() => {
    if (!clinicSlug) return;
    setServices([]);
    setServiceId("");
    fetch(`/api/public/clinics/${clinicSlug}/services`)
      .then((r) => r.json())
      .then((d) => setServices(d.success ? d.data.services : []))
      .catch(() => setError("Could not load services"));
  }, [clinicSlug]);

  async function loadSlots() {
    setError("");
    if (!clinicSlug || !serviceId || !date) {
      setError("Select a clinic, service and date");
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot("");
    try {
      const res = await fetch(
        `/api/public/booking/available?clinicSlug=${encodeURIComponent(clinicSlug)}&serviceId=${encodeURIComponent(serviceId)}&date=${date}`
      );
      const d = await res.json();
      if (!d.success) {
        setError(d.message ?? "Could not load slots");
        setSlots([]);
      } else {
        setSlots(d.data.slots);
      }
    } catch {
      setError("Could not load slots");
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => { if (clinicSlug && serviceId && date) loadSlots(); /* eslint-disable-next-line */ }, [serviceId, date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !phone || !selectedSlot) {
      setError("Name, phone and a time slot are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicSlug,
          patient: { name, phone, email, gender: gender || null },
          serviceId,
          date,
          startTime: selectedSlot,
          notes,
        }),
      });
      const d = await res.json();
      if (!d.success) {
        setError(d.message ?? "Booking failed");
      } else {
        setResult(d.data);
      }
    } catch {
      setError("Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
          <h1 className="text-xl font-semibold text-emerald-900">Appointment booked!</h1>
          <p className="mt-2 text-sm text-emerald-800">Reference: <span className="font-mono">{result.appointmentId}</span></p>
          <p className="mt-1 text-sm text-emerald-700">We&apos;ll confirm your slot shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Book an appointment</h1>
      <p className="mt-1 text-sm text-slate-500">Choose a clinic, service and time — no login required.</p>

      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mt-6 space-y-4">
        {clinics.length > 1 && (
          <div>
            <label className="text-sm font-medium text-slate-700">Clinic</label>
            <select value={clinicSlug} onChange={(e) => setClinicSlug(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm">
              <option value="">Select clinic</option>
              {clinics.map((c) => <option key={c.slug} value={c.slug}>{c.name}{c.city ? ` — ${c.city}` : ""}</option>)}
            </select>
          </div>
        )}
        {clinics.length === 0 && !error && <p className="text-sm text-slate-400">Loading clinics…</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Service</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm">
              <option value="">Select service</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.durationMinutes}m)</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm" />
          </div>
        </div>

        {loadingSlots && <p className="text-sm text-slate-400">Loading available times…</p>}
        {!loadingSlots && slots.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Available times</p>
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s.startTime}
                  type="button"
                  onClick={() => setSelectedSlot(s.startTime)}
                  className={`rounded-lg border px-3 py-2 text-sm ${selectedSlot === s.startTime ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-teal-400"}`}
                >
                  {s.startTime}
                  {s.dentistName ? <span className="block text-xs opacity-75">w/ {s.dentistName}</span> : null}
                </button>
              ))}
            </div>
          </div>
        )}
        {!loadingSlots && serviceId && slots.length === 0 && !error && (
          <p className="text-sm text-slate-400">No open slots for this date.</p>
        )}

        <form onSubmit={submit} className="space-y-4 border-t border-slate-200 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm" required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm" required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email (optional)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Gender (optional)</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm">
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm" />
          </div>
          <button type="submit" disabled={submitting || !selectedSlot} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
            {submitting ? "Booking…" : "Confirm booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
