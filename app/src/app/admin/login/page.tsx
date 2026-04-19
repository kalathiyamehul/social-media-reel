"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ShieldCheck, Mail, Lock, Loader2, Key, ArrowRight, Activity, Terminal } from "lucide-react";
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

      if (!res.ok || json.status === "error") {
        throw new Error(json.message || "Access denied. Invalid credentials.");
      }

      if (!json.data || !json.data.user) {
        throw new Error("Invalid response: authentication data missing");
      }

      const { user, accessToken } = json.data;

      // Check for Admin Role explicitly
      if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized. Administrative privileges required for this portal.");
      }

      // Success
      login(accessToken, user, "admin_portal");
      toast.success("Identity verified. Welcome back, Commissioner.");
      router.replace("/admin");
    } catch (err: any) {
      toast.error(err.message || "An authentication error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#050508] relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#f59e0b 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* Glow effects */}
      <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-amber-500/5 rounded-full blur-[120px]" />
      <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-red-500/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-[420px] relative z-10 admin-animate-in">
        {/* Branding */}
        <div className="flex flex-col items-center mb-10 text-center">
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">
            Admin <span className="text-amber-500">Console</span>
          </h1>
          <p className="mt-2 text-[10px] font-bold tracking-[0.3em] text-muted-foreground/60 uppercase">
            Restricted Access • Level 4 Clearance
          </p>
        </div>

        {/* Login Card */}
        <div className="admin-card border-amber-500/10 shadow-2xl bg-black/40 backdrop-blur-xl group">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-px flex items-center gap-2">
                  <Mail className="h-3 w-3" /> Identity Index
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter admin email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm font-medium text-white focus:border-amber-500/50 focus:bg-white/[0.05] focus:outline-none transition-all placeholder:text-muted-foreground/40"
                  />
                  <div className="absolute inset-0 rounded-xl pointer-events-none border border-amber-500/0 group-focus-within:border-amber-500/20 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-px flex items-center gap-2">
                  <Key className="h-3 w-3" /> Access Cipher
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter security key..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm font-medium text-white focus:border-amber-500/50 focus:bg-white/[0.05] focus:outline-none transition-all placeholder:text-muted-foreground/40"
                  />
                  <div className="absolute inset-0 rounded-xl pointer-events-none border border-amber-500/0 group-focus-within:border-amber-500/20 transition-all" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-red-600 font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-amber-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Authorize <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          </form>
          <Link
            href="/login"
            className="text-[10px] text-muted-foreground hover:text-amber-500 transition-colors uppercase font-black tracking-widest"
            style={{ textDecoration: 'none' }}
          >
            ← Standard User Login
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -150% -150%; }
          100% { background-position: 150% 150%; }
        }
      `}</style>
    </div>
  );
}
