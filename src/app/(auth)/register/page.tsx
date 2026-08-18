"use client";

import { useState } from "react";
import { Eye, EyeOff, User, Mail, Lock, Phone, Building2, Stethoscope } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@/validations/auth.schema";
import { apiPost } from "@/lib/http";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      clinicName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterInput) => {
    try {
      const result = await apiPost<{ user: { email: string }; maskedEmail: string }>(
        "/api/auth/register",
        values
      );
      toast.success("Account created! You can now sign in.");
      router.push("/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create your account. Please try again.";
      toast.error(message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Set up your clinic workspace in minutes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Full name"
            size="lg"
            autoComplete="name"
            placeholder="Dr. Aaditya Sharma"
            leftElement={<User className="size-4" />}
            error={errors.name?.message}
            {...register("name")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              size="lg"
              autoComplete="email"
              placeholder="you@clinic.com"
              leftElement={<Mail className="size-4" />}
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Phone (optional)"
              type="tel"
              size="lg"
              autoComplete="tel"
              placeholder="98XXXXXXXX"
              leftElement={<Phone className="size-4" />}
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>
          <Input
            label="Clinic name"
            size="lg"
            placeholder="Sunrise Dental Clinic"
            leftElement={<Building2 className="size-4" />}
            error={errors.clinicName?.message}
            {...register("clinicName")}
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            size="lg"
            autoComplete="new-password"
            placeholder="Enter Your Password"
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
            size="lg"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            leftElement={<Lock className="size-4" />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button type="submit" loading={isSubmitting} fullWidth size="lg">
            <Stethoscope className="size-4" />
            Create account
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
