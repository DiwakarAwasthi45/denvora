"use client";

import { PatientShell } from "@/components/portal/PatientShell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PatientShell>{children}</PatientShell>;
}
