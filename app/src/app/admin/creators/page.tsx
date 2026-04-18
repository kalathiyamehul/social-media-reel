"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Instagram,
  Linkedin,
  Facebook,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Database,
  Globe,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

type Tab = "instagram" | "linkedin" | "facebook";

export default function AdminCreatorsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("instagram");
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = async (page = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchDebounced) params.set("search", searchDebounced);
      const res = await fetch(`${BASE}/admin/creators/${tab}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.data) {
        const items =
          tab === "facebook" ? json.data.profiles :
          json.data.creators;
        setData(items || []);
        setPagination(json.data.pagination);
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setData([]);
    fetchData(1);
  }, [token, tab, searchDebounced]);

  const tabs: { key: Tab; label: string; icon: any; color: string }[] = [
    { key: "instagram", label: "Instagram", icon: Instagram, color: "pink" },
    { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "sky" },
    { key: "facebook", label: "Facebook Ads", icon: Facebook, color: "blue" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 pt-4">
      {/* Header */}
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Scraped Data Explorer</h1>
            <p className="text-xs text-muted-foreground">Browse all creator data fetched across the platform</p>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex gap-2">
          {tabs.map((t) => {
            const active = tab === t.key;
            const colorStyles: Record<string, string> = {
              pink: active ? "bg-pink-500/15 border-pink-500/30 text-pink-500" : "bg-muted/30 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50",
              sky: active ? "bg-sky-500/15 border-sky-500/30 text-sky-500" : "bg-muted/30 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50",
              blue: active ? "bg-blue-500/15 border-blue-500/30 text-blue-500" : "bg-muted/30 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50",
            };
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSearch(""); }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${colorStyles[t.color]}`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${tab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl border-border/50 bg-muted/30"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                {tab === "instagram" && (
                  <>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 py-4">Username</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 py-4">Name</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 py-4">Followers</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 py-4">Posts</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 py-4">Last Scraped</th>
                  </>
                )}
                {tab === "linkedin" && (
                  <>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 py-4">Name</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 py-4">Headline</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 py-4">Followers</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 py-4">Posts</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 py-4">Reports</th>
                  </>
                )}
                {tab === "facebook" && (
                  <>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 py-4">Name</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 py-4">Category</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 py-4">Ads</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 py-4">Last Scraped</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500 mx-auto" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-muted-foreground">No data found</td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={idx} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    {tab === "instagram" && (
                      <>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.profilePicUrl ? (
                              <img src={item.profilePicUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500 text-xs font-bold">
                                {item.username?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-semibold">@{item.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.name || "—"}</td>
                        <td className="px-6 py-4 text-sm font-bold">{(item.followersCount || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-bold">{item._count?.posts || 0}</td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {item.lastScrapedAt ? new Date(item.lastScrapedAt).toLocaleDateString() : "Never"}
                        </td>
                      </>
                    )}
                    {tab === "linkedin" && (
                      <>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.profilePic ? (
                              <img src={item.profilePic} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-500 text-xs font-bold">
                                {item.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            )}
                            <span className="text-sm font-semibold">{item.name || item.profileUrl}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground max-w-[200px] truncate">{item.headline || "—"}</td>
                        <td className="px-6 py-4 text-sm font-bold">{(item.followersCount || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-bold">{item._count?.posts || 0}</td>
                        <td className="px-6 py-4 text-sm font-bold">{item._count?.reports || 0}</td>
                      </>
                    )}
                    {tab === "facebook" && (
                      <>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.profilePicUrl ? (
                              <img src={item.profilePicUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-xs font-bold">
                                {item.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            )}
                            <span className="text-sm font-semibold">{item.name || item.profileUrl}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.category || "—"}</td>
                        <td className="px-6 py-4 text-sm font-bold">{item._count?.ads || 0}</td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {item.lastScrapedAt ? new Date(item.lastScrapedAt).toLocaleDateString() : "Never"}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => fetchData(pagination.page - 1)}
                className="h-8 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchData(pagination.page + 1)}
                className="h-8 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
