"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import { createPatientSchema, updatePatientSchema, type CreatePatientInput, type UpdatePatientInput } from "@/validations/patient.schema";
import { apiPatch, apiPost } from "@/lib/http";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { BLOOD_GROUPS, GENDERS, PATIENT_STATUSES, GENDER_LABELS, PATIENT_STATUS_LABELS } from "@/constants/patients";
import type { SafePatient } from "@/types";

interface Props {
  patient?: SafePatient | null;
  onClose: () => void;
  onSaved: () => void;
}

const textareaClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";

export function PatientFormModal({ patient, onClose, onSaved }: Props) {
  const isEdit = Boolean(patient);
  const [submitting, setSubmitting] = useState(false);
  const [tagsInput, setTagsInput] = useState((patient?.tags ?? []).join(", "));

  const schema = isEdit ? updatePatientSchema : createPatientSchema;
  const defaultValues = {
    name: patient?.name ?? "",
    phone: patient?.phone ?? "",
    email: patient?.email ?? "",
    dob: patient?.dob ? patient.dob.slice(0, 10) : "",
    gender: (patient?.gender ?? "") as CreatePatientInput["gender"],
    bloodGroup: (patient?.bloodGroup ?? "") as CreatePatientInput["bloodGroup"],
    city: patient?.city ?? "",
    status: (patient?.status ?? "active") as CreatePatientInput["status"],
    notes: patient?.notes ?? "",
    insurance: {
      provider: patient?.insurance?.provider ?? "",
      policyNumber: patient?.insurance?.policyNumber ?? "",
      memberId: patient?.insurance?.memberId ?? "",
    },
    emergencyContact: {
      name: patient?.emergencyContact?.name ?? "",
      relationship: (patient?.emergencyContact?.relationship ?? "") as NonNullable<
        CreatePatientInput["emergencyContact"]
      >["relationship"],
      phone: patient?.emergencyContact?.phone ?? "",
    },
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePatientInput | UpdatePatientInput>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = async (values: CreatePatientInput | UpdatePatientInput) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        dob: values.dob || null,
        gender: values.gender || null,
        tags: tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean),
      };
      if (isEdit) {
        await apiPatch(`/api/patients/${patient!.id}`, payload);
        toast.success("Patient updated");
      } else {
        await apiPost("/api/patients", payload);
        toast.success("Patient added");
      }
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save patient");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{isEdit ? `Edit ${patient?.name}` : "Add patient"}</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {isEdit ? "Update the patient&apos;s record." : "Register a new patient."}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Full name" placeholder="Ram Bahadur" error={errors.name?.message} {...register("name")} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone" type="tel" placeholder="98XXXXXXXX" error={errors.phone?.message} {...register("phone")} />
            <Input label="Email (optional)" type="email" placeholder="patient@example.com" error={errors.email?.message} {...register("email")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Date of birth" type="date" error={errors.dob?.message} {...register("dob")} />
            <Select
              label="Gender"
              placeholder="Select"
              options={GENDERS.map((g) => ({ value: g, label: GENDER_LABELS[g] }))}
              error={errors.gender?.message}
              {...register("gender")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Blood group"
              placeholder="Select"
              options={BLOOD_GROUPS.map((b) => ({ value: b, label: b }))}
              error={errors.bloodGroup?.message}
              {...register("bloodGroup")}
            />
            <Input label="City" placeholder="Kathmandu" error={errors.city?.message} {...register("city")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {isEdit && (
              <Select
                label="Status"
                options={PATIENT_STATUSES.map((s) => ({ value: s, label: PATIENT_STATUS_LABELS[s] }))}
                error={errors.status?.message}
                {...register("status")}
              />
            )}
            <Input label="Tags (comma separated)" placeholder="VIP, Insurance" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              rows={3}
              placeholder="Any general notes about the patient"
              className={textareaClass}
              {...register("notes")}
            />
            {errors.notes?.message && <p className="mt-1.5 text-xs text-red-600">{errors.notes.message}</p>}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Insurance</h3>
            <div className="space-y-4">
              <Input label="Provider" placeholder="Company" error={errors.insurance?.provider?.message} {...register("insurance.provider")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Policy number" placeholder="POL-12345" error={errors.insurance?.policyNumber?.message} {...register("insurance.policyNumber")} />
                <Input label="Member ID" placeholder="MEM-001" error={errors.insurance?.memberId?.message} {...register("insurance.memberId")} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Emergency contact</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name" placeholder="Sita Bahadur" error={errors.emergencyContact?.name?.message} {...register("emergencyContact.name")} />
              <Input label="Relationship" placeholder="Spouse" error={errors.emergencyContact?.relationship?.message} {...register("emergencyContact.relationship")} />
            </div>
            <div className="mt-4">
              <Input label="Phone" type="tel" placeholder="98XXXXXXXX" error={errors.emergencyContact?.phone?.message} {...register("emergencyContact.phone")} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? "Save changes" : "Add patient"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
