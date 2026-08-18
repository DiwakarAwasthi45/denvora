"use client";

import { Suspense, useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/validations/auth.schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      await signIn("credentials", {
        email: values.email,
        password: values.password,
        callbackUrl: callbackUrl,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
        throw error;
      }
      setServerError("Unable to sign in right now. Please try again in a moment.");
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-lg shadow-slate-200/50">
      <CardHeader className="border-0 px-7 pb-2 pt-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-100">
          <Lock className="size-6 text-teal-700" aria-hidden />
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</CardTitle>
        <CardDescription className="mt-2">Sign in to your clinic workspace to continue</CardDescription>
      </CardHeader>

      <CardContent className="px-7 pb-8 pt-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {serverError}
            </div>
          )}

          <Input
            label="Email address"
            type="email"
            size="lg"
            autoComplete="email"
            placeholder="dentist@clinic.com"
            leftElement={<Mail className="size-4" />}
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            size="lg"
            autoComplete="current-password"
            placeholder="Enter your password"
            leftElement={<Lock className="size-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-slate-400 transition-colors hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-800"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={isSubmitting} fullWidth size="lg" className="group">
            Sign in
            {!isSubmitting && (
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            )}
          </Button>

          <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-slate-400">
            <ShieldCheck className="size-3.5 text-teal-600" aria-hidden />
            Secure sign-in · sessions auto-expire after 24h
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New to Denvora?{" "}
          <Link href="/register" className="font-medium text-teal-700 transition-colors hover:text-teal-800">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500">Loading…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
