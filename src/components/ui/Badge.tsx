import { cn } from "@/lib/cn";

export function Badge({
  className,
  children,
  tone = "default",
}: {
  className?: string;
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "neutral";
}) {
  const tones: Record<string, string> = {
    default: "bg-teal-50 text-teal-800 border-teal-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-red-50 text-red-800 border-red-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
