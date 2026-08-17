"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Save } from "lucide-react";
import { apiPatch } from "@/lib/http";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { TOOTH_CONDITIONS, TOOTH_CONDITION_INFO, type ToothCondition } from "@/constants/patients";
import type { SafePatientDetail, ToothEntry } from "@/types";

interface Props {
  detail: SafePatientDetail;
  canEdit: boolean;
}

const QUADRANTS = [
  { label: "Upper right", teeth: [1, 2, 3, 4, 5, 6, 7, 8] },
  { label: "Upper left", teeth: [9, 10, 11, 12, 13, 14, 15, 16] },
  { label: "Lower left", teeth: [17, 18, 19, 20, 21, 22, 23, 24] },
  { label: "Lower right", teeth: [25, 26, 27, 28, 29, 30, 31, 32] },
];

const AUTO_RESTORED: ToothCondition[] = ["filled", "crown", "bridge", "rootCanal", "implant", "sealant"];

function sameEntry(a: ToothEntry, b: ToothEntry): boolean {
  return a.condition === b.condition && a.restored === b.restored && (a.note ?? "") === (b.note ?? "");
}

export function ToothChartPanel({ detail, canEdit }: Props) {
  const router = useRouter();
  const initial = detail.toothChart;
  const [chart, setChart] = useState<ToothEntry[]>(initial);
  const [selected, setSelected] = useState<ToothCondition>("decay");
  const [saving, setSaving] = useState(false);

  const changed = chart.filter((entry, index) => !sameEntry(entry, initial[index] ?? entry));
  const dirty = changed.length > 0;

  const applyCondition = (toothNumber: number) => {
    if (!canEdit) return;
    setChart((prev) =>
      prev.map((entry) =>
        entry.tooth === toothNumber
          ? {
              ...entry,
              condition: selected,
              restored: selected === "missing" ? false : AUTO_RESTORED.includes(selected),
            }
          : entry
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPatch(`/api/patients/${detail.id}/teeth`, { teeth: changed });
      toast.success("Dental chart saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save dental chart");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Condition palette</CardTitle>
            <CardDescription>Pick a condition, then click a tooth to apply it.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {TOOTH_CONDITIONS.map((condition) => (
                <button
                  key={condition}
                  onClick={() => setSelected(condition)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected === condition
                      ? "border-teal-600 bg-teal-50 text-teal-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="size-3 rounded-full" style={{ backgroundColor: TOOTH_CONDITION_INFO[condition].color }} />
                  {TOOTH_CONDITION_INFO[condition].label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dental chart</CardTitle>
            <CardDescription>Universal tooth numbering (1–32).</CardDescription>
          </div>
          {canEdit && (
            <Button onClick={handleSave} loading={saving} disabled={!dirty}>
              <Save className="size-4" />
              {dirty ? `Save (${changed.length})` : "Saved"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {QUADRANTS.map((quadrant) => (
              <div key={quadrant.label}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{quadrant.label}</p>
                <div className="flex gap-1.5">
                  {quadrant.teeth.map((toothNumber) => {
                    const entry = chart.find((e) => e.tooth === toothNumber) ?? {
                      tooth: toothNumber,
                      condition: "healthy",
                      restored: false,
                    };
                    const info = TOOTH_CONDITION_INFO[entry.condition as ToothCondition] ?? TOOTH_CONDITION_INFO.healthy;
                    return (
                      <button
                        key={toothNumber}
                        disabled={!canEdit}
                        title={`Tooth ${toothNumber}: ${info.label}`}
                        onClick={() => applyCondition(toothNumber)}
                        className={`flex size-11 flex-col items-center justify-center rounded-lg text-[10px] font-semibold text-slate-800 shadow-sm transition-transform ${
                          canEdit ? "cursor-pointer hover:scale-105" : "cursor-default"
                        }`}
                        style={{ backgroundColor: info.color }}
                      >
                        <span>{toothNumber}</span>
                        {entry.condition === "missing" && <span className="text-xs leading-none">✕</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
