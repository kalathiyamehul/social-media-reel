"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { PipelineProvider } from "@/context/pipeline-context";
import { Loader2 } from "lucide-react";

const PUBLIC_PATHS = ["/login", "/signup", "/admin/login"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname?.startsWith(p + "/"));

  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated && !isPublic) {
      // Specialized redirect for admin routes
      if (pathname?.startsWith("/admin")) {
        router.replace("/admin/login");
      } else {
        router.replace("/login");
      }
    }
    
    // Redirect away from login/signup if already authenticated
    if (isAuthenticated && isPublic) {
      // If they logged in to admin, keep them in admin
      if (pathname?.startsWith("/admin")) {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    }
  }, [isAuthenticated, isLoading, isPublic, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050508]">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    );
  }

  // Auth pages — plain, no sidebar
  if (isPublic) {
    return <>{children}</>;
  }

  // Not authenticated — spinner while redirect fires
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050508]">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    );
  }

  // Authenticated — full dashboard shell
  return (
    <PipelineProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 overflow-auto min-h-screen">
          <TopBar />
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        </main>
      </SidebarProvider>
    </PipelineProvider>
  );
}
