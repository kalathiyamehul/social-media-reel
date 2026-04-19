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
  Database,
  ExternalLink,
} from "lucide-react";
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
        const items = tab === "facebook" ? json.data.profiles : json.data.creators;
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
    { key: "instagram", label: "Instagram", icon: Instagram, color: "#ec4899" },
    { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0ea5e9" },
    { key: "facebook", label: "Facebook Ads", icon: Facebook, color: "#3b82f6" },
  ];

  return (
    <div className="space-y-6">
      {/* Platform Stats */}
      <div className="grid grid-cols-3 gap-4">
        {tabs.map((t) => (
          <div
            key={t.key}
            className={`admin-stat admin-animate-in cursor-pointer`}
            style={{
              borderColor: tab === t.key ? `${t.color}40` : "var(--border)",
              background: tab === t.key ? `${t.color}12` : "var(--card)",
              color: t.color,
            }}
            onClick={() => { setTab(t.key); setSearch(""); }}
          >
            <div className="admin-stat__icon-bg"><t.icon className="h-10 w-10" /></div>
            <div className="admin-stat__value">{tab === t.key ? pagination.total : "—"}</div>
            <div className="admin-stat__label">{t.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex gap-2">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSearch(""); }}
                className="admin-badge"
                style={{
                  cursor: "pointer",
                  padding: "6px 14px",
                  fontSize: "11px",
                  background: active ? `${t.color}20` : "var(--muted)",
                  borderColor: active ? `${t.color}40` : "var(--border)",
                  color: active ? t.color : "var(--muted-foreground)",
                }}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
          <input
            placeholder={`Search ${tab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl text-sm"
            style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                {tab === "instagram" && (
                  <>
                    <th>Creator</th>
                    <th>Followers</th>
                    <th>Posts</th>
                    <th>Reels (30d)</th>
                    <th>Last Scraped</th>
                  </>
                )}
                {tab === "linkedin" && (
                  <>
                    <th>Creator</th>
                    <th>Headline</th>
                    <th>Followers</th>
                    <th>Posts</th>
                    <th>Reports</th>
                  </>
                )}
                {tab === "facebook" && (
                  <>
                    <th>Profile</th>
                    <th>Category</th>
                    <th>Ads</th>
                    <th>Last Scraped</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 0" }}>
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" style={{ color: "#f59e0b" }} />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 0", color: "var(--muted-foreground)" }}>
                    No data found
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={idx}>
                    {tab === "instagram" && (
                      <>
                        <td>
                          <div className="flex items-center gap-3">
                            {item.profilePicUrl ? (
                              <img src={item.profilePicUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                            ) : (
                              <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#ec489915", color: "#ec4899" }}>
                                {item.username?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold">@{item.username}</p>
                              <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{item.name || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className="text-sm font-black">{(item.followersCount || 0).toLocaleString()}</span></td>
                        <td><span className="text-sm font-bold">{item._count?.posts || 0}</span></td>
                        <td><span className="text-sm">{item.reelsCount30d || 0}</span></td>
                        <td><span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.lastScrapedAt ? new Date(item.lastScrapedAt).toLocaleDateString() : "Never"}</span></td>
                      </>
                    )}
                    {tab === "linkedin" && (
                      <>
                        <td>
                          <div className="flex items-center gap-3">
                            {item.profilePic ? (
                              <img src={item.profilePic} alt="" className="h-9 w-9 rounded-full object-cover" />
                            ) : (
                              <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#0ea5e915", color: "#0ea5e9" }}>
                                {(item.name || "?").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-semibold">{item.name || item.profileUrl}</span>
                          </div>
                        </td>
                        <td><span className="text-xs truncate block max-w-[200px]" style={{ color: "var(--muted-foreground)" }}>{item.headline || "—"}</span></td>
                        <td><span className="text-sm font-black">{(item.followersCount || 0).toLocaleString()}</span></td>
                        <td><span className="text-sm font-bold">{item._count?.posts || 0}</span></td>
                        <td><span className="text-sm font-bold">{item._count?.reports || 0}</span></td>
                      </>
                    )}
                    {tab === "facebook" && (
                      <>
                        <td>
                          <div className="flex items-center gap-3">
                            {item.profilePicUrl ? (
                              <img src={item.profilePicUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                            ) : (
                              <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#3b82f615", color: "#3b82f6" }}>
                                {(item.name || "?").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-semibold">{item.name || item.profileUrl}</span>
                          </div>
                        </td>
                        <td><span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{item.category || "—"}</span></td>
                        <td><span className="text-sm font-bold">{item._count?.ads || 0}</span></td>
                        <td><span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.lastScrapedAt ? new Date(item.lastScrapedAt).toLocaleDateString() : "Never"}</span></td>
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
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchData(pagination.page - 1)}
                className="admin-topbar__icon-btn"
                style={{ width: 32, height: 32, opacity: pagination.page <= 1 ? 0.3 : 1 }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchData(pagination.page + 1)}
                className="admin-topbar__icon-btn"
                style={{ width: 32, height: 32, opacity: pagination.page >= pagination.totalPages ? 0.3 : 1 }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
