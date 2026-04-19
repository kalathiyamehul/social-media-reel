"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Users,
  Instagram,
  Linkedin,
  Facebook,
  Activity,
  AlertTriangle,
  TrendingUp,
  Loader2,
  BarChart3,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Timer,
  Film,
} from "lucide-react";

interface Analytics {
  overview: { totalUsers: number; totalInstagramCreators: number; totalLinkedInCreators: number; totalFacebookProfiles: number };
  content: { totalInstagramPosts: number; totalLinkedInPosts: number; totalFacebookAds: number };
  jobs: {
    reelAnalyses: { total: number; pending: number; failed: number; completed: number };
    linkedInReports: number;
    facebookAdReports: number;
  };
  recentUsers: { id: number; email: string; fullName: string; createdAt: string; role: string }[];
  topUsers: { id: number; email: string; fullName: string; role: string; reelAnalyses: number; templates: number }[];
}

interface ActivityItem {
  type: string;
  actor: string;
  description: string;
  timestamp: string;
  details?: any;
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${BASE}/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${BASE}/admin/activity?limit=10`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([analyticsJson, activityJson]) => {
        if (analyticsJson.data) setAnalytics(analyticsJson.data);
        else setError(analyticsJson.message || "Failed");
        if (activityJson.data) setActivities(activityJson.data.activities || []);
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [token]);

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
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const d = analytics;
  const errorRate = d.jobs.reelAnalyses.total > 0 ? ((d.jobs.reelAnalyses.failed / d.jobs.reelAnalyses.total) * 100).toFixed(1) : "0";
  const totalPosts = d.content.totalInstagramPosts + d.content.totalLinkedInPosts;
  const totalCreators = d.overview.totalInstagramCreators + d.overview.totalLinkedInCreators + d.overview.totalFacebookProfiles;

  return (
    <div className="space-y-8">
      {/* Hero Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ animationDelay: "0.1s" }}>
        <div className="admin-stat admin-stat--amber admin-animate-in">
          <div className="admin-stat__icon-bg"><Users className="h-10 w-10" /></div>
          <div className="admin-stat__value admin-count-up">{d.overview.totalUsers}</div>
          <div className="admin-stat__label">Total Users</div>
        </div>
        <div className="admin-stat admin-stat--emerald admin-animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="admin-stat__icon-bg"><BarChart3 className="h-10 w-10" /></div>
          <div className="admin-stat__value admin-count-up">{totalCreators}</div>
          <div className="admin-stat__label">Total Creators</div>
        </div>
        <div className="admin-stat admin-stat--purple admin-animate-in" style={{ animationDelay: "0.2s" }}>
          <div className="admin-stat__icon-bg"><Film className="h-10 w-10" /></div>
          <div className="admin-stat__value admin-count-up">{d.jobs.reelAnalyses.total}</div>
          <div className="admin-stat__label">Reel Analyses</div>
        </div>
        <div className="admin-stat admin-stat--sky admin-animate-in" style={{ animationDelay: "0.3s" }}>
          <div className="admin-stat__icon-bg"><Zap className="h-10 w-10" /></div>
          <div className="admin-stat__value admin-count-up">{totalPosts}</div>
          <div className="admin-stat__label">Posts Indexed</div>
        </div>
      </div>

      {/* Platform Breakdown + Job Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Distribution */}
        <div className="admin-card admin-animate-in" style={{ animationDelay: "0.2s" }}>
          <div className="admin-card__header">
            <div className="admin-card__header-left">
              <Activity className="h-5 w-5" style={{ color: "#f59e0b" }} />
              <h3 className="admin-card__title">Platform Distribution</h3>
            </div>
          </div>
          <div className="space-y-4">
            <PlatformBar
              icon={<Instagram className="h-4 w-4" />}
              label="Instagram"
              value={d.overview.totalInstagramCreators}
              total={totalCreators}
              color="#ec4899"
            />
            <PlatformBar
              icon={<Linkedin className="h-4 w-4" />}
              label="LinkedIn"
              value={d.overview.totalLinkedInCreators}
              total={totalCreators}
              color="#0ea5e9"
            />
            <PlatformBar
              icon={<Facebook className="h-4 w-4" />}
              label="Facebook"
              value={d.overview.totalFacebookProfiles}
              total={totalCreators}
              color="#3b82f6"
            />
          </div>
          <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-black" style={{ color: "#ec4899" }}>{d.content.totalInstagramPosts}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>IG Posts</p>
              </div>
              <div>
                <p className="text-lg font-black" style={{ color: "#0ea5e9" }}>{d.content.totalLinkedInPosts}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>LI Posts</p>
              </div>
              <div>
                <p className="text-lg font-black" style={{ color: "#3b82f6" }}>{d.content.totalFacebookAds}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>FB Ads</p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Pipeline */}
        <div className="admin-card lg:col-span-2 admin-animate-in" style={{ animationDelay: "0.3s" }}>
          <div className="admin-card__header">
            <div className="admin-card__header-left">
              <Zap className="h-5 w-5" style={{ color: "#8b5cf6" }} />
              <h3 className="admin-card__title">Job Pipeline</h3>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`admin-badge ${Number(errorRate) > 10 ? "admin-badge--red" : "admin-badge--emerald"}`}
              >
                {errorRate}% Error Rate
              </span>
            </div>
          </div>

          {/* Pipeline visual */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <PipelineStat icon={<BarChart3 className="h-4 w-4" />} label="Total" value={d.jobs.reelAnalyses.total} color="var(--foreground)" />
            <PipelineStat icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={d.jobs.reelAnalyses.completed} color="#10b981" />
            <PipelineStat icon={<Timer className="h-4 w-4" />} label="Pending" value={d.jobs.reelAnalyses.pending} color="#f59e0b" />
            <PipelineStat icon={<XCircle className="h-4 w-4" />} label="Failed" value={d.jobs.reelAnalyses.failed} color="#ef4444" />
          </div>

          {/* Progress bar */}
          {d.jobs.reelAnalyses.total > 0 && (
            <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "var(--muted)" }}>
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${(d.jobs.reelAnalyses.completed / d.jobs.reelAnalyses.total) * 100}%`,
                  background: "#10b981",
                }}
              />
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${(d.jobs.reelAnalyses.pending / d.jobs.reelAnalyses.total) * 100}%`,
                  background: "#f59e0b",
                }}
              />
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${(d.jobs.reelAnalyses.failed / d.jobs.reelAnalyses.total) * 100}%`,
                  background: "#ef4444",
                }}
              />
            </div>
          )}

          <div className="mt-6 pt-4 grid grid-cols-2 gap-6" style={{ borderTop: "1px solid var(--border)" }}>
            <div>
              <p className="text-xl font-black">{d.jobs.linkedInReports}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>LinkedIn Reports</p>
            </div>
            <div>
              <p className="text-xl font-black">{d.jobs.facebookAdReports}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>Facebook Ad Reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Users + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <div className="admin-card admin-animate-in" style={{ animationDelay: "0.4s" }}>
          <div className="admin-card__header">
            <div className="admin-card__header-left">
              <TrendingUp className="h-5 w-5" style={{ color: "#10b981" }} />
              <h3 className="admin-card__title">Top Users by Activity</h3>
            </div>
          </div>
          <div className="space-y-3">
            {d.topUsers.slice(0, 5).map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "oklch(1 0 0 / 3%)" }}>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.8 0.18 85 / 20%), oklch(0.6 0.22 25 / 15%))",
                    border: "1px solid oklch(0.8 0.18 85 / 20%)",
                    color: "#f59e0b",
                  }}
                >
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{u.fullName}</p>
                  <p className="text-[10px] truncate" style={{ color: "var(--muted-foreground)" }}>{u.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black">{u.reelAnalyses}</p>
                  <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>analyses</p>
                </div>
              </div>
            ))}
            {d.topUsers.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "var(--muted-foreground)" }}>No users yet</p>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="admin-card admin-animate-in" style={{ animationDelay: "0.5s" }}>
          <div className="admin-card__header">
            <div className="admin-card__header-left">
              <Clock className="h-5 w-5" style={{ color: "#0ea5e9" }} />
              <h3 className="admin-card__title">Recent Activity</h3>
            </div>
          </div>
          <div className="space-y-0">
            {activities.slice(0, 8).map((a, i) => (
              <div key={i} className="admin-activity-item">
                <div
                  className="admin-activity-dot"
                  style={{
                    background:
                      a.type === "USER_SIGNUP" ? "#10b981" :
                      a.type === "ANALYSIS_COMPLETED" ? "#8b5cf6" :
                      a.type === "ANALYSIS_FAILED" ? "#ef4444" :
                      a.type === "ADMIN_ACTION" ? "#f59e0b" :
                      "#0ea5e9",
                  }}
                />
                <div className="admin-activity-content">
                  <p className="admin-activity-text">{a.description}</p>
                  <p className="admin-activity-time">{formatTimeAgo(a.timestamp)}</p>
                </div>
                <span
                  className="admin-badge admin-badge--muted"
                  style={{ fontSize: "9px", padding: "2px 6px" }}
                >
                  {a.type.replace(/_/g, " ")}
                </span>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: "var(--muted-foreground)" }}>No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformBar({ icon, label, value, total, color }: { icon: React.ReactNode; label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" style={{ color }}>
          {icon}
          <span className="text-xs font-semibold">{label}</span>
        </div>
        <span className="text-xs font-black">{value}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function PipelineStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="text-center p-3 rounded-xl" style={{ background: "oklch(1 0 0 / 3%)" }}>
      <div className="flex items-center justify-center gap-1 mb-1" style={{ color }}>
        {icon}
      </div>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>{label}</p>
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
  return `${days}d ago`;
}
