"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ArrowLeft, Pencil, Trash2, History, ClipboardList, Table2 } from "lucide-react";
import { apiDelete } from "@/lib/http";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GENDER_LABELS, PATIENT_STATUS_LABELS } from "@/constants/patients";
import { PatientFormModal } from "./PatientFormModal";
import { PatientOverview } from "./PatientOverview";
import { MedicalHistoryForm } from "./MedicalHistoryForm";
import { ToothChartPanel } from "./ToothChartPanel";
import type { SafePatientDetail } from "@/types";

interface Props {
  detail: SafePatientDetail;
  canUpdate: boolean;
  canDelete: boolean;
  canEditHistory: boolean;
  canEditTeeth: boolean;
}

type Tab = "overview" | "history" | "teeth";

const STATUS_TONES: Record<string, "default" | "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  inactive: "neutral",
  deceased: "neutral",
};

const TABS: { key: Tab; label: string; icon: typeof History }[] = [
  { key: "overview", label: "Overview", icon: ClipboardList },
  { key: "history", label: "Medical history", icon: History },
  { key: "teeth", label: "Dental chart", icon: Table2 },
];

export function PatientDetail({ detail, canUpdate, canDelete, canEditHistory, canEditTeeth }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${detail.name}? This removes their medical history and chart too.`)) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/patients/${detail.id}`);
      toast.success("Patient deleted");
      router.push("/dashboard/patients");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete patient");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/dashboard/patients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to patients
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{detail.name}</h1>
            <Badge tone={STATUS_TONES[detail.status] ?? "neutral"}>
              {PATIENT_STATUS_LABELS[detail.status as keyof typeof PATIENT_STATUS_LABELS] ?? detail.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {detail.gender ? GENDER_LABELS[detail.gender as keyof typeof GENDER_LABELS] ?? detail.gender : "Gender"} ·{" "}
            {detail.phone || "No phone"} · {detail.city || "No city"}
          </p>
          {detail.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {detail.tags.map((tag) => (
                <Badge key={tag} tone="default">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" onClick={handleDelete} loading={deleting} disabled={deleting}>
              {!deleting && <Trash2 className="size-4" />}
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-800"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <PatientOverview detail={detail} canUpdate={canUpdate} onEdit={() => setEditing(true)} />}
      {tab === "history" && <MedicalHistoryForm detail={detail} canEdit={canEditHistory} />}
      {tab === "teeth" && <ToothChartPanel detail={detail} canEdit={canEditTeeth} />}

      {editing && (
        <PatientFormModal
          patient={detail}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
