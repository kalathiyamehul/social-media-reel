"use client";

import { useAuth } from "@/context/auth-context";
import { ShieldAlert, User, ShieldCheck, Key } from "lucide-react";

export default function AdminDebugPage() {
  const { user, token, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="p-10">Loading auth state...</div>;

  return (
    <div className="max-w-2xl mx-auto p-10 space-y-8">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-8 w-8 text-amber-500" />
        <h1 className="text-2xl font-bold">Admin Auth Debugger</h1>
      </div>

      <div className="grid gap-4">
        <DebugItem 
          icon={Key} 
          label="Authenticated" 
          value={isAuthenticated ? "YES" : "NO"} 
          color={isAuthenticated ? "text-emerald-500" : "text-red-500"} 
        />
        <DebugItem 
          icon={User} 
          label="Full Name" 
          value={user?.fullName || "N/A"} 
        />
        <DebugItem 
          icon={ShieldCheck} 
          label="Detected Role" 
          value={user?.role || "MISSING / UNDEFINED"} 
          color={user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? "text-emerald-500 font-bold" : "text-amber-500"}
        />
        <div className="p-6 rounded-2xl bg-muted/30 border border-border">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Raw User Object</p>
          <pre className="text-[10px] overflow-auto bg-black/20 p-4 rounded-lg">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
        <strong>How to read this:</strong> If the "Detected Role" is not <code>SUPER_ADMIN</code>, the Admin Panel will <strong>always</strong> block you. This means either the database hasn't been updated with <code>prisma db push</code>, or you need to logout and log back in to refresh your token.
      </div>
    </div>
  );
}

function DebugItem({ icon: Icon, label, value, color = "text-foreground" }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className={`text-sm ${color}`}>{value}</span>
    </div>
  );
}
