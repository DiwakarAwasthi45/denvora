import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { APP_NAME } from "@/constants/config";

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-lg font-semibold text-slate-900">{APP_NAME}</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Pricing
            </Link>
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
            <Button size="sm">
              <Link href="/register" className="inline-flex items-center gap-1.5">
                Get started <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 text-center text-xs text-slate-400 sm:px-6">
          <div className="flex items-center gap-2">
            <Logo className="size-5" />
            <span className="font-medium text-slate-500">{APP_NAME}</span>
          </div>
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <p>
            <Link href="/privacy" className="underline-offset-2 hover:underline">
              Privacy
            </Link>{" "}
            ·{" "}
            <Link href="/terms" className="underline-offset-2 hover:underline">
              Terms
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
