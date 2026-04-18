"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Instagram,
  Linkedin,
  Facebook,
  BarChart3,
  Activity,
  AlertTriangle,
  TrendingUp,
  Loader2,
  ArrowUpRight,
  Zap,
  Database,
  Clock,
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

export default function AdminDashboard() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE}/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setAnalytics(json.data);
        else setError(json.message || "Failed to load analytics");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
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

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24 pt-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 shadow-lg shadow-red-500/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            System-wide analytics, user management, and scraped data explorer.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 text-sm font-semibold hover:bg-purple-500/20 transition-colors">
            <Users className="h-4 w-4" /> Users
          </Link>
          <Link href="/admin/creators" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold hover:bg-emerald-500/20 transition-colors">
            <Database className="h-4 w-4" /> Creators
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={d.overview.totalUsers} color="purple" />
        <StatCard icon={Instagram} label="Instagram Creators" value={d.overview.totalInstagramCreators} color="pink" />
        <StatCard icon={Linkedin} label="LinkedIn Creators" value={d.overview.totalLinkedInCreators} color="sky" />
        <StatCard icon={Facebook} label="Facebook Profiles" value={d.overview.totalFacebookProfiles} color="blue" />
      </div>

      {/* Job Status & Error Rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Reel Analysis Pipeline */}
        <div className="col-span-2 rounded-3xl bg-background/50 backdrop-blur-xl border border-border/50 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-bold">Job Pipeline</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-3xl font-black tracking-tight">{d.jobs.reelAnalyses.total}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">Total Reel Jobs</p>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-emerald-500">{d.jobs.reelAnalyses.completed}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">Completed</p>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-amber-500">{d.jobs.reelAnalyses.pending}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">Pending</p>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-red-500">{d.jobs.reelAnalyses.failed}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">Failed</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border/30 grid grid-cols-2 gap-6">
            <div>
              <p className="text-2xl font-black tracking-tight">{d.jobs.linkedInReports}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">LinkedIn Reports</p>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight">{d.jobs.facebookAdReports}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">Facebook Ad Reports</p>
            </div>
          </div>
        </div>

        {/* Error Rate Card */}
        <div className="rounded-3xl bg-background/50 backdrop-blur-xl border border-border/50 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold">Health</h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className={`text-5xl font-black tracking-tight ${Number(errorRate) > 10 ? 'text-red-500' : 'text-emerald-500'}`}>{errorRate}%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">Error Rate</p>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight">{d.content.totalInstagramPosts + d.content.totalLinkedInPosts}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">Posts Indexed</p>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight">{d.content.totalFacebookAds}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">Ads Indexed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Users & Recent Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Users */}
        <div className="rounded-3xl bg-background/50 backdrop-blur-xl border border-border/50 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-bold">Top Users</h2>
          </div>
          <div className="space-y-3">
            {d.topUsers.slice(0, 5).map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-foreground/[0.02] border border-border/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 text-purple-500 text-xs font-black flex-shrink-0">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{u.fullName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black">{u.reelAnalyses}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50">analyses</p>
                </div>
              </div>
            ))}
            {d.topUsers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="rounded-3xl bg-background/50 backdrop-blur-xl border border-border/50 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-5 w-5 text-sky-500" />
            <h2 className="text-lg font-bold">Recent Signups</h2>
          </div>
          <div className="space-y-3">
            {d.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-foreground/[0.02] border border-border/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/20 text-sky-500 text-xs font-bold flex-shrink-0">
                  {u.fullName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{u.fullName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    u.role === 'SUPER_ADMIN' ? 'bg-red-500/10 text-red-500' :
                    u.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-muted text-muted-foreground'
                  }`}>{u.role}</span>
                  <p className="text-[9px] text-muted-foreground/50 mt-1">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-500",
    pink: "from-pink-500/20 to-pink-600/10 border-pink-500/20 text-pink-500",
    sky: "from-sky-500/20 to-sky-600/10 border-sky-500/20 text-sky-500",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-500",
  };
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorMap[color]} border p-6`}>
      <div className="absolute top-3 right-3 opacity-20">
        <Icon className="h-10 w-10" />
      </div>
      <p className="text-3xl font-black tracking-tight">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">{label}</p>
    </div>
  );
}
