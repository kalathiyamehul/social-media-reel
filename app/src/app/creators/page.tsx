"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Users, Eye, Film, UserCheck, RefreshCw, Loader2, ExternalLink, Check } from "lucide-react";
import Link from "next/link";
import type { Creator } from "@/lib/types";

type CreatorApiRecord = {
  username: string;
  category?: string | null;
  profilePicUrl?: string | null;
  followersCount?: number | null;
  reelsCount30d?: number | null;
  avgViews30d?: number | null;
  lastScrapedAt?: string | null;
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export default function CreatorsPage() {
  const { token } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Creator | null>(null);
  const [form, setForm] = useState({ username: "", category: "" });
  const [filterCategory, setFilterCategory] = useState("all");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Advanced Animation State
  const [scrapingModalOpen, setScrapingModalOpen] = useState(false);
  const [scrapingCreator, setScrapingCreator] = useState<string | null>(null);
  const [scrapingPhase, setScrapingPhase] = useState<"connecting" | "fetching" | "analyzing" | "done">("connecting");

  const loadCreators = useCallback(async () => {
    if (!token) return;
    try {
      setLoadError(null);
      const response = await fetch(`/api/creators?_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Failed to load creators (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid creators response");
      }

      const creatorsData = data as CreatorApiRecord[];
      setCreators(creatorsData.map((c) => ({
        id: c.username,
        username: c.username,
        category: c.category || "",
        profilePicUrl: c.profilePicUrl || "",
        followers: c.followersCount || 0,
        reelsCount30d: c.reelsCount30d || 0,
        avgViews30d: c.avgViews30d || 0,
        lastScrapedAt: c.lastScrapedAt || "",
      })));
    } catch (err) {
      console.error("Failed to load creators:", err);
      setCreators([]);
      setLoadError(err instanceof Error ? err.message : "Failed to load creators");
    }
  }, [token]);

  useEffect(() => {
    if (token) void loadCreators();
  }, [token, loadCreators]);

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
        setDialogOpen(false);
        // Start immersive scraping stream instead of reloading statically
        startScrapingStream(form.username);
        return; // Don't trigger standard loadCreators
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

  const startScrapingStream = async (username: string) => {
    setScrapingCreator(username);
    setScrapingPhase("connecting");
    setScrapingModalOpen(true);

    // Simulate data-fetching progression visually
    const phases: ("connecting" | "fetching" | "analyzing")[] = ["connecting", "fetching", "analyzing"];
    let phaseIdx = 0;
    const visualInterval = setInterval(() => {
      if (phaseIdx < 2) {
        phaseIdx++;
        setScrapingPhase(phases[phaseIdx]);
      }
    }, 5000);

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
                clearInterval(visualInterval);
                setScrapingPhase("done");
                setTimeout(() => {
                  setScrapingModalOpen(false);
                  setScrapingCreator(null);
                  loadCreators();
                }, 1500);
              } else if (data.type === "error") {
                alert(`Error scraping ${data.username}: ${data.error}`);
                clearInterval(visualInterval);
                setScrapingModalOpen(false);
              }
            } catch { /* skip */ }
          }
        }
      }

      
      // Fallback: If the stream terminates normally (or Drops by Next.js proxy timeout)
      // without hitting 'done', we simulate a successful done state and close the UI.
      clearInterval(visualInterval);
      setScrapingPhase("done");
      setTimeout(() => {
        setScrapingModalOpen(false);
        setScrapingCreator(null);
        loadCreators();
      }, 1500);

    } catch (err) {
      alert(`Network error: ${err instanceof Error ? err.message : String(err)}`);
      clearInterval(visualInterval);
      setScrapingModalOpen(false);
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

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          Could not load creators: {loadError}
        </div>
      )}

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

      {/* Advanced Scraping Modal */}
      <Dialog open={scrapingModalOpen} onOpenChange={(open) => !open && setScrapingModalOpen(false)}>
        <DialogContent className="glass-strong rounded-[2rem] border-border/50 w-[95%] sm:max-w-md mx-auto shadow-2xl p-10 overflow-hidden outline-none">
          <DialogTitle className="sr-only">Scraping Progress</DialogTitle>
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-indigo-500/5 pointer-events-none" />

          <div className="flex flex-col items-center justify-center min-h-[300px] relative z-10 w-full mt-4">
            <div className="relative w-24 h-24 mb-8">
              {scrapingPhase === "done" ? (
                <div className="absolute inset-0 bg-emerald-500 rounded-full flex items-center justify-center animate-in zoom-in duration-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Check className="w-10 h-10 text-white" strokeWidth={3} />
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin opacity-80 decoration-slice"></div>
                  <div className="absolute inset-2 rounded-full border-r-2 border-pink-500 animate-[spin_1.5s_linear_infinite_reverse] opacity-60"></div>
                  <div className="absolute inset-4 rounded-full border-b-2 border-indigo-500 animate-[spin_2s_linear_infinite] opacity-40"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="h-8 w-8 text-purple-500 animate-pulse" />
                  </div>
                </>
              )}
            </div>

            <h3 className="text-xl font-semibold mb-2 tracking-tight">
              {scrapingPhase === "done" ? "Sync Complete!" : `Fetching @${scrapingCreator}`}
            </h3>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground items-center mt-4 pb-4">
              <p className={`transition-all duration-300 ${scrapingPhase === 'connecting' ? 'text-purple-500 font-bold' : (scrapingPhase === 'done' ? 'opacity-0' : 'opacity-40')}`}>
                {scrapingPhase === 'connecting' ? '→ ' : ''}Connecting to Instagram Network...
              </p>
              <p className={`transition-all duration-300 ${scrapingPhase === 'fetching' ? 'text-purple-500 font-bold' : (scrapingPhase === 'done' ? 'opacity-0' : 'opacity-40')}`}>
                {scrapingPhase === 'fetching' ? '→ ' : ''}Extracting Follower & Profile Data...
              </p>
              <p className={`transition-all duration-300 ${scrapingPhase === 'analyzing' ? 'text-purple-500 font-bold' : (scrapingPhase === 'done' ? 'opacity-0' : 'opacity-40')}`}>
                {scrapingPhase === 'analyzing' ? '→ ' : ''}Scraping 30-Day Video Feed...
              </p>
            </div>

            {scrapingPhase !== "done" && (
              <p className="mt-8 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-50 animate-pulse">
                Please do not close window
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
