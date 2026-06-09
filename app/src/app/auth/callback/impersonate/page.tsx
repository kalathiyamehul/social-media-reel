"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function ImpersonateHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const email = searchParams.get("email");

    if (!accessToken || !refreshToken) {
      toast.error("Invalid impersonation link.");
      router.replace("/login");
      return;
    }

    try {
      login(accessToken, { email, id: 0, fullName: "Impersonated User" } as any, "admin_impersonation");
      toast.success(`Successfully impersonating ${email || "User"}`);
      // Refresh user data from backend to get full user object
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (err) {
      console.error("Impersonation error:", err);
      toast.error("Failed to impersonate.");
      router.replace("/login");
    }
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/95">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-zinc-400 font-medium animate-pulse">Initializing impersonation session...</p>
      </div>
    </div>
  );
}

export default function ImpersonateCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black/95">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    }>
      <ImpersonateHandler />
    </Suspense>
  );
}
