
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Settings,
  Loader2,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  Key,
  Edit3,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ConfigItem {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  const BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

  const fetchConfigs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/admin/system-config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.data) setConfigs(json.data.configs || []);
      else setError(json.message || "Failed");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, [token]);

  const handleUpdate = async (key: string) => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/admin/system-config/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value: editValue }),
      });
      const json = await res.json();
      if (json.data) {
        setConfigs((prev) => prev.map((c) => c.key === key ? { ...c, value: editValue, updatedAt: new Date().toISOString() } : c));
        setEditingKey(null);
        toast.success(`Config "${key}" updated`);
      } else {
        toast.error(json.message || "Failed");
      }
    } catch {
      toast.error("Failed to update config");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!token || !newKey || !newValue) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/admin/system-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key: newKey, value: newValue }),
      });
      const json = await res.json();
      if (json.data) {
        setConfigs((prev) => [...prev, json.data]);
        setShowAdd(false);
        setNewKey("");
        setNewValue("");
        toast.success(`Config "${newKey}" created`);
      } else {
        toast.error(json.message || "Failed");
      }
    } catch {
      toast.error("Failed to create config");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!token) return;
    if (!confirm(`Delete config "${key}"?`)) return;
    try {
      const res = await fetch(`${BASE}/admin/system-config/${encodeURIComponent(key)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.data) {
        setConfigs((prev) => prev.filter((c) => c.key !== key));
        toast.success(`Config "${key}" deleted`);
      } else {
        toast.error(json.message || "Failed");
      }
    } catch {
      toast.error("Failed to delete config");
    }
  };

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
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-red-400 ml-3">{error}</p>
      </div>
    );
  }

  // Categorize configs
  const apiKeyConfigs = configs.filter((c) => c.key.toLowerCase().includes("key") || c.key.toLowerCase().includes("api") || c.key.toLowerCase().includes("secret"));
  const otherConfigs = configs.filter((c) => !apiKeyConfigs.includes(c));

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="admin-stat admin-stat--amber admin-animate-in">
          <div className="admin-stat__value">{configs.length}</div>
          <div className="admin-stat__label">Total Configs</div>
        </div>
        <div className="admin-stat admin-stat--red admin-animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="admin-stat__value">{apiKeyConfigs.length}</div>
          <div className="admin-stat__label">API Keys</div>
        </div>
      </div>

      {/* Add New Config */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="admin-badge"
          style={{
            cursor: "pointer",
            padding: "8px 16px",
            fontSize: "11px",
            background: "oklch(0.8 0.18 85 / 15%)",
            borderColor: "oklch(0.8 0.18 85 / 30%)",
            color: "#f59e0b",
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Add Config
        </button>
      </div>

      {showAdd && (
        <div className="admin-card admin-animate-in" style={{ borderColor: "oklch(0.8 0.18 85 / 30%)" }}>
          <h3 className="text-sm font-bold mb-4">Add New Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Key</label>
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. GEMINI_API_KEY"
                className="w-full h-10 px-3 rounded-xl text-sm"
                style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Value</label>
              <input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Value..."
                className="w-full h-10 px-3 rounded-xl text-sm"
                style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving || !newKey || !newValue}
              className="admin-badge"
              style={{
                cursor: "pointer",
                padding: "8px 16px",
                background: "oklch(0.7 0.18 155 / 15%)",
                borderColor: "oklch(0.7 0.18 155 / 30%)",
                color: "#10b981",
                opacity: saving || !newKey || !newValue ? 0.5 : 1,
              }}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewKey(""); setNewValue(""); }}
              className="admin-badge admin-badge--muted"
              style={{ cursor: "pointer", padding: "8px 16px" }}
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Config Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {configs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "48px 0", color: "var(--muted-foreground)" }}>
                  No configs found. Add one above.
                </td>
              </tr>
            ) : (
              configs.map((c) => (
                <tr key={c.key}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Key className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
                      <span className="text-xs font-mono font-bold">{c.key}</span>
                    </div>
                  </td>
                  <td>
                    {editingKey === c.key ? (
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg text-xs font-mono"
                        style={{ background: "var(--muted)", border: "1px solid oklch(0.8 0.18 85 / 30%)", color: "var(--foreground)", outline: "none" }}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(c.key); if (e.key === "Escape") setEditingKey(null); }}
                      />
                    ) : (
                      <span className="text-xs font-mono truncate block max-w-[300px]" style={{ color: "var(--muted-foreground)" }}>
                        {apiKeyConfigs.includes(c) ? "••••••••" + c.value.slice(-4) : c.value}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {editingKey === c.key ? (
                        <>
                          <button
                            onClick={() => handleUpdate(c.key)}
                            disabled={saving}
                            className="admin-topbar__icon-btn"
                            style={{ width: 28, height: 28, color: "#10b981" }}
                            title="Save"
                          >
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="admin-topbar__icon-btn"
                            style={{ width: 28, height: 28 }}
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingKey(c.key); setEditValue(c.value); }}
                            className="admin-topbar__icon-btn"
                            style={{ width: 28, height: 28 }}
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.key)}
                            className="admin-topbar__icon-btn"
                            style={{ width: 28, height: 28, color: "#ef4444" }}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
