"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ListOrdered,
  Menu,
  Stethoscope,
  UserRound,
  FileText,
  Receipt,
  Pill,
  Boxes,
  FlaskConical,
  Target,
  BarChart3,
  Bot,
  Crown,
  Building2,
  LineChart,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { SignOutButton } from "@/app/dashboard/_components/SignOutButton";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays },
      { href: "/dashboard/queue", label: "Queue", icon: ListOrdered },
      { href: "/dashboard/patients", label: "Patients", icon: UserRound },
    ],
  },
  {
    title: "Clinical",
    items: [
      { href: "/dashboard/treatments", label: "Treatments", icon: Stethoscope },
      { href: "/dashboard/prescriptions", label: "Prescriptions", icon: Pill },
      { href: "/dashboard/lab", label: "Lab Cases", icon: FlaskConical },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/dashboard/leads", label: "Leads", icon: Target },
      { href: "/dashboard/inventory", label: "Inventory", icon: Boxes },
      { href: "/dashboard/staff", label: "Staff", icon: Users },
      { href: "/dashboard/recalls", label: "Recalls", icon: ListOrdered },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/dashboard/billing", label: "Billing", icon: Receipt },
      { href: "/dashboard/expenses", label: "Expenses", icon: FileText },
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/dashboard/ai/copilot", label: "AI Copilot", icon: Bot },
      { href: "/dashboard/ai/advisor", label: "Business Advisor", icon: LineChart },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/dashboard/users", label: "Users & Roles", icon: Users },
      { href: "/dashboard/branches", label: "Branches", icon: Building2 },
      { href: "/dashboard/subscription", label: "Subscription", icon: Crown },
    ],
  },
];

function isCurrent(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

function SideNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-4 p-3">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          {!mobile && (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
          )}
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active = isCurrent(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-teal-50 text-teal-800"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    mobile && "text-slate-900"
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function DashboardSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden">
        <div className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="text-slate-600 hover:text-slate-900"
          >
            <Menu className="size-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo className="size-7" />
            <span className="text-lg font-semibold text-slate-900">Denvora</span>
          </Link>
          <div className="w-5" />
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
        <div
          className="absolute inset-y-0 left-0 flex h-full w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <Logo className="size-7" />
              <span className="text-lg font-semibold text-slate-900">Denvora</span>
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="text-slate-600 hover:text-slate-900"
            >
              <Stethoscope className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SideNav mobile />
          </div>
          <div className="border-t border-slate-200 p-3">
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex lg:fixed lg:inset-y-0 lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4">
          <Logo className="size-7" />
          <span className="text-xl font-semibold tracking-tight text-slate-900">Denvora</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SideNav />
        </div>
        <div className="border-t border-slate-200 p-3">
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
