"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import {
  ScrollText,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldCheck,
  UserCog,
  Settings,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface LogItem {
  id: number;
  adminId: number;
  action: string;
  targetUserId: number | null;
  details: any;
  timestamp: string;
  admin: { id: number; email: string; fullName: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const actionColors: Record<string, string> = {
  UPDATE_USER_ROLE: "#f59e0b",
  CREATE_SYSTEM_CONFIG: "#10b981",
  UPDATE_SYSTEM_CONFIG: "#0ea5e9",
  DELETE_SYSTEM_CONFIG: "#ef4444",
};

const actionIcons: Record<string, React.ReactNode> = {
  UPDATE_USER_ROLE: <UserCog className="h-4 w-4" />,
  CREATE_SYSTEM_CONFIG: <Settings className="h-4 w-4" />,
  UPDATE_SYSTEM_CONFIG: <Settings className="h-4 w-4" />,
  DELETE_SYSTEM_CONFIG: <Trash2 className="h-4 w-4" />,
};

export default function AdminLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

  const fetchLogs = async (page = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filterAction) params.set("action", filterAction);
      const res = await fetch(`${BASE}/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.data) {
        setLogs(json.data.logs || []);
        setPagination(json.data.pagination);
      } else {
        setError(json.message || "Failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); }, [token, filterAction]);

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="admin-stat admin-stat--amber admin-animate-in">
          <div className="admin-stat__value">{pagination.total}</div>
          <div className="admin-stat__label">Total Logs</div>
        </div>
        <div className="admin-stat admin-stat--purple admin-animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="admin-stat__value">{uniqueActions.length}</div>
          <div className="admin-stat__label">Action Types</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
        <button
          onClick={() => setFilterAction("")}
          className="admin-badge"
          style={{
            cursor: "pointer",
            padding: "5px 12px",
            fontSize: "10px",
            background: !filterAction ? "oklch(0.8 0.18 85 / 15%)" : "var(--muted)",
            borderColor: !filterAction ? "oklch(0.8 0.18 85 / 30%)" : "var(--border)",
            color: !filterAction ? "#f59e0b" : "var(--muted-foreground)",
          }}
        >
          All
        </button>
        {["UPDATE_USER_ROLE", "CREATE_SYSTEM_CONFIG", "UPDATE_SYSTEM_CONFIG", "DELETE_SYSTEM_CONFIG"].map((action) => (
          <button
            key={action}
            onClick={() => setFilterAction(filterAction === action ? "" : action)}
            className="admin-badge"
            style={{
              cursor: "pointer",
              padding: "5px 12px",
              fontSize: "10px",
              background: filterAction === action ? `${actionColors[action]}20` : "var(--muted)",
              borderColor: filterAction === action ? `${actionColors[action]}40` : "var(--border)",
              color: filterAction === action ? actionColors[action] : "var(--muted-foreground)",
            }}
          >
            {action.replace(/_/g, " ")}
          </button>
        ))}
        <button
          onClick={() => fetchLogs(1)}
          className="admin-topbar__icon-btn ml-auto"
          style={{ width: 32, height: 32 }}
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Logs Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#f59e0b" }} />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="admin-empty">
            <ScrollText className="admin-empty__icon" />
            <p className="admin-empty__text">No audit logs found</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Admin</th>
                <th>Target</th>
                <th>Time</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const color = actionColors[log.action] || "var(--muted-foreground)";
                const isExpanded = expandedId === log.id;
                return (
                  <>
                    <tr key={log.id} style={{ cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                            style={{ background: `${color}15`, color }}
                          >
                            {actionIcons[log.action] || <ShieldCheck className="h-4 w-4" />}
                          </div>
                          <span
                            className="admin-badge"
                            style={{
                              background: `${color}15`,
                              borderColor: `${color}30`,
                              color,
                              fontSize: "9px",
                            }}
                          >
                            {log.action.replace(/_/g, " ")}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="text-xs font-semibold">{log.admin.fullName}</p>
                          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{log.admin.email}</p>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {log.targetUserId ? `User #${log.targetUserId}` : "—"}
                        </span>
                      </td>
                      <td>
                        <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <button style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={5} style={{ padding: "0 20px 16px" }}>
                          <div className="rounded-xl p-4 text-xs font-mono" style={{ background: "var(--muted)" }}>
                            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", color: "var(--muted-foreground)" }}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="admin-topbar__icon-btn"
                style={{ width: 32, height: 32, opacity: pagination.page <= 1 ? 0.3 : 1 }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
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
