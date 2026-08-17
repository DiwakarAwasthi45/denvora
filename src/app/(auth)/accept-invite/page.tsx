"use client";

import { Suspense, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Eye, EyeOff, Lock, Mail, PartyPopper } from "lucide-react";
import Link from "next/link";
import { acceptInviteSchema, type AcceptInviteInput } from "@/validations/auth.schema";
import { apiPost } from "@/lib/http";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500">Loading…</div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const masked = searchParams.get("masked") ?? email;
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { email, otp: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: AcceptInviteInput) => {
    try {
      await apiPost("/api/auth/accept-invite", values);
      toast.success("Welcome aboard! You can now sign in.");
      router.push("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to accept invitation";
      toast.error(message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-teal-50">
          <PartyPopper className="size-6 text-teal-700" />
        </div>
        <CardTitle>Accept your invitation</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join a clinic on Denvora. Enter the code from your invitation email and
          choose a password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="you@clinic.com"
            leftElement={<Mail className="size-4" />}
            error={errors.email?.message}
            {...register("email")}
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Invitation code <span className="font-normal text-slate-400">(sent to {masked})</span>
            </span>
            <OtpInputs
              value={otp}
              onChange={(v) => {
                setOtp(v);
                setValue("otp", v, { shouldValidate: true });
              }}
            />
            {errors.otp && (
              <p className="mt-1.5 text-center text-xs text-red-600" role="alert">
                {errors.otp.message}
              </p>
            )}
          </div>

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            leftElement={<Lock className="size-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
            error={errors.password?.message}
            {...register("password")}
          />
          <Input
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            leftElement={<Lock className="size-4" />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button type="submit" loading={isSubmitting} fullWidth size="lg">
            Accept invitation
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-teal-700 hover:text-teal-800">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
