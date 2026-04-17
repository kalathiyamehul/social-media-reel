"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Users, Eye, Film, UserCheck, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Creator } from "@/lib/types";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export default function CreatorsPage() {
  const { token } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Creator | null>(null);
  const [form, setForm] = useState({ username: "", category: "" });
  const [filterCategory, setFilterCategory] = useState("all");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const loadCreators = () => {
    if (!token) return;
    fetch(`/api/creators?_t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCreators(data.map((c: any) => ({
            id: c.username,
            username: c.username,
            category: c.category || "",
            profilePicUrl: c.profilePicUrl || "",
            followers: c.followersCount || 0,
            reelsCount30d: c.reelsCount30d || 0,
            avgViews30d: c.avgViews30d || 0,
            lastScrapedAt: c.lastScrapedAt || "",
          })));
        }
      });
  };

  useEffect(() => {
    if (token) loadCreators();
  }, [token]);

  const uniqueCategories = [...new Set(creators.map((c) => c.category))].sort();

  const filtered = filterCategory === "all"
    ? creators
    : creators.filter((c) => c.category === filterCategory);

  const openNew = () => {
    setEditing(null);
    setForm({ username: "", category: "" });
    setDialogOpen(true);
  };

  const openEdit = (creator: Creator) => {
    setEditing(creator);
    setForm({ username: creator.username, category: creator.category });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      if (editing) {
        const response = await fetch(`/api/creators/${encodeURIComponent(editing.username)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to update creator");
        }
      } else {
        const response = await fetch("/api/creators", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to add creator");
        }
      }
      setDialogOpen(false);
      loadCreators();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (username: string) => {
    if (!token || !confirm(`Delete creator @${username}?`)) return;
    try {
      const response = await fetch(`/api/creators/${encodeURIComponent(username)}`, { 
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Failed to delete creator (Status: ${response.status})`);
      }
      loadCreators();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete creator");
    }
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      const usernamesArray = creators.map(c => c.username);
      const usernamesStr = usernamesArray.join(",");
      const response = await fetch(`/api/creators/refresh-stream?usernames=${usernamesStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "progress" && data.status === "done") {
                loadCreators();
              } else if (data.type === "error") {
                alert(`Error scraping ${data.username}: ${data.error}`);
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      alert(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRefreshing(false);
      loadCreators();
    }
  };

  const handleRefreshOne = async (username: string) => {
    setRefreshingId(username);
    try {
      const response = await fetch(`/api/creators/refresh-stream?usernames=${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const reader = response.body?.getReader();
      if (!reader) return;
      
      const decoder = new TextDecoder();
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "progress" && data.status === "done") {
                loadCreators();
              } else if (data.type === "error") {
                alert(`Error scraping ${data.username}: ${data.error}`);
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      alert(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRefreshingId(null);
      loadCreators();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Creators</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage competitor Instagram accounts to track
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="flex-1 sm:flex-none rounded-xl glass border-border/50 gap-1.5 text-[10px] sm:text-xs"
          >
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh All
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="flex-1 sm:flex-none rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0 gap-1.5 text-[10px] sm:text-xs">
                <Plus className="h-4 w-4" />
                Add Creator
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong rounded-2xl border-border/50 w-[95%] sm:max-w-md mx-auto shadow-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Creator" : "Add Creator"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Instagram Username</Label>
                  <Input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="e.g. marcel.remus"
                    className="mt-1.5 rounded-xl glass border-border/50 h-11"
                  />
                </div>
                <div className="relative">
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => {
                      setForm({ ...form, category: e.target.value });
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      // Small delay to allow click on suggestion to register
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="e.g. dubai-real-estate"
                    className="mt-1.5 rounded-xl glass border-border/50 h-11"
                    autoComplete="off"
                  />
                  
                  {showSuggestions && uniqueCategories.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-2 max-h-[160px] overflow-y-auto rounded-xl glass-strong border border-border shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-200">
                      {uniqueCategories
                        .filter(cat => 
                          !form.category || 
                          cat.toLowerCase().includes(form.category.toLowerCase())
                        )
                        .map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onMouseDown={(e) => {
                              // Use onMouseDown instead of onClick to beat the onBlur event
                              e.preventDefault();
                              setForm({ ...form, category: cat });
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-lg text-xs hover:bg-foreground/[0.04] transition-colors flex items-center justify-between group"
                          >
                            <span className={form.category === cat ? "text-purple-400 font-medium" : "text-foreground/80"}>
                              {cat}
                            </span>
                            {form.category === cat && <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />}
                          </button>
                        ))}
                      {uniqueCategories.filter(cat => 
                          !form.category || 
                          cat.toLowerCase().includes(form.category.toLowerCase())
                        ).length === 0 && (
                        <div className="px-3 py-2.5 text-[10px] text-muted-foreground italic">
                          No matching categories. Type to create &quot;{form.category}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {!editing && (
                  <p className="text-[11px] text-muted-foreground">
                    Profile picture, followers, and activity metrics will be scraped automatically from Instagram.
                  </p>
                )}
                <Button
                  onClick={handleSave}
                  disabled={saving || !form.username || !form.category}
                  className="w-full rounded-xl h-11 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {editing ? "Saving..." : "Adding & scraping..."}
                    </>
                  ) : (
                    editing ? "Save Changes" : "Add Creator"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[220px] rounded-xl glass border-border/50 h-10 text-xs">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-xs bg-foreground/[0.03] border border-border/50">
          {filtered.length} creators
        </Badge>
      </div>

      {/* Creator Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((creator) => {
          const isRefreshing = refreshingId === creator.id;
          return (
            <Card
              key={creator.id}
              className={`group glass border-border rounded-2xl p-5 shadow-xl hover:shadow-purple-500/10 transition-all duration-500 ${isRefreshing ? "animate-pulse" : ""}`}
            >
              {/* Header: avatar + name + actions */}
              <div className="flex items-start justify-between">
                <a
                  href={`https://www.instagram.com/${creator.username}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {/* Profile pic */}
                  <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-border/30">
                    {creator.profilePicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/proxy-image?url=${encodeURIComponent(creator.profilePicUrl)}`}
                        alt={`@${creator.username}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground/50">
                        {creator.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold hover:text-purple-400 transition-colors">@{creator.username}</p>
                    <Badge variant="secondary" className="mt-0.5 rounded-md text-[10px] bg-foreground/[0.03] border border-border/30">
                      {creator.category}
                    </Badge>
                  </div>
                </a>
                <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRefreshOne(creator.id)}
                    disabled={isRefreshing}
                    className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    {isRefreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(creator)}
                    className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(creator.id)}
                    className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Stats */}
              {(creator.followers > 0 || creator.lastScrapedAt) ? (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-muted/60 border border-border p-2.5 text-center shadow-sm">
                    <UserCheck className="mx-auto h-3.5 w-3.5 text-blue-400 mb-1" />
                    <p className="text-sm font-bold">{formatNumber(creator.followers)}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Followers</p>
                  </div>
                  <div className="rounded-xl bg-muted/60 border border-border p-2.5 text-center shadow-sm">
                    <Film className="mx-auto h-3.5 w-3.5 text-purple-400 mb-1" />
                    <p className="text-sm font-bold">{creator.reelsCount30d}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Reels/30d</p>
                  </div>
                  <div className="rounded-xl bg-muted/60 border border-border p-2.5 text-center shadow-sm">
                    <Eye className="mx-auto h-3.5 w-3.5 text-emerald-400 mb-1" />
                    <p className="text-sm font-bold">{formatNumber(creator.avgViews30d)}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Avg Views</p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-muted/60 border border-border p-3 text-center shadow-sm">
                  <p className="text-[11px] text-muted-foreground">
                    No stats yet &mdash; click <RefreshCw className="inline h-3 w-3" /> to scrape
                  </p>
                </div>
              )}

              {/* Footer: last scraped + view videos */}
              <div className="mt-3 flex items-center justify-between">
                {creator.lastScrapedAt ? (
                  <p className="text-[10px] text-muted-foreground/60">
                    Scraped {new Date(creator.lastScrapedAt).toLocaleDateString()}
                  </p>
                ) : <span />}
                <Link
                  href={`/videos?creator=${creator.username}`}
                  className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View videos <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full glass rounded-2xl p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <h3 className="mt-4 font-semibold">No creators yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
