"use client";

import { Suspense, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { MailCheck, RotateCcw } from "lucide-react";
import Link from "next/link";
import { verifyEmailSchema, type VerifyEmailInput } from "@/validations/auth.schema";
import { apiPost } from "@/lib/http";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function OtpInputs({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const handleChange = (index: number, char: string) => {
    const clean = char.replace(/\D/g, "");
    if (!clean) return;
    const next = value.split("");
    next[index] = clean;
    onChange(next.join("").slice(0, 6));
    if (index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (pasted) onChange(pasted);
          }}
          aria-label={`Digit ${index + 1}`}
          className="size-12 rounded-lg border border-slate-300 text-center text-xl font-semibold text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        />
      ))}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500">Loading…</div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const masked = searchParams.get("masked") ?? email;  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    setError,
  } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email, otp: "" },
  });

  const onSubmit = async (values: VerifyEmailInput) => {
    try {
      await apiPost("/api/auth/verify-email", values);
      toast.success("Email verified! You can now sign in.");
      router.push("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed";
      toast.error(message);
      setError("otp", { message });
    }
  };

  const handleResend = async () => {
    if (!email || sending) return;
    setSending(true);
    try {
      const result = await apiPost<{ maskedEmail: string }>("/api/auth/resend-otp", {
        email,
        purpose: "email_verification",
      });
      toast.success(`A new code was sent to ${result.maskedEmail}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resend code");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-teal-50">
          <MailCheck className="size-6 text-teal-700" />
        </div>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We sent a 6-digit code to <span className="font-medium text-slate-700">{masked}</span>. Enter it
          below to activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <input type="hidden" value={email} {...{ readOnly: true }} name="email" />
          <OtpInputs
            value={otp}
            onChange={(v) => {
              setOtp(v);
              setValue("otp", v, { shouldValidate: true });
            }}
          />
          {errors.otp && (
            <p className="text-center text-xs text-red-600" role="alert">
              {errors.otp.message}
            </p>
          )}

          <Button type="submit" loading={isSubmitting} fullWidth size="lg">
            Verify email
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800 disabled:opacity-60"
          >
            <RotateCcw className="size-3.5" />
            {sending ? "Sending…" : "Resend code"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already verified?{" "}
          <Link href="/login" className="font-medium text-teal-700 hover:text-teal-800">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
