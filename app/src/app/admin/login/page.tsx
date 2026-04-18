"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ShieldCheck, Mail, Lock, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      console.log("Admin Login Response:", json);

      if (!res.ok || json.status === "error") {
        throw new Error(json.message || "Login failed");
      }

      if (!json.data || !json.data.user) {
        throw new Error("Invalid response format: user data missing");
      }

      const { user, accessToken } = json.data;

      // Check for Admin Role explicitly
      if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized access. Administrator privileges required.");
      }

      // Success - Save to context
      login(accessToken, user, "admin_portal");
      toast.success("Welcome back, Commander.");
      router.push("/admin");
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-900/20 to-slate-950">
      <div className="w-full max-w-[440px] relative">
        {/* Background Decorations */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />

        <div className="relative glass-strong border-border/50 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden border">
          {/* Top Branding */}
          <div className="flex flex-col items-center text-center mb-10">
            <h1 className="text-3xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              Admin Portal
            </h1>
            <p className="mt-2 text-sm text-muted-foreground/80 font-medium">
              Enterprise Control Center
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] font-black text-muted-foreground/60 ml-1">
                  Admin Identity
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-purple-400" />
                  <Input
                    type="email"
                    placeholder="name@agency.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-foreground/[0.03] border-border/50 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] font-black text-muted-foreground/60 ml-1">
                  Access Key
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-purple-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-foreground/[0.03] border-border/50 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-purple-500/20 border-0 transition-all hover:scale-[1.02] active:scale-[0.98] group"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Authorize Access <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* System Footer */}
        <p className="mt-8 text-center text-[10px] text-muted-foreground/40 uppercase tracking-[0.3em] font-bold">
          CreatorEye Core Engine v1.0
        </p>
      </div>
    </div>
  );
}
