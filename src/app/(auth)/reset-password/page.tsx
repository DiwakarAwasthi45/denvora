"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { KeyRound, Eye, EyeOff, Lock } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordInput } from "@/validations/auth.schema";
import { apiPost } from "@/lib/http";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500">Loading…</div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: emailParam, otp: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordInput) => {
    try {
      await apiPost("/api/auth/reset-password", values);
      toast.success("Password updated. You can now sign in.");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reset password");
    }
  };

  const handleResend = async () => {
    const email = (document.querySelector('input[name="email"]') as HTMLInputElement | null)?.value;
    if (!email || resending) return;
    setResending(true);
    try {
      await apiPost("/api/auth/resend-otp", { email, purpose: "password_reset" });
      toast.success("A new reset code was sent to your email.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-teal-50">
          <KeyRound className="size-6 text-teal-700" />
        </div>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Enter the 6-digit code from your email and choose a new password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@clinic.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Reset code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            hint="Sent to your email. Expires in 10 minutes."
            error={errors.otp?.message}
            {...register("otp")}
          />
          <Input
            label="New password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
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
            label="Confirm new password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            leftElement={<Lock className="size-4" />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" loading={isSubmitting} fullWidth size="lg">
            Reset password
          </Button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="flex w-full items-center justify-center text-sm font-medium text-teal-700 hover:text-teal-800 disabled:opacity-60"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="font-medium text-teal-700 hover:text-teal-800">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
