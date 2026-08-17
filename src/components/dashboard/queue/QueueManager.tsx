"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { RefreshCw, PlayCircle, CheckCircle2, UserX, XCircle, ClipboardList, LogIn } from "lucide-react";
import { apiGet, apiPost } from "@/lib/http";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from "@/constants/appointments";
import type { SafeAppointment } from "@/types";

interface ChairOption {
  id: string;
  name: string;
  location?: string;
}

interface QueueData {
  items: SafeAppointment[];
  chairs: ChairOption[];
}

interface Props {
  queueItems: SafeAppointment[];
  chairs: ChairOption[];
  canManage: boolean;
  initialUpcoming: SafeAppointment[];
}

function todayParam(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function QueueManager({ queueItems, chairs, canManage, initialUpcoming }: Props) {
  const [items, setItems] = useState(queueItems);
  const [upcoming, setUpcoming] = useState(initialUpcoming);
  const [chairOptions, setChairOptions] = useState(chairs);
  const [chairSelection, setChairSelection] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const today = todayParam();

  const reload = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    params.set("date", today);
    const fetchQueue = apiGet<QueueData>(`/api/queue?${params.toString()}`);
    const fetchUpcoming = apiGet<{ items: SafeAppointment[] }>(
      `/api/appointments?date=${today}&limit=50`
    );

    Promise.all([fetchQueue, fetchUpcoming])
      .then(([queue, appts]) => {
        if (!active) return;
        setItems(queue.items);
        setChairOptions(queue.chairs);
        setUpcoming(appts.items);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Unable to load queue");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [today, refreshKey]);

  const transition = async (id: string, status: string, opts?: { chairId?: string; cancelReason?: string }) => {
    setBusyId(id);
    try {
      await apiPost(`/api/queue/${id}/transition`, { status, ...opts });
      toast.success(APPOINTMENT_STATUS_LABELS[status as keyof typeof APPOINTMENT_STATUS_LABELS] ?? status);
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update queue");
    } finally {
      setBusyId(null);
    }
  };

  const checkIn = async (appointment: SafeAppointment) => {
    setBusyId(appointment.id);
    try {
      if (appointment.status === "scheduled") {
        await apiPost(`/api/queue/${appointment.id}/transition`, { status: "confirmed" });
      }
      await apiPost(`/api/queue/${appointment.id}/transition`, { status: "checked_in" });
      toast.success(`${appointment.patientName} checked in`);
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to check in patient");
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (appointment: SafeAppointment) => {
    const reason = window.prompt("Reason for cancelling?")?.trim();
    if (reason === undefined) return;
    await transition(appointment.id, "cancelled", { cancelReason: reason });
  };

  const pending = upcoming.filter((a) => a.status === "scheduled" || a.status === "confirmed");
  const finished = upcoming.filter((a) => a.status === "completed" || a.status === "no_show" || a.status === "cancelled");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Queue</h1>
          <p className="mt-1 text-sm text-slate-500">
            Today&apos;s patients waiting and in treatment ({today}).
          </p>
        </div>
        <Button variant="outline" onClick={reload} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Waiting / in progress" value={items.length} accent="text-teal-700" />
        <StatCard label="Upcoming" value={pending.length} accent="text-amber-600" />
        <StatCard label="Finished today" value={finished.length} accent="text-slate-500" />
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ClipboardList className="size-4 text-teal-600" />
            In queue
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">#</th>
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
                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                      {appointment.queuePosition ?? "–"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{appointment.patientName}</div>
                    <p className="text-xs text-slate-400">
                      {appointment.startTime} – {appointment.endTime}
                      {appointment.patientPhone ? ` · ${appointment.patientPhone}` : ""}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {APPOINTMENT_TYPE_LABELS[appointment.type as keyof typeof APPOINTMENT_TYPE_LABELS] ??
                      appointment.type}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{appointment.dentistName ?? "—"}</td>
                  <td className="px-5 py-3">
                    {appointment.chairName ? (
                      <span className="text-slate-600">{appointment.chairName}</span>
                    ) : appointment.status === "checked_in" && canManage ? (
                      <Select
                        className="w-40"
                        placeholder="Assign chair"
                        value={chairSelection[appointment.id] ?? ""}
                        onChange={(e) => setChairSelection((s) => ({ ...s, [appointment.id]: e.target.value }))}
                        options={chairOptions.map((c) => ({ value: c.id, label: c.location ? `${c.name} — ${c.location}` : c.name }))}
                      />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={appointment.status === "in_progress" ? "success" : "warning"}>
                      {APPOINTMENT_STATUS_LABELS[appointment.status as keyof typeof APPOINTMENT_STATUS_LABELS] ??
                        appointment.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {appointment.status === "checked_in" && canManage && (
                        <Button
                          size="sm"
                          onClick={() =>
                            transition(appointment.id, "in_progress", {
                              chairId: chairSelection[appointment.id] || undefined,
                            })
                          }
                          loading={busyId === appointment.id}
                        >
                          <PlayCircle className="size-3.5" />
                          Start
                        </Button>
                      )}
                      {appointment.status === "in_progress" && canManage && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => transition(appointment.id, "completed")}
                          loading={busyId === appointment.id}
                        >
                          <CheckCircle2 className="size-3.5" />
                          Complete
                        </Button>
                      )}
                      {canManage && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => transition(appointment.id, "no_show")}
                          loading={busyId === appointment.id}
                          title="Mark as no show"
                        >
                          <UserX className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No patients in queue right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <LogIn className="size-4 text-amber-600" />
            Upcoming today ({pending.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Dentist</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pending.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {appointment.startTime} – {appointment.endTime}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900">{appointment.patientName}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {APPOINTMENT_TYPE_LABELS[appointment.type as keyof typeof APPOINTMENT_TYPE_LABELS] ??
                      appointment.type}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{appointment.dentistName ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge tone={appointment.status === "confirmed" ? "warning" : "default"}>
                      {APPOINTMENT_STATUS_LABELS[appointment.status as keyof typeof APPOINTMENT_STATUS_LABELS] ??
                        appointment.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {canManage && (
                        <Button size="sm" onClick={() => checkIn(appointment)} loading={busyId === appointment.id}>
                          <LogIn className="size-3.5" />
                          Check in
                        </Button>
                      )}
                      {canManage && (
                        <Button size="sm" variant="outline" onClick={() => cancel(appointment)} loading={busyId === appointment.id} title="Cancel">
                          <XCircle className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && pending.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No upcoming appointments today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card className="p-5">
      <p className={`text-3xl font-semibold ${accent}`}>{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </Card>
  );
}
