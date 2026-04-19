
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoading) return;

    if (!isAdmin && !isLoginPage) {
      router.replace("/admin/login");
    } else if (isAdmin && isLoginPage) {
      router.replace("/admin");
    }
  }, [isLoading, isAdmin, isLoginPage, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#f59e0b" }} />
      </div>
    );
  }

  // Allow the login page to show even if not admin
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAdmin) {
    return null; // Redirecting...
  }

  // The admin shell (sidebar, topbar) is handled by RouteGuard
  // This layout just does auth gating
  return <>{children}</>;
}
