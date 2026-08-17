"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Building2, CalendarDays, Armchair, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { onboardingSchema, type OnboardingInput } from "@/validations/onboarding.schema";
import { apiGet, apiPost } from "@/lib/http";
import { SUPPORTED_TIMEZONES, SUPPORTED_CURRENCIES } from "@/constants/locale";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import type { SafeClinic } from "@/types";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function Icon({ icon: IconComponent, className }: { icon: typeof Building2; className?: string }) {
  return <IconComponent className={className} />;
}

function defaultHours(): OnboardingInput["workingHours"] {
  return DAY_LABELS.map((_, day) => ({ day, open: "09:00", close: "17:00", isOpen: true }));
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [alreadyActive, setAlreadyActive] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      city: "",
      timezone: "Asia/Kathmandu",
      currency: "NPR",
      vatEnabled: false,
      vatRate: 13,
      workingHours: defaultHours(),
      chairs: [
        { name: "Chair 1", location: "" },
        { name: "Chair 2", location: "" },
        { name: "Chair 3", location: "" },
      ],
    },
  });

  const chairFields = useFieldArray({ control, name: "chairs" });
  const workingHours = useWatch({ control, name: "workingHours" });
  const vatEnabled = useWatch({ control, name: "vatEnabled" });

  useEffect(() => {
    apiGet<SafeClinic>("/api/clinic")
      .then((clinic) => {
        if (clinic.status === "active") {
          setAlreadyActive(true);
          return;
        }
        setValue("name", clinic.name);
        setValue("phone", clinic.phone ?? "");
        setValue("city", clinic.city ?? "");
        setValue("timezone", (clinic.timezone as OnboardingInput["timezone"]) ?? "Asia/Kathmandu");
        setValue("currency", (clinic.currency as OnboardingInput["currency"]) ?? "NPR");
      })
      .catch(() => {
        /* clinic fetch failure keeps defaults */
      })
      .finally(() => setLoading(false));
  }, [setValue]);

  const steps = useMemo(
    () => [
      {
        title: "Clinic details",
        icon: Building2,
        description: "Contact details and preferences",
      },
      {
        title: "Working hours",
        icon: CalendarDays,
        description: "When your clinic is open",
      },
      {
        title: "Dental chairs",
        icon: Armchair,
        description: "Add the chairs in your operatory",
      },
    ],
    []
  );

  const canNext = () => {
    const current = step;
    if (current === 0) {
      const v = getValues();
      return Boolean(v.name && v.name.length >= 2);
    }
    if (current === 1) {
      return workingHours.every((h) => !h.isOpen || h.close > h.open);
    }
    return chairFields.fields.length >= 1;
  };

  const onSubmit = async (values: OnboardingInput) => {
    try {
      await apiPost("/api/clinic/onboarding", values);
      toast.success("Your clinic is set up!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save setup");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl items-center justify-center py-24 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (alreadyActive) {
    return (
      <div className="mx-auto w-full max-w-2xl py-16">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-50">
              <Check className="size-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Your clinic is already set up</h2>
            <p className="mt-2 text-sm text-slate-500">
              You can review and update these details any time.
            </p>
            <Button className="mt-6" onClick={() => router.push("/dashboard")}>
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Set up your clinic</h1>
        <p className="mt-1 text-sm text-slate-500">A few details to activate your workspace.</p>

        <ol className="mt-6 flex items-center gap-2" aria-label="Setup steps">
          {steps.map((s, i) => (
            <li key={s.title} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  i === step
                    ? "bg-teal-700 text-white"
                    : i < step
                      ? "bg-teal-100 text-teal-800"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </button>
              {i < steps.length - 1 && (
                <span className={`h-px flex-1 ${i < step ? "bg-teal-300" : "bg-slate-200"}`} />
              )}
            </li>
          ))}
        </ol>
      </div>

      <Card>
        <CardHeader>
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-teal-50">
            <Icon icon={steps[step].icon} className="size-5 text-teal-700" />
          </div>
          <CardTitle>{steps[step].title}</CardTitle>
          <CardDescription>{steps[step].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {step === 0 && (
              <>
                <Input
                  label="Clinic name"
                  placeholder="Sunrise Dental Clinic"
                  leftElement={<Building2 className="size-4" />}
                  error={errors.name?.message}
                  {...register("name")}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Phone" type="tel" placeholder="98XXXXXXXX" error={errors.phone?.message} {...register("phone")} />
                  <Input label="City" placeholder="Kathmandu" error={errors.city?.message} {...register("city")} />
                </div>
                <Input label="Address" placeholder="Street, area" error={errors.address?.message} {...register("address")} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Timezone"
                    options={SUPPORTED_TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
                    error={errors.timezone?.message}
                    {...register("timezone")}
                  />
                  <Select
                    label="Currency"
                    options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                    error={errors.currency?.message}
                    {...register("currency")}
                  />
                </div>
                <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <span className="text-sm font-medium text-slate-700">Charge VAT on invoices</span>
                  <input
                    type="checkbox"
                    checked={vatEnabled}
                    onChange={(e) => setValue("vatEnabled", e.target.checked, { shouldValidate: true })}
                    className="size-4 accent-teal-700"
                  />
                </label>
                {vatEnabled && (
                  <Input
                    label="VAT rate (%)"
                    type="number"
                    min={0}
                    max={100}
                    error={errors.vatRate?.message}
                    {...register("vatRate", { valueAsNumber: true })}
                  />
                )}
              </>
            )}

            {step === 1 && (
              <div className="space-y-2">
                {workingHours.map((hour, index) => (
                  <div
                    key={hour.day}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3"
                  >
                    <div className="w-24 text-sm font-medium text-slate-700">
                      {DAY_LABELS[hour.day]}
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={hour.isOpen}
                        onChange={(e) => setValue(`workingHours.${index}.isOpen`, e.target.checked, { shouldValidate: true })}
                        className="size-4 accent-teal-700"
                      />
                      Open
                    </label>
                    {hour.isOpen ? (
                      <>
                        <input
                          type="time"
                          value={hour.open}
                          onChange={(e) => setValue(`workingHours.${index}.open`, e.target.value, { shouldValidate: true })}
                          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                        <span className="text-sm text-slate-400">to</span>
                        <input
                          type="time"
                          value={hour.close}
                          onChange={(e) => setValue(`workingHours.${index}.close`, e.target.value, { shouldValidate: true })}
                          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </>
                    ) : (
                      <span className="text-sm text-slate-400">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {chairFields.fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-3">
                    <div className="flex-1">
                      <Input
                        label={index === 0 ? "Chair" : undefined}
                        placeholder={`Chair ${index + 1}`}
                        error={errors.chairs?.[index]?.name?.message}
                        {...register(`chairs.${index}.name`)}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        label={index === 0 ? "Location (optional)" : undefined}
                        placeholder="e.g. Room 1"
                        {...register(`chairs.${index}.location`)}
                      />
                    </div>
                    {chairFields.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => chairFields.remove(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => chairFields.append({ name: `Chair ${chairFields.fields.length + 1}`, location: "" })}
                >
                  Add chair
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
                <ChevronLeft className="size-4" />
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
                  Continue
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button type="submit" loading={isSubmitting}>
                  <Check className="size-4" />
                  Activate clinic
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
