"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Plus, X } from "lucide-react";
import { apiPatch } from "@/lib/http";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { HABITS, MEDICAL_CONDITIONS, COMMON_ALLERGIES } from "@/constants/patients";
import type { SafeMedicalHistory, SafePatientDetail } from "@/types";

interface Props {
  detail: SafePatientDetail;
  canEdit: boolean;
}

const textareaClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";

function SectionToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-teal-600"
      />
      {label}
    </label>
  );
}

export function MedicalHistoryForm({ detail, canEdit }: Props) {
  const router = useRouter();
  const history = detail.history as SafeMedicalHistory | null;

  const [conditions, setConditions] = useState<Set<string>>(new Set(history?.conditions ?? []));
  const [allergies, setAllergies] = useState<Set<string>>(new Set(history?.allergies ?? []));
  const [customCondition, setCustomCondition] = useState("");
  const [customAllergy, setCustomAllergy] = useState("");
  const [medications, setMedications] = useState((history?.medications ?? []).join("\n"));
  const [smoking, setSmoking] = useState(history?.smoking ?? "never");
  const [alcohol, setAlcohol] = useState(history?.alcohol ?? "never");
  const [drugUse, setDrugUse] = useState(history?.drugUse ?? "never");
  const [pregnant, setPregnant] = useState(history?.pregnant ?? false);
  const [notes, setNotes] = useState(history?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const customConditions = [...conditions].filter((c) => !(MEDICAL_CONDITIONS as readonly string[]).includes(c));
  const customAllergies = [...allergies].filter((a) => !(COMMON_ALLERGIES as readonly string[]).includes(a));

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const addCustom = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string, clear: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setter((prev) => new Set(prev).add(trimmed));
    clear();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPatch(`/api/patients/${detail.id}/history`, {
        conditions: [...conditions],
        allergies: [...allergies],
        medications: medications.split("\n").map((m) => m.trim()).filter(Boolean),
        smoking,
        alcohol,
        drugUse,
        pregnant,
        notes,
      });
      toast.success("Medical history saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save medical history");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {history?.updatedAt && (
        <p className="text-sm text-slate-500">
          Last updated {new Date(history.updatedAt).toLocaleString()} {history.updatedByName ? `by ${history.updatedByName}` : ""}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Medical conditions</CardTitle>
          <CardDescription>Chronic conditions and systemic health issues relevant to dental care.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MEDICAL_CONDITIONS.map((condition) => (
              <SectionToggle
                key={condition}
                label={condition}
                checked={conditions.has(condition)}
                onChange={() => toggle(setConditions, condition)}
              />
            ))}
          </div>
          {customConditions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {customConditions.map((c) => (
                <Badge key={c} tone="warning">
                  {c}
                  {canEdit && (
                    <button onClick={() => toggle(setConditions, c)} className="ml-1.5 text-amber-700 hover:text-amber-900" aria-label={`Remove ${c}`}>
                      <X className="size-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
          {canEdit && (
            <div className="mt-4 flex gap-2">
              <input
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                placeholder="Add a custom condition"
                className={textareaClass}
              />
              <Button
                variant="outline"
                type="button"
                onClick={() => addCustom(setConditions, customCondition, () => setCustomCondition(""))}
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Allergies</CardTitle>
          <CardDescription>Known drug and material allergies. Flagged for treatment safety.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {COMMON_ALLERGIES.map((allergy) => (
              <SectionToggle
                key={allergy}
                label={allergy}
                checked={allergies.has(allergy)}
                onChange={() => toggle(setAllergies, allergy)}
              />
            ))}
          </div>
          {customAllergies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {customAllergies.map((a) => (
                <Badge key={a} tone="danger">
                  {a}
                  {canEdit && (
                    <button onClick={() => toggle(setAllergies, a)} className="ml-1.5 text-red-700 hover:text-red-900" aria-label={`Remove ${a}`}>
                      <X className="size-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
          {canEdit && (
            <div className="mt-4 flex gap-2">
              <input
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                placeholder="Add a custom allergy"
                className={textareaClass}
              />
              <Button
                variant="outline"
                type="button"
                onClick={() => addCustom(setAllergies, customAllergy, () => setCustomAllergy(""))}
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medications & habits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Current medications (one per line)</label>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              placeholder="Amoxicillin 500mg twice daily"
              className={`${textareaClass} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Smoking"
              disabled={!canEdit}
              value={smoking}
              onChange={(e) => setSmoking(e.target.value)}
              options={HABITS.map((h) => ({ value: h.value, label: h.label }))}
            />
            <Select
              label="Alcohol"
              disabled={!canEdit}
              value={alcohol}
              onChange={(e) => setAlcohol(e.target.value)}
              options={HABITS.map((h) => ({ value: h.value, label: h.label }))}
            />
            <Select
              label="Recreational drugs"
              disabled={!canEdit}
              value={drugUse}
              onChange={(e) => setDrugUse(e.target.value)}
              options={HABITS.map((h) => ({ value: h.value, label: h.label }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={pregnant}
              onChange={(e) => setPregnant(e.target.checked)}
              className="size-4 accent-teal-600"
            />
            Currently pregnant
          </label>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Additional notes</label>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Other medical history details"
              className={`${textareaClass} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500`}
            />
          </div>
          {canEdit && (
            <div className="flex justify-end">
              <Button onClick={handleSave} loading={saving}>
                Save medical history
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
