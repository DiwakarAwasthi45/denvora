import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-2">
        <Logo />
        <span className="text-xl font-semibold text-slate-900">Denvora</span>
      </div>

      <div className="w-full max-w-md">{children}</div>

      <p className="mt-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Denvora. All rights reserved.{" "}
        <Link href="/privacy" className="underline-offset-2 hover:underline">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="underline-offset-2 hover:underline">
          Terms
        </Link>
      </p>
    </div>
  );
}
