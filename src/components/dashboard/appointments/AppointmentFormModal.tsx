"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  type CreateAppointmentInput,
  type UpdateAppointmentInput,
} from "@/validations/appointment.schema";
import { apiPatch, apiPost } from "@/lib/http";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPES,
  APPOINTMENT_TYPE_LABELS,
  type AppointmentStatus,
} from "@/constants/appointments";
import type { AppointmentFormData, SafeAppointment } from "@/types";

interface Props {
  appointment?: SafeAppointment | null;
  formData: AppointmentFormData;
  onClose: () => void;
  onSaved: () => void;
}

const textareaClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";

export function AppointmentFormModal({ appointment, formData, onClose, onSaved }: Props) {
  const isEdit = Boolean(appointment);
  const [submitting, setSubmitting] = useState(false);

  const schema = isEdit ? updateAppointmentSchema : createAppointmentSchema;
  const defaultValues = {
    patientId: appointment?.patientId ?? "",
    dentistId: appointment?.dentistId ?? "",
    chairId: appointment?.chairId ?? "",
    serviceId: appointment?.serviceId ?? "",
    date: appointment?.date ?? "",
    startTime: appointment?.startTime ?? "",
    endTime: appointment?.endTime ?? "",
    type: (appointment?.type ?? "consultation") as CreateAppointmentInput["type"],
    status: (appointment?.status ?? "") as AppointmentStatus,
    reason: appointment?.reason ?? "",
    notes: appointment?.notes ?? "",
    cancelReason: appointment?.cancelReason ?? "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAppointmentInput | UpdateAppointmentInput>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const [statusValue, setStatusValue] = useState(defaultValues.status);

  const statusRegistration = register("status");

  const onSubmit = async (values: CreateAppointmentInput | UpdateAppointmentInput) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        dentistId: values.dentistId || undefined,
        chairId: values.chairId || undefined,
        serviceId: values.serviceId || undefined,
      };
      if (isEdit) {
        await apiPatch(`/api/appointments/${appointment!.id}`, payload);
        toast.success("Appointment updated");
      } else {
        await apiPost("/api/appointments", payload);
        toast.success("Appointment scheduled");
      }
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save appointment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? `Edit appointment for ${appointment?.patientName}` : "New appointment"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {isEdit ? "Update the appointment details." : "Schedule a patient visit."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Select
            label="Patient"
            placeholder="Select patient"
            options={formData.patients.map((p) => ({ value: p.id, label: p.phone ? `${p.name} (${p.phone})` : p.name }))}
            error={errors.patientId?.message}
            {...register("patientId")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Date" type="date" error={errors.date?.message} {...register("date")} />
            <Select
              label="Type"
              options={APPOINTMENT_TYPES.map((t) => ({ value: t, label: APPOINTMENT_TYPE_LABELS[t] }))}
              error={errors.type?.message}
              {...register("type")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Start time" type="time" error={errors.startTime?.message} {...register("startTime")} />
            <Input label="End time" type="time" error={errors.endTime?.message} {...register("endTime")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Dentist"
              placeholder="Optional"
              options={formData.staff.map((u) => ({ value: u.id, label: u.role ? `${u.name} (${u.role})` : u.name }))}
              error={errors.dentistId?.message}
              {...register("dentistId")}
            />
            <Select
              label="Chair"
              placeholder="Optional"
              options={formData.chairs.map((c) => ({ value: c.id, label: c.location ? `${c.name} — ${c.location}` : c.name }))}
              error={errors.chairId?.message}
              {...register("chairId")}
            />
          </div>

          <Select
            label="Service"
            placeholder="Optional"
            options={formData.services.map((s) => ({ value: s.id, label: s.name }))}
            error={errors.serviceId?.message}
            {...register("serviceId")}
          />

          {isEdit && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Status"
                placeholder="Unchanged"
                options={APPOINTMENT_STATUSES.map((s) => ({ value: s, label: APPOINTMENT_STATUS_LABELS[s] }))}
                error={errors.status?.message}
                {...statusRegistration}
                onChange={(e) => {
                  setStatusValue(e.target.value as AppointmentStatus);
                  void statusRegistration.onChange(e);
                }}
              />
              {statusValue === "cancelled" && (
                <Input
                  label="Cancel reason"
                  placeholder="Why is this cancelled?"
                  error={(errors as { cancelReason?: { message?: string } }).cancelReason?.message}
                  {...register("cancelReason")}
                />
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason</label>
            <input
              placeholder="e.g. Tooth pain, cleaning"
              className={textareaClass}
              {...register("reason")}
            />
            {errors.reason?.message && <p className="mt-1.5 text-xs text-red-600">{errors.reason.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
            <textarea rows={3} placeholder="Any additional notes" className={textareaClass} {...register("notes")} />
            {errors.notes?.message && <p className="mt-1.5 text-xs text-red-600">{errors.notes.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? "Save changes" : "Schedule appointment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
