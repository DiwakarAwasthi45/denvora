"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Check, X, Plus, Loader2 } from "lucide-react";
import { apiGet, apiPost } from "@/lib/http";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Tone = "default" | "success" | "warning" | "danger" | "neutral";
interface Row { _id: string; patientId: string; diagnosis: string; procedure: string; status: string; cost: number; }

export function TreatmentsClient(props: { initialItems: Row[]; initialMeta: unknown; canCreate: boolean; statusTone: Record<string, Tone> }) {
  const [items, setItems] = useState<Row[]>(props.initialItems);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [procedure, setProcedure] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await apiGet<{ items: Row[] }>("/api/treatments?limit=50");
      setItems(d.items);
    } catch { toast.error("Failed to load"); } finally { setLoading(false); }
  }
  async function create() {
    if (!patientId || !diagnosis || !procedure) { toast.error("Patient, diagnosis and procedure required"); return; }
    setSaving(true);
    try {
      await apiPost("/api/treatments", { patientId, diagnosis, procedure });
      toast.success("Treatment created");
      setPatientId(""); setDiagnosis(""); setProcedure("");
      await load();
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  }
  async function act(id: string, a: "accept" | "decline" | "complete") {
    try { await apiPost(`/api/treatments/${id}/accept?action=${a}`, {}); toast.success("Updated"); await load(); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="space-y-6">
      {props.canCreate && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">New treatment</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            <Input placeholder="Patient ID" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
            <Input placeholder="Diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
            <Input placeholder="Procedure" value={procedure} onChange={(e) => setProcedure(e.target.value)} />
            <Button onClick={create} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add</Button>
          </div>
        </div>
      )}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient</th><th className="px-4 py-3">Diagnosis</th>
                <th className="px-4 py-3">Procedure</th><th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No treatments yet</td></tr>}
              {items.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{t.patientId.slice(-6)}</td>
                  <td className="px-4 py-3">{t.diagnosis}</td>
                  <td className="px-4 py-3">{t.procedure}</td>
                  <td className="px-4 py-3">NPR {t.cost?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-3"><Badge tone={props.statusTone[t.status] ?? "default"}>{t.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => act(t._id, "accept")} className="rounded p-1 text-emerald-600 hover:bg-emerald-50" title="Accept"><Check className="size-4" /></button>
                      <button onClick={() => act(t._id, "complete")} className="rounded p-1 text-teal-600 hover:bg-teal-50" title="Complete"><Plus className="size-4" /></button>
                      <button onClick={() => act(t._id, "decline")} className="rounded p-1 text-red-600 hover:bg-red-50" title="Decline"><X className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
