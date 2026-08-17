"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { GENDER_LABELS } from "@/constants/patients";
import type { SafePatientDetail } from "@/types";

interface Props {
  detail: SafePatientDetail;
  canUpdate: boolean;
  onEdit: () => void;
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );
}

function formatDob(dob?: string | null): string {
  if (!dob) return "";
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function PatientOverview({ detail, canUpdate, onEdit }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profile</CardTitle>
          {canUpdate && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="Date of birth" value={formatDob(detail.dob)} />
            <InfoRow label="Gender" value={detail.gender ? (GENDER_LABELS[detail.gender as keyof typeof GENDER_LABELS] ?? detail.gender) : ""} />
            <InfoRow label="Blood group" value={detail.bloodGroup} />
            <InfoRow label="Phone" value={detail.phone} />
            <InfoRow label="Email" value={detail.email} />
            <InfoRow label="City" value={detail.city} />
          </dl>
          <div className="mt-5 border-t border-slate-100 pt-5">
            <InfoRow label="Address" value={detail.address} />
          </div>
          {detail.notes && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <InfoRow label="Notes" value={detail.notes} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Insurance</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <InfoRow label="Provider" value={detail.insurance?.provider} />
              <InfoRow label="Policy number" value={detail.insurance?.policyNumber} />
              <InfoRow label="Member ID" value={detail.insurance?.memberId} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency contact</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <InfoRow label="Name" value={detail.emergencyContact?.name} />
              <InfoRow label="Relationship" value={detail.emergencyContact?.relationship} />
              <InfoRow label="Phone" value={detail.emergencyContact?.phone} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
