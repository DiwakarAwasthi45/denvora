"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { UserPlus, Search, RefreshCw, Trash2, ChevronLeft, ChevronRight, Loader2, Eye } from "lucide-react";
import { apiDelete, apiGet } from "@/lib/http";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GENDER_LABELS, PATIENT_STATUS_LABELS } from "@/constants/patients";
import { PatientFormModal } from "./PatientFormModal";
import type { PaginationMeta, SafePatient } from "@/types";

interface ManagerProps {
  initialItems: SafePatient[];
  initialMeta: PaginationMeta;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const STATUS_TONES: Record<string, "default" | "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  inactive: "neutral",
  deceased: "neutral",
};

function ageFromDob(dob?: string | null): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "—";
  const diff = Date.now() - birth.getTime();
  return String(Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
}

export function PatientsManager({ initialItems, initialMeta, canCreate, canUpdate, canDelete }: ManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<SafePatient | null>(null);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    params.set("limit", "20");
    params.set("page", String(page));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter) params.set("status", statusFilter);

    apiGet<{ items: SafePatient[]; meta: PaginationMeta }>(`/api/patients?${params.toString()}`)
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setMeta(res.meta);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Unable to load patients");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, debouncedSearch, statusFilter, refreshKey]);

  const reload = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Patients</h1>
          <p className="mt-1 text-sm text-slate-500">Manage patient records and dental charts.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus className="size-4" />
            Add patient
          </Button>
        )}
      </div>

      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, phone or email"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>
          <Select
            className="w-44"
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={Object.entries(PATIENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Button variant="outline" onClick={reload} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Age</th>
                <th className="px-5 py-3 font-medium">Gender</th>
                <th className="px-5 py-3 font-medium">City</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/patients/${patient.id}`} className="font-medium text-teal-700 hover:underline">
                      {patient.name}
                    </Link>
                    {patient.email && <p className="text-xs text-slate-400">{patient.email}</p>}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{patient.phone || "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{ageFromDob(patient.dob)}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {patient.gender ? GENDER_LABELS[patient.gender as keyof typeof GENDER_LABELS] ?? patient.gender : "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{patient.city || "—"}</td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONES[patient.status] ?? "neutral"}>
                      {PATIENT_STATUS_LABELS[patient.status as keyof typeof PATIENT_STATUS_LABELS] ?? patient.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/patients/${patient.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="size-3.5" />
                          View
                        </Button>
                      </Link>
                      {canUpdate && (
                        <Button variant="outline" size="sm" onClick={() => setEditing(patient)}>
                          Edit
                        </Button>
                      )}
                      {canDelete && <DeleteButton patient={patient} onDone={reload} />}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No patients found{search ? ` for “${search}”` : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-500">
              Page {meta.page} of {meta.totalPages} · {meta.total} patients
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage((p) => p - 1); setLoading(true); }}>
                <ChevronLeft className="size-4" />
                Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => { setPage((p) => p + 1); setLoading(true); }}>
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {showCreate && (
        <PatientFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            setPage(1);
            setSearch("");
            setStatusFilter("");
            reload();
          }}
        />
      )}

      {editing && (
        <PatientFormModal
          patient={editing}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}

function DeleteButton({ patient, onDone }: { patient: SafePatient; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    if (!window.confirm(`Delete ${patient.name}? This removes their medical history and chart too.`)) return;
    setBusy(true);
    try {
      await apiDelete(`/api/patients/${patient.id}`);
      toast.success("Patient deleted");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete patient");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={handle} disabled={busy}>
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  );
}
