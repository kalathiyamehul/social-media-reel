"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Activity,
  Loader2,
  AlertTriangle,
  UserPlus,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  Filter,
  RefreshCw,
} from "lucide-react";

interface ActivityItem {
  type: string;
  actor: string;
  description: string;
  timestamp: string;
  details?: any;
}

const activityTypes = [
  { key: "", label: "All", color: "var(--foreground)" },
  { key: "USER_SIGNUP", label: "Signups", color: "#10b981" },
  { key: "ANALYSIS_COMPLETED", label: "Completed", color: "#8b5cf6" },
  { key: "ANALYSIS_FAILED", label: "Failed", color: "#ef4444" },
  { key: "ANALYSIS_STARTED", label: "Started", color: "#f59e0b" },
  { key: "REPORT_GENERATED", label: "Reports", color: "#0ea5e9" },
  { key: "ADMIN_ACTION", label: "Admin", color: "#f59e0b" },
];

const typeIcons: Record<string, React.ReactNode> = {
  USER_SIGNUP: <UserPlus className="h-4 w-4" />,
  ANALYSIS_COMPLETED: <CheckCircle2 className="h-4 w-4" />,
  ANALYSIS_FAILED: <XCircle className="h-4 w-4" />,
  ANALYSIS_STARTED: <Activity className="h-4 w-4" />,
  REPORT_GENERATED: <FileText className="h-4 w-4" />,
  ADMIN_ACTION: <ShieldCheck className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
  USER_SIGNUP: "#10b981",
  ANALYSIS_COMPLETED: "#8b5cf6",
  ANALYSIS_FAILED: "#ef4444",
  ANALYSIS_STARTED: "#f59e0b",
  REPORT_GENERATED: "#0ea5e9",
  ADMIN_ACTION: "#f59e0b",
};

export default function AdminActivityPage() {
  const { token } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("");

  const BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

  const fetchActivities = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filterType) params.set("type", filterType);
      const res = await fetch(`${BASE}/admin/activity?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.data) setActivities(json.data.activities || []);
      else setError(json.message || "Failed");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [token, filterType]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  // Count by type
  const typeCounts: Record<string, number> = {};
  activities.forEach((a) => {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Type distribution */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {Object.entries(typeCounts).slice(0, 6).map(([type, count]) => (
          <div
            key={type}
            className="admin-card text-center cursor-pointer"
            style={{ padding: "12px 8px", borderColor: filterType === type ? typeColors[type] || "var(--border)" : "var(--border)" }}
            onClick={() => setFilterType(filterType === type ? "" : type)}
          >
            <div className="flex items-center justify-center mb-1" style={{ color: typeColors[type] || "var(--foreground)" }}>
              {typeIcons[type] || <Activity className="h-4 w-4" />}
            </div>
            <p className="text-lg font-black" style={{ color: typeColors[type] || "var(--foreground)" }}>{count}</p>
            <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
              {type.replace(/_/g, " ")}
            </p>
          </div>
        ))}
      </div>

      {/* Filters + Refresh */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
        {activityTypes.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterType(t.key)}
            className="admin-badge"
            style={{
              cursor: "pointer",
              padding: "5px 12px",
              fontSize: "10px",
              background: filterType === t.key ? `${t.color}20` : "var(--muted)",
              borderColor: filterType === t.key ? `${t.color}40` : "var(--border)",
              color: filterType === t.key ? t.color : "var(--muted-foreground)",
            }}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={fetchActivities}
          className="admin-topbar__icon-btn ml-auto"
          style={{ width: 32, height: 32 }}
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Activity Stream */}
      <div className="admin-card admin-animate-in" style={{ padding: "16px 24px" }}>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#f59e0b" }} />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="admin-empty">
            <Activity className="admin-empty__icon" />
            <p className="admin-empty__text">No activity found</p>
          </div>
        ) : (
          <div className="space-y-0">
            {activities.map((a, i) => {
              const color = typeColors[a.type] || "var(--muted-foreground)";
              return (
                <div key={i} className="admin-activity-item admin-animate-in" style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s` }}>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                    style={{ background: `${color}15`, color }}
                  >
                    {typeIcons[a.type] || <Activity className="h-4 w-4" />}
                  </div>
                  <div className="admin-activity-content">
                    <p className="admin-activity-text">{a.description}</p>
                    <p className="admin-activity-time">{formatTimeAgo(a.timestamp)}</p>
                  </div>
                  <span
                    className="admin-badge admin-badge--muted flex-shrink-0"
                    style={{ fontSize: "8px", padding: "2px 6px" }}
                  >
                    {a.type.replace(/_/g, " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
