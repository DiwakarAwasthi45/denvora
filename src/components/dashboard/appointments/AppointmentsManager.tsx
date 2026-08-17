"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CalendarPlus, Search, RefreshCw, Trash2, ChevronLeft, ChevronRight, Loader2, Clock } from "lucide-react";
import { apiDelete, apiGet } from "@/lib/http";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
} from "@/constants/appointments";
import { AppointmentFormModal } from "./AppointmentFormModal";
import type { AppointmentFormData, PaginationMeta, SafeAppointment } from "@/types";

interface ManagerProps {
  initialItems: SafeAppointment[];
  initialMeta: PaginationMeta;
  formData: AppointmentFormData;
  defaultDate?: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const STATUS_TONES: Record<string, "default" | "success" | "warning" | "danger" | "neutral"> = {
  scheduled: "default",
  confirmed: "warning",
  checked_in: "success",
  in_progress: "success",
  completed: "neutral",
  no_show: "danger",
  cancelled: "neutral",
};

export function AppointmentsManager({
  initialItems,
  initialMeta,
  formData,
  defaultDate,
  canCreate,
  canUpdate,
  canDelete,
}: ManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [page, setPage] = useState(1);
  const [date, setDate] = useState(defaultDate ?? "");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<SafeAppointment | null>(null);

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
    if (date) params.set("date", date);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter) params.set("status", statusFilter);

    apiGet<{ items: SafeAppointment[]; meta: PaginationMeta }>(`/api/appointments?${params.toString()}`)
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setMeta(res.meta);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Unable to load appointments");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, date, debouncedSearch, statusFilter, refreshKey]);

  const reload = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Appointments</h1>
          <p className="mt-1 text-sm text-slate-500">Schedule, manage and track patient appointments.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)}>
            <CalendarPlus className="size-4" />
            New appointment
          </Button>
        )}
      </div>

      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            aria-label="Filter by date"
          />
          <Select
            className="w-40"
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={APPOINTMENT_STATUSES.map((s) => ({ value: s, label: APPOINTMENT_STATUS_LABELS[s] }))}
          />
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by patient name or phone"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>
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
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Dentist</th>
                <th className="px-5 py-3 font-medium">Chair</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 font-medium text-slate-900">
                      <Clock className="size-3.5 text-slate-400" />
                      {appointment.startTime} – {appointment.endTime}
                    </div>
                    {appointment.date && (
                      <p className="mt-0.5 text-xs text-slate-400">{appointment.date}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{appointment.patientName}</div>
                    {appointment.patientPhone && (
                      <p className="text-xs text-slate-400">{appointment.patientPhone}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {APPOINTMENT_TYPE_LABELS[appointment.type as keyof typeof APPOINTMENT_TYPE_LABELS] ??
                      appointment.type}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{appointment.dentistName ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{appointment.chairName ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONES[appointment.status] ?? "neutral"}>
                      {APPOINTMENT_STATUS_LABELS[appointment.status as keyof typeof APPOINTMENT_STATUS_LABELS] ??
                        appointment.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {canUpdate && (
                        <Button variant="outline" size="sm" onClick={() => setEditing(appointment)}>
                          Edit
                        </Button>
                      )}
                      {canDelete && <DeleteButton appointment={appointment} onDone={reload} />}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No appointments found. Adjust filters or schedule a new appointment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-500">
              Page {meta.page} of {meta.totalPages} · {meta.total} appointments
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => p - 1);
                  setLoading(true);
                }}
              >
                <ChevronLeft className="size-4" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => {
                  setPage((p) => p + 1);
                  setLoading(true);
                }}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {showCreate && (
        <AppointmentFormModal
          formData={formData}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            setPage(1);
            reload();
          }}
        />
      )}

      {editing && (
        <AppointmentFormModal
          appointment={editing}
          formData={formData}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}

function DeleteButton({ appointment, onDone }: { appointment: SafeAppointment; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    if (!window.confirm(`Delete appointment for ${appointment.patientName} on ${appointment.date}?`)) return;
    setBusy(true);
    try {
      await apiDelete(`/api/appointments/${appointment.id}`);
      toast.success("Appointment deleted");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete appointment");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-600 hover:bg-red-50"
      onClick={handle}
      disabled={busy}
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  );
}
