"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "react-toastify";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  };

  return (
    <Button variant="outline" onClick={handleSignOut}>
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
