
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useParams } from "next/navigation";
import {
  Loader2,
  AlertTriangle,
  User,
  Mail,
  Calendar,
  ShieldCheck,
  Film,
  Settings2,
  Monitor,
  Clock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Timer,
} from "lucide-react";
import Link from "next/link";

interface UserDetail {
  id: number;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastLoginSource: string | null;
  profile: any;
  _count: {
    reelAnalyses: number;
    instagramTemplates: number;
    linkedInTemplates: number;
    sessions: number;
  };
  reelAnalyses: { id: number; reelUrl: string; creator: string; status: string; createdAt: string }[];
  templates: { templateName: string; createdAt: string }[];
  sessions: { id: number; ipAddress: string; createdAt: string; expiresAt: string; revokedAt: string | null }[];
}

export default function AdminUserDetailPage() {
  const { token } = useAuth();
  const params = useParams();
  const userId = params.id;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

  useEffect(() => {
    if (!token || !userId) return;
    fetch(`${BASE}/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setUser(json.data);
        else setError(json.message || "User not found");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [token, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#f59e0b" }} />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center py-32">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-red-400 ml-3">{error || "User not found"}</p>
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "#10b981";
      case "FAILED": return "#ef4444";
      case "PENDING": return "#f59e0b";
      default: return "var(--muted-foreground)";
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED": return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "FAILED": return <XCircle className="h-3.5 w-3.5" />;
      case "PENDING": return <Timer className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm transition-colors" style={{ color: "var(--muted-foreground)", textDecoration: "none" }}>
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Link>

      {/* User Profile Card */}
      <div className="admin-card admin-animate-in">
        <div className="flex flex-col sm:flex-row gap-6">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, oklch(0.8 0.18 85 / 25%), oklch(0.6 0.22 25 / 20%))",
              border: "1px solid oklch(0.8 0.18 85 / 25%)",
              color: "#f59e0b",
            }}
          >
            {user.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-xl font-black">{user.fullName}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className={`admin-badge ${user.role === "SUPER_ADMIN" ? "admin-badge--red" :
                    user.role === "ADMIN" ? "admin-badge--amber" :
                      "admin-badge--muted"
                  }`}>{user.role}</span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>ID: {user.id}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                <span className="text-xs truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                <span className="text-xs">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                <span className="text-xs">{user.lastLoginSource || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                <span className="text-xs">{user._count.sessions} sessions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="admin-stat admin-stat--purple admin-animate-in" style={{ animationDelay: "0.1s" }}>
          <Film className="h-5 w-5" style={{ position: "absolute", top: 12, right: 12, opacity: 0.15 }} />
          <div className="admin-stat__value">{user._count.reelAnalyses}</div>
          <div className="admin-stat__label">Analyses</div>
        </div>
        <div className="admin-stat admin-stat--amber admin-animate-in" style={{ animationDelay: "0.15s" }}>
          <Settings2 className="h-5 w-5" style={{ position: "absolute", top: 12, right: 12, opacity: 0.15 }} />
          <div className="admin-stat__value">{user._count.instagramTemplates}</div>
          <div className="admin-stat__label">IG Templates</div>
        </div>
        <div className="admin-stat admin-stat--sky admin-animate-in" style={{ animationDelay: "0.2s" }}>
          <Settings2 className="h-5 w-5" style={{ position: "absolute", top: 12, right: 12, opacity: 0.15 }} />
          <div className="admin-stat__value">{user._count.linkedInTemplates}</div>
          <div className="admin-stat__label">LI Templates</div>
        </div>
        <div className="admin-stat admin-stat--emerald admin-animate-in" style={{ animationDelay: "0.25s" }}>
          <Monitor className="h-5 w-5" style={{ position: "absolute", top: 12, right: 12, opacity: 0.15 }} />
          <div className="admin-stat__value">{user._count.sessions}</div>
          <div className="admin-stat__label">Sessions</div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reel Analyses */}
        <div className="admin-card admin-animate-in" style={{ animationDelay: "0.3s" }}>
          <div className="admin-card__header">
            <div className="admin-card__header-left">
              <Film className="h-5 w-5" style={{ color: "#8b5cf6" }} />
              <h3 className="admin-card__title">Reel Analyses</h3>
            </div>
            <span className="admin-badge admin-badge--purple">{user.reelAnalyses.length}</span>
          </div>
          <div className="space-y-2" style={{ maxHeight: 320, overflowY: "auto" }}>
            {user.reelAnalyses.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "oklch(1 0 0 / 3%)" }}>
                <div className="flex items-center gap-1" style={{ color: statusColor(a.status) }}>
                  {statusIcon(a.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{a.creator ? `@${a.creator}` : "Unknown"}</p>
                  <p className="text-[10px] truncate" style={{ color: "var(--muted-foreground)" }}>{a.reelUrl}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`admin-badge ${a.status === "COMPLETED" ? "admin-badge--emerald" :
                      a.status === "FAILED" ? "admin-badge--red" :
                        "admin-badge--amber"
                    }`} style={{ fontSize: "8px" }}>{a.status}</span>
                  <p className="text-[9px] mt-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {user.reelAnalyses.length === 0 && (
              <p className="text-xs text-center py-6" style={{ color: "var(--muted-foreground)" }}>No analyses yet</p>
            )}
          </div>
        </div>

        {/* Sessions */}
        <div className="admin-card admin-animate-in" style={{ animationDelay: "0.4s" }}>
          <div className="admin-card__header">
            <div className="admin-card__header-left">
              <Monitor className="h-5 w-5" style={{ color: "#0ea5e9" }} />
              <h3 className="admin-card__title">Login Sessions</h3>
            </div>
          </div>
          <div className="space-y-2" style={{ maxHeight: 320, overflowY: "auto" }}>
            {user.sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "oklch(1 0 0 / 3%)" }}>
                <div
                  className="admin-activity-dot"
                  style={{ background: s.revokedAt ? "#ef4444" : new Date(s.expiresAt) > new Date() ? "#10b981" : "var(--muted-foreground)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{s.ipAddress || "Unknown IP"}</p>
                  <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    Created: {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`admin-badge ${s.revokedAt ? "admin-badge--red" :
                    new Date(s.expiresAt) > new Date() ? "admin-badge--emerald" :
                      "admin-badge--muted"
                  }`} style={{ fontSize: "8px" }}>
                  {s.revokedAt ? "Revoked" : new Date(s.expiresAt) > new Date() ? "Active" : "Expired"}
                </span>
              </div>
            ))}
            {user.sessions.length === 0 && (
              <p className="text-xs text-center py-6" style={{ color: "var(--muted-foreground)" }}>No sessions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
