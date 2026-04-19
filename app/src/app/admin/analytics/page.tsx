"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Loader2,
  AlertTriangle,
  TrendingUp,
  Users,
  Instagram,
  Linkedin,
  BarChart3,
  Film,
} from "lucide-react";

interface GrowthData {
  userGrowth: { date: string; count: number }[];
  analysisActivity: { date: string; count: number }[];
  creatorGrowth: {
    instagram: { date: string; count: number }[];
    linkedin: { date: string; count: number }[];
  };
  topCreators: {
    instagram: { username: string; name: string; profilePicUrl: string; followersCount: number; postsCount: number }[];
    linkedin: { profileUrl: string; name: string; profilePic: string; followersCount: number; postsCount: number; reportsCount: number }[];
  };
  templateUsage: { templateName: string; usageCount: number }[];
  statusBreakdown: { status: string; count: number }[];
}

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  const BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${BASE}/admin/analytics/growth?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setData(json.data);
        else setError(json.message || "Failed to load analytics");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [token, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#f59e0b" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
        <p className="text-sm text-red-400 ml-3">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {[7, 14, 30, 60, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className="admin-badge"
            style={{
              background: days === d ? "oklch(0.8 0.18 85 / 15%)" : "var(--muted)",
              borderColor: days === d ? "oklch(0.8 0.18 85 / 30%)" : "var(--border)",
              color: days === d ? "#f59e0b" : "var(--muted-foreground)",
              cursor: "pointer",
              padding: "6px 14px",
              fontSize: "11px",
            }}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="admin-card admin-animate-in">
          <div className="admin-card__header">
            <div className="admin-card__header-left">
              <Users className="h-5 w-5" style={{ color: "#f59e0b" }} />
              <h3 className="admin-card__title">User Signups</h3>
            </div>
            <span className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>
              {data.userGrowth.reduce((sum, d) => sum + d.count, 0)} total
            </span>
          </div>
          <MiniBarChart data={data.userGrowth} color="#f59e0b" />
        </div>

        {/* Analysis Activity */}
        <div className="admin-card admin-animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="admin-card__header">
            <div className="admin-card__header-left">
              <Film className="h-5 w-5" style={{ color: "#8b5cf6" }} />
              <h3 className="admin-card__title">Reel Analyses</h3>
            </div>
            <span className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>
              {data.analysisActivity.reduce((sum, d) => sum + d.count, 0)} total
            </span>
          </div>
          <MiniBarChart data={data.analysisActivity} color="#8b5cf6" />
        </div>

        {/* Instagram Creator Growth */}
        <div className="admin-card admin-animate-in" style={{ animationDelay: "0.2s" }}>
          <div className="admin-card__header">
            <div className="admin-card__header-left">
              <Instagram className="h-5 w-5" style={{ color: "#ec4899" }} />
              <h3 className="admin-card__title">Instagram Creator Growth</h3>
            </div>
          </div>
          <MiniBarChart data={data.creatorGrowth.instagram} color="#ec4899" />
        </div>

        {/* LinkedIn Creator Growth */}
        <div className="admin-card admin-animate-in" style={{ animationDelay: "0.3s" }}>
          <div className="admin-card__header">
            <div className="admin-card__header-left">
              <Linkedin className="h-5 w-5" style={{ color: "#0ea5e9" }} />
              <h3 className="admin-card__title">LinkedIn Creator Growth</h3>
            </div>
          </div>
          <MiniBarChart data={data.creatorGrowth.linkedin} color="#0ea5e9" />
        </div>
      </div>

      {/* Top Creators + Template Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top IG Creators */}
        <div className="admin-card admin-animate-in" style={{ animationDelay: "0.3s" }}>
          <div className="admin-card__header">
            <div className="admin-card__header-left">
              <Instagram className="h-5 w-5" style={{ color: "#ec4899" }} />
              <h3 className="admin-card__title">Most Researched (IG)</h3>
            </div>
          </div>
          <div className="space-y-3">
            {data.topCreators.instagram.slice(0, 7).map((c, i) => (
              <div key={c.username} className="flex items-center gap-3">
                <span className="text-xs font-black w-5" style={{ color: "var(--muted-foreground)", opacity: 0.4 }}>
                  {i + 1}
                </span>
                {c.profilePicUrl ? (
                  <img src={c.profilePicUrl} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: "oklch(0.7 0.2 340 / 15%)", color: "#ec4899" }}>
                    {c.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">@{c.username}</p>
                </div>
                <span className="text-xs font-black">{c.postsCount}</span>
                <span className="text-[9px]" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>posts</span>
              </div>
            ))}
            {data.topCreators.instagram.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: "var(--muted-foreground)" }}>No data</p>
            )}
          </div>
        </div>

        {/* Top LI Creators */}
        <div className="admin-card admin-animate-in" style={{ animationDelay: "0.4s" }}>
          <div className="admin-card__header">
            <div className="admin-card__header-left">
              <Linkedin className="h-5 w-5" style={{ color: "#0ea5e9" }} />
              <h3 className="admin-card__title">Most Researched (LI)</h3>
            </div>
          </div>
          <div className="space-y-3">
            {data.topCreators.linkedin.slice(0, 7).map((c, i) => (
              <div key={c.profileUrl} className="flex items-center gap-3">
                <span className="text-xs font-black w-5" style={{ color: "var(--muted-foreground)", opacity: 0.4 }}>
                  {i + 1}
                </span>
                {c.profilePic ? (
                  <img src={c.profilePic} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: "oklch(0.7 0.15 230 / 15%)", color: "#0ea5e9" }}>
                    {(c.name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{c.name || "Unknown"}</p>
                </div>
                <span className="text-xs font-black">{c.reportsCount}</span>
                <span className="text-[9px]" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>reports</span>
              </div>
            ))}
            {data.topCreators.linkedin.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: "var(--muted-foreground)" }}>No data</p>
            )}
          </div>
        </div>

        {/* Template Usage */}
        <div className="admin-card admin-animate-in" style={{ animationDelay: "0.5s" }}>
          <div className="admin-card__header">
            <div className="admin-card__header-left">
              <BarChart3 className="h-5 w-5" style={{ color: "#f59e0b" }} />
              <h3 className="admin-card__title">Template Usage</h3>
            </div>
          </div>
          <div className="space-y-3">
            {data.templateUsage.slice(0, 8).map((t, i) => {
              const maxUsage = data.templateUsage[0]?.usageCount || 1;
              return (
                <div key={t.templateName} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">{t.templateName}</span>
                    <span className="text-xs font-black">{t.usageCount}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(t.usageCount / maxUsage) * 100}%`,
                        background: "#f59e0b",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {data.templateUsage.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: "var(--muted-foreground)" }}>No template data</p>
            )}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      {data.statusBreakdown.length > 0 && (
        <div className="admin-card admin-animate-in" style={{ animationDelay: "0.5s" }}>
          <div className="admin-card__header">
            <div className="admin-card__header-left">
              <TrendingUp className="h-5 w-5" style={{ color: "#10b981" }} />
              <h3 className="admin-card__title">Analysis Status Distribution</h3>
            </div>
          </div>
          <div className="flex gap-4 flex-wrap">
            {data.statusBreakdown.map((s) => {
              const total = data.statusBreakdown.reduce((sum, item) => sum + item.count, 0);
              const pct = total > 0 ? ((s.count / total) * 100).toFixed(1) : "0";
              const statusColors: Record<string, string> = {
                COMPLETED: "#10b981",
                PENDING: "#f59e0b",
                FAILED: "#ef4444",
                PROCESSING: "#0ea5e9",
              };
              return (
                <div key={s.status} className="flex-1 min-w-[120px] p-4 rounded-xl text-center" style={{ background: "oklch(1 0 0 / 3%)" }}>
                  <p className="text-2xl font-black" style={{ color: statusColors[s.status] || "var(--foreground)" }}>{s.count}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>{s.status}</p>
                  <p className="text-xs font-bold mt-1" style={{ color: statusColors[s.status] || "var(--muted-foreground)" }}>{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniBarChart({ data, color }: { data: { date: string; count: number }[]; color: string }) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60px]">
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>No data for this period</p>
      </div>
    );
  }

  return (
    <div className="admin-mini-chart" style={{ height: "60px" }}>
      {data.map((d, i) => (
        <div
          key={i}
          className="admin-mini-chart__bar"
          style={{
            height: `${Math.max(4, (d.count / maxVal) * 100)}%`,
            background: color,
          }}
          title={`${d.date}: ${d.count}`}
        />
      ))}
    </div>
  );
}
