"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import Link from "next/link";
import { Mail } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/validations/auth.schema";
import { apiPost } from "@/lib/http";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    try {
      const result = await apiPost<{ maskedEmail: string }>("/api/auth/forgot-password", values);
      setSentTo(result.maskedEmail);
      toast.success("If the account exists, a reset code has been sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send reset code");
    }
  };

  if (sentTo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account exists for <span className="font-medium text-slate-700">{sentTo}</span>, a
            6-digit reset code has been sent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href={`/reset-password?email=${encodeURIComponent(sentTo)}`}>
            <Button fullWidth>I have my code — reset password</Button>
          </Link>
          <Link href="/login" className="block text-center text-sm text-slate-500 hover:text-slate-700">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>
          Enter your account email and we&apos;ll send you a 6-digit code to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@clinic.com"
            leftElement={<Mail className="size-4" />}
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" loading={isSubmitting} fullWidth size="lg">
            Send reset code
          </Button>
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
