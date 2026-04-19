"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Users,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Crown,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface UserItem {
  id: number;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  lastLoginSource: string | null;
  _count: { reelAnalyses: number; instagramTemplates: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = async (page = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchDebounced) params.set("search", searchDebounced);
      const res = await fetch(`${BASE}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.data) {
        setUsers(json.data.users);
        setPagination(json.data.pagination);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(1); }, [token, searchDebounced]);

  const updateRole = async (userId: number, newRole: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (json.data) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
        toast.success(`Role updated to ${newRole}`);
      } else {
        toast.error(json.message || "Failed to update role");
      }
    } catch {
      toast.error("Failed to update role");
    }
  };

  const adminCount = users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="admin-stat admin-stat--amber admin-animate-in">
          <div className="admin-stat__value">{pagination.total}</div>
          <div className="admin-stat__label">Total Users</div>
        </div>
        <div className="admin-stat admin-stat--red admin-animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="admin-stat__value">{adminCount}</div>
          <div className="admin-stat__label">Admins (this page)</div>
        </div>
        <div className="admin-stat admin-stat--emerald admin-animate-in" style={{ animationDelay: "0.2s" }}>
          <div className="admin-stat__value">
            {users.reduce((sum, u) => sum + u._count.reelAnalyses, 0)}
          </div>
          <div className="admin-stat__label">Total Analyses (this page)</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
          <input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl text-sm"
            style={{
              background: "var(--muted)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Analyses</th>
                <th>Templates</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 0" }}>
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" style={{ color: "#f59e0b" }} />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 0", color: "var(--muted-foreground)" }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 group" style={{ textDecoration: "none" }}>
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold flex-shrink-0"
                          style={{
                            background: u.role === "SUPER_ADMIN"
                              ? "linear-gradient(135deg, oklch(0.6 0.22 25 / 20%), oklch(0.5 0.22 25 / 15%))"
                              : u.role === "ADMIN"
                              ? "linear-gradient(135deg, oklch(0.8 0.18 85 / 20%), oklch(0.7 0.18 55 / 15%))"
                              : "linear-gradient(135deg, oklch(0.65 0.2 268 / 15%), oklch(0.55 0.2 268 / 10%))",
                            border: "1px solid",
                            borderColor: u.role === "SUPER_ADMIN" ? "oklch(0.6 0.22 25 / 20%)" : u.role === "ADMIN" ? "oklch(0.8 0.18 85 / 20%)" : "oklch(0.65 0.2 268 / 15%)",
                            color: u.role === "SUPER_ADMIN" ? "#ef4444" : u.role === "ADMIN" ? "#f59e0b" : "#8b5cf6",
                          }}
                        >
                          {u.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{u.fullName}</p>
                          <p className="text-[11px] truncate" style={{ color: "var(--muted-foreground)" }}>{u.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td>
                      <span className={`admin-badge ${
                        u.role === "SUPER_ADMIN" ? "admin-badge--red" :
                        u.role === "ADMIN" ? "admin-badge--amber" :
                        "admin-badge--muted"
                      }`}>
                        {u.role === "SUPER_ADMIN" && <Crown className="h-3 w-3" />}
                        {u.role === "ADMIN" && <ShieldCheck className="h-3 w-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted-foreground)", fontSize: "13px" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="text-sm font-black">{u._count.reelAnalyses}</span>
                    </td>
                    <td>
                      <span className="text-sm font-bold">{u._count.instagramTemplates}</span>
                    </td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        className="text-xs rounded-lg px-2 py-1.5 cursor-pointer"
                        style={{
                          background: "var(--muted)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                          outline: "none",
                        }}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </td>
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
                onClick={() => fetchUsers(pagination.page - 1)}
                className="admin-topbar__icon-btn"
                style={{ width: 32, height: 32, opacity: pagination.page <= 1 ? 0.3 : 1 }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchUsers(pagination.page + 1)}
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
