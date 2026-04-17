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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Library, Facebook, Loader2, Sparkles, AlertCircle } from "lucide-react";
import Link from 'next/link';

export default function AdsLibraryPage() {
  const { token } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scrapeDialogOpen, setScrapeDialogOpen] = useState(false);
  const [scrapeProfile, setScrapeProfile] = useState<string>("");
  const [scrapeLimit, setScrapeLimit] = useState<number>(60);
  const [scraping, setScraping] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ profileUrl: "", category: "", name: "" });
  const [saving, setSaving] = useState(false);

  const loadProfiles = () => {
    if (!token) return;
    fetch(`/api/facebook-ads/profiles?_t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProfiles(data);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    if (token) loadProfiles();
  }, [token]);

  const openNew = () => {
    setEditing(null);
    setForm({ profileUrl: "", category: "", name: "" });
    setDialogOpen(true);
  };

  const openEdit = (profile: any) => {
    setEditing(profile);
    setForm({ profileUrl: profile.profileUrl, category: profile.category || "", name: profile.name || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      if (editing) {
        const response = await fetch(`/api/facebook-ads/profiles/${encodeURIComponent(editing.profileUrl)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to update profile");
        }
      } else {
        const response = await fetch("/api/facebook-ads/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to add profile");
        }
      }
      setDialogOpen(false);
      loadProfiles();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (profileUrl: string) => {
    if (!token || !confirm(`Delete profile ${profileUrl}?`)) return;
    try {
      const response = await fetch(`/api/facebook-ads/profiles/${encodeURIComponent(profileUrl)}`, { 
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Failed to delete profile (Status: ${response.status})`);
      }
      loadProfiles();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete profile");
    }
  };

  const handleScrapeAds = (profileUrl: string) => {
    setScrapeProfile(profileUrl);
    setScrapeLimit(60);
    setScrapeDialogOpen(true);
  };

  const confirmScrapeAds = async () => {
    if (!scrapeProfile || !token) return;
    setScrapeDialogOpen(false);
    setScraping(scrapeProfile);

    try {
      const response = await fetch(`/api/facebook-ads/scrape-stream?profileUrl=${encodeURIComponent(scrapeProfile)}&limit=${scrapeLimit}`, {
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
                loadProfiles();
              } else if (data.type === "error") {
                alert(`Error scraping ${data.profileUrl}: ${data.error}`);
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      alert(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setScraping(null);
      loadProfiles();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ads Library</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage competitor Facebook pages for Ads tracking
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="flex-1 sm:flex-none rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 border-0 gap-1.5 text-[10px] sm:text-xs text-white">
                <Plus className="h-4 w-4" />
                Add Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong rounded-2xl border-border w-[95%] sm:max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Profile" : "Add Target Profile"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Facebook Profile URL / ID</Label>
                  <Input
                    value={form.profileUrl}
                    onChange={(e) => setForm({ ...form, profileUrl: e.target.value })}
                    placeholder="e.g. https://facebook.com/competitor"
                    className="mt-1.5 rounded-xl glass border-border/50 h-11"
                    disabled={!!editing}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Name (Optional)</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Competitor Name"
                    className="mt-1.5 rounded-xl glass border-border/50 h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. fashion-brands"
                    className="mt-1.5 rounded-xl glass border-border/50 h-11"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving || !form.profileUrl || !form.category}
                  className="w-full rounded-xl h-11 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 border-0 text-white font-medium"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {editing ? "Saving..." : "Adding..."}
                    </>
                  ) : (
                    editing ? "Save Changes" : "Add Profile"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={scrapeDialogOpen} onOpenChange={setScrapeDialogOpen}>
            <DialogContent className="glass-strong rounded-2xl border-border/50 w-[95%] sm:max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Scrape Facebook Ads</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-2">
                <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-200">
                    Scraping consumes Apify compute units. Retrieving large quantities of ads will take longer and cost more.
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">How many ads to scrape?</Label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={scrapeLimit}
                    onChange={(e) => setScrapeLimit(parseInt(e.target.value) || 60)}
                    className="mt-1.5 rounded-xl glass border-border/50 h-11"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setScrapeDialogOpen(false)}
                    className="flex-1 rounded-xl glass border-border/50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmScrapeAds}
                    className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 border-0 text-white font-medium"
                  >
                    Start Scraping
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <div
            key={profile.id || profile.profileUrl}
            className={`group glass rounded-2xl p-5 transition-all duration-300 hover:bg-foreground/[0.05] hover:border-border flex flex-col justify-between ${scraping === profile.profileUrl ? 'animate-pulse' : ''}`}
          >
            <div>
              <div className="flex items-start justify-between">
                <Link
                  href={`/ads-library/${encodeURIComponent(profile.profileUrl)}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0"
                >
                  <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-blue-500/20 border border-blue-500/30 text-blue-400">
                    {profile.profilePicUrl ? (
                      <img
                        src={`/api/proxy-image?url=${encodeURIComponent(profile.profilePicUrl)}`}
                        alt={profile.name || profile.profileUrl}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Facebook className="h-6 w-6" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold hover:text-blue-400 transition-colors truncate">
                      {profile.name || profile.profileUrl.split('/').pop() || profile.profileUrl}
                    </p>
                    <Badge variant="secondary" className="mt-0.5 rounded-md text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {profile.category || 'uncategorized'}
                    </Badge>
                  </div>
                </Link>
                <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(profile)}
                    className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(profile.profileUrl)}
                    className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-foreground/[0.03] border border-border/40 p-3">
                <p className="text-[11px] text-muted-foreground text-center">
                  URL: {profile.profileUrl}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/30">
              <Button 
                variant="default" 
                onClick={() => handleScrapeAds(profile.profileUrl)}
                disabled={scraping === profile.profileUrl}
                className="w-full text-xs h-9 bg-foreground/[0.05] hover:bg-foreground/[0.1] text-foreground border border-border/40 shadow-none"
              >
                {scraping === profile.profileUrl ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin text-blue-400" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-2 text-blue-400" />
                )}
                {scraping === profile.profileUrl ? "Scraping..." : "Scrape Ads"}
              </Button>
            </div>
          </div>
        ))}

        {profiles.length === 0 && (
          <div className="col-span-full glass rounded-2xl p-12 text-center">
            <Library className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <h3 className="mt-4 font-semibold">No profiles yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add a competitor profile to track their Facebook ads.</p>
          </div>
        )}
      </div>
    </div>
  );
}
