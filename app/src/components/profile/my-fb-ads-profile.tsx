"use client";

import { useState, useEffect, useCallback } from "react";
import { BASE_URL } from "@/lib/config";
import { useAuth } from "@/context/auth-context";
import { Loader2, Instagram, Facebook, Sparkles, Zap, History, PlayCircle, Eye, Heart, Film, ArrowRight, TrendingUp, UserCircle, Mail, Globe, Linkedin, Check, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { MarkdownContent } from "@/components/markdown-content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmCreditModal } from "@/components/ui/confirm-credit-modal";
import { handleCatchError, handleSSEError, classifyError } from "@/lib/error-utils";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function getFbPageName(url?: string) {
  if (!url) return "";
  let name = url.replace(/^(?:https?:\/\/)?(?:www\.)?facebook\.com\//i, '');
  name = name.replace(/\/$/, '');
  return name || url;
}

export function MyFbAdsProfile({ profile, onSaveField, memberSince }: { profile: any; onSaveField?: any; memberSince?: any }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<any | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [confirmSync, setConfirmSync] = useState(false);
  const [confirmReport, setConfirmReport] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const { setShowCreditModal } = useAuth() as any;

  const loadData = useCallback(async () => {
    if (!token || !profile?.facebookPageUrl) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch creator details
      const cRes = await fetch(`/api/facebook-ads/profiles/${encodeURIComponent(profile.facebookPageUrl)}/ads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (cRes.ok) {
        const cData = await cRes.json();
        setPosts(cData);
        setCreator({ name: profile.facebookPageUrl, followersCount: 0, totalPosts: cData.length });
      }



      // Fetch Mentor History
      const hRes = await fetch(`${BASE_URL}/self-analysis/history?platform=FACEBOOK_ADS`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (hRes.ok) {
        const hData = await hRes.json();
        if (hData.data) {
          setHistory(hData.data);
          if (hData.data.length > 0) setActiveAnalysis(hData.data[0]);
        } else if (Array.isArray(hData)) {
          setHistory(hData);
          if (hData.length > 0) setActiveAnalysis(hData[0]);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, profile?.facebookPageUrl]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSyncProfile = async () => {
    setConfirmSync(false);
    if (!token || !profile?.facebookPageUrl) return;
    try {
      setSyncing(true);
      const res = await fetch(`/api/self-analysis/sync-fb-ads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ pageUrl: profile.facebookPageUrl, scrapeLimit: 60 })
      });

      if (!res.ok) {
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch { data = { message: text }; }

        if (res.status === 403 || data?.code === 'INSUFFICIENT_CREDITS' || text.toLowerCase().includes('credits') || text.toLowerCase().includes('insufficient')) {
          const classified = classifyError({ code: 'INSUFFICIENT_CREDITS' });
          toast.error(`${classified.icon} ${classified.title}`, { description: classified.description, duration: classified.duration });
          setShowCreditModal?.(true);
          return;
        }
        throw new Error(data.message || data.error || "Failed to sync profile");
      }
      
      const data = await res.json();
      toast.success("Profile successfully synced!");
      if (data.generatedReport) {
        toast.success("New Mentor Report generated!");
      }
      await loadData();
    } catch (err: any) {
      if (setShowCreditModal) handleCatchError(err, setShowCreditModal);
    } finally {
      setSyncing(false);
      setConfirmSync(false);
    }
  };

  const handleGenerateReport = async () => {
    setConfirmReport(false);
    if (!token || !profile?.facebookPageUrl) return;
    try {
      setGeneratingReport(true);
      const res = await fetch(`/api/self-analysis/facebook-ads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ pageUrl: profile.facebookPageUrl })
      });

      if (!res.ok) {
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch { data = { message: text }; }

        if (res.status === 403 || data?.code === 'INSUFFICIENT_CREDITS' || text.toLowerCase().includes('credits') || text.toLowerCase().includes('insufficient')) {
          const classified = classifyError({ code: 'INSUFFICIENT_CREDITS' });
          toast.error(`${classified.icon} ${classified.title}`, { description: classified.description, duration: classified.duration });
          setShowCreditModal(true);
        } else {
          throw new Error(data.message || "Failed to generate report");
        }
        return;
      }

      toast.success("Brutal Mentor Report generated successfully!");
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate report", { description: err.message });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleRemoveProfile = () => {
    onSaveField?.('facebookPageUrl', '');
    setCreator(null);
    setPosts([]);
    setHistory([]);
    setActiveAnalysis(null);
    toast.success("Profile removed successfully");
  };

  const [activeTab, setActiveTab] = useState("overview");
  const [confirmRemove, setConfirmRemove] = useState(false);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 mt-8">

      {/* Hero Profile Section */}
      <div className="relative rounded-3xl overflow-hidden border border-border/50 bg-card shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
        <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">

          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-background shadow-xl shrink-0 flex items-center justify-center bg-muted">
            {creator?.profilePicUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/proxy-image?url=${encodeURIComponent(creator.profilePicUrl)}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold opacity-30">{profile?.facebookPageUrl ? getFbPageName(profile.facebookPageUrl).charAt(0).toUpperCase() : "?"}</span>
            )}
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground truncate">
              {profile?.facebookPageUrl ? getFbPageName(profile.facebookPageUrl) : "No Brand Tracked"}
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1 mb-3 truncate flex items-center gap-2">
              <Facebook className="h-4 w-4 text-info" /> {profile?.facebookPageUrl ? profile.facebookPageUrl : "Enter a URL below to start"}
            </p>

            {creator?.category && (
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 mb-4">
                {creator.category}
              </Badge>
            )}

            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed whitespace-pre-wrap line-clamp-3">
              {!profile?.facebookPageUrl ? "Add a competitor or inspiration brand's Facebook Page to track their active ads and generate strategy reports." : "Tracking Brand Page"}
            </p>
          </div>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 shrink-0">
            <div className="flex gap-3">
              <div className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-2xl border border-border/40 min-w-[110px]">
                <span className="text-2xl font-black">{formatNumber(creator?.followersCount || 0)}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Followers</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-2xl border border-border/40 min-w-[110px]">
                <span className="text-2xl font-black">{formatNumber(creator?.totalPosts || 0)}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Active Ads</span>
              </div>
            </div>
            <div className="flex sm:flex-col justify-center">
              {profile?.facebookPageUrl && (
                <Button
                  onClick={() => setConfirmSync(true)}
                  disabled={syncing}
                  className="bg-info hover:bg-info/90 text-info-foreground border-0 shadow-lg shadow-info/20 rounded-xl h-full py-4 w-full sm:w-auto whitespace-nowrap"
                >
                  {syncing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scraping...</>
                  ) : (
                    <><Zap className="mr-2 h-4 w-4" /> Scrape Ads</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full focus-visible:outline-none">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 bg-muted/50 p-1 mb-8 rounded-xl max-w-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Dashboard</TabsTrigger>
          <TabsTrigger value="mentor" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-info data-[state=active]:text-info">Mentor Report</TabsTrigger>
          <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Ads</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
          {!profile?.facebookPageUrl && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-info/5 to-info/5 border-info/20 overflow-hidden relative">
                <div className="absolute right-0 top-0 opacity-10 translate-x-1/4 -translate-y-1/4">
                  <Facebook className="h-48 w-48 text-info" />
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-info" />
                    Track a Brand
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Enter a Facebook Page URL to track their ads.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex flex-col gap-2">
                    <input
                      id="inline-facebook"
                      placeholder="e.g. https://facebook.com/competitor"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val) onSaveField?.('facebookPageUrl', val);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="w-full bg-info hover:bg-info/90 text-info-foreground"
                      onClick={() => {
                        const el = document.getElementById('inline-facebook') as HTMLInputElement;
                        if (el?.value) onSaveField?.('facebookPageUrl', el.value);
                      }}
                    >
                      Start Tracking
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {profile?.facebookPageUrl && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="shadow-sm border-border/40">
                  <CardContent className="p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                      <Film className="h-3 w-3 text-info" /> Active Ads
                    </p>
                    <p className="text-3xl font-black tracking-tighter">{formatNumber(creator?.totalPosts || 0)}</p>
                  </CardContent>
                </Card>
              </div>

              {!history.length && (
                <div className="flex flex-col items-center justify-center p-8 mt-6 bg-muted/20 border border-dashed border-border/60 rounded-3xl text-center">
                  <Sparkles className="h-10 w-10 text-info/50 mb-4" />
                  <h3 className="text-lg font-bold text-foreground">Analytics Not Scraped Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md mt-2">
                    Click the &quot;Scrape Ads&quot; button above to fetch their latest ads and generate a Strategy Report.
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="mentor" className="space-y-6 focus-visible:outline-none">
          {history.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                    <History className="h-4 w-4 text-info" /> Past Reports
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => setConfirmReport(true)}
                    disabled={generatingReport}
                    className="h-8 text-[10px] bg-info hover:bg-info/90 text-info-foreground"
                  >
                    {generatingReport ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    New Report
                  </Button>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {history.map((h: any) => (
                    <button
                      key={h.id}
                      onClick={() => setActiveAnalysis(h)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${activeAnalysis?.id === h.id ? "bg-info/10 border-info/30 shadow-sm" : "bg-card border-border/50 hover:border-info/30"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-foreground">
                          {new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${h.healthScore > 80 ? "bg-success/20 text-success" :
                            h.healthScore > 60 ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"
                          }`}>
                          Score: {h.healthScore}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 opacity-80">
                        {h.reportMarkdown.substring(0, 80)}...
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="rounded-3xl bg-background/50 backdrop-blur-xl border border-border/50 overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-info/10 to-transparent border-b border-border/50 p-6 sm:p-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-info" /> Brutal Mentor Analysis
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">Generated on {new Date(activeAnalysis.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className={`text-4xl font-black tracking-tighter ${activeAnalysis.healthScore > 80 ? "text-success" :
                        activeAnalysis.healthScore > 60 ? "text-warning" : "text-destructive"
                      }`}>
                      {activeAnalysis.healthScore}
                    </div>
                  </div>
                  <div className="p-6 sm:p-8 overflow-x-auto">
                    <MarkdownContent content={activeAnalysis.reportMarkdown} variant="analysis" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 mt-8 text-center border border-dashed rounded-3xl glass border-info/20 text-muted-foreground bg-gradient-to-br from-info/5 to-transparent">
              <Zap className="h-12 w-12 text-info/50 mb-4" />
              <h3 className="text-xl font-bold text-foreground">No Competitor Mentor Reports Yet</h3>
              <p className="max-w-md mt-2 mb-6">
                Generate your first brutally honest breakdown of this brand's ad strategy. Discover what makes them convert and learn from it.
              </p>
              <Button 
                onClick={() => setConfirmReport(true)}
                disabled={generatingReport}
                className="bg-info hover:bg-info/90 text-info-foreground rounded-xl shadow-lg shadow-info/20 px-8 h-12"
              >
                {generatingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate Mentor Report (1 Credit)
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {posts.map((post) => (
              <AdCard key={post.adArchiveId || post.id} post={post} />
            ))}
            {posts.length === 0 && <p className="text-muted-foreground text-sm col-span-full">No active ads tracked yet.</p>}
          </div>
        </TabsContent>


      </Tabs>

      <ConfirmCreditModal
        open={confirmSync}
        onOpenChange={setConfirmSync}
        onConfirm={() => {
          handleSyncProfile();
        }}
        title="Scrape Brand & Analytics"
        description="This will scrape the brand's active ads and generate an intelligence analysis."
        creditCost="1 Credit"
        confirmText="Start Scraping"
      />

      <ConfirmCreditModal
        open={confirmReport}
        onOpenChange={setConfirmReport}
        onConfirm={() => {
          handleGenerateReport();
        }}
        title="Generate Strategy Report"
        description="This will consume 1 credit to generate a deep AI breakdown of this brand's ad strategy."
        creditCost="1 Credit"
        confirmText="Generate Report"
      />

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent className="glass-strong rounded-2xl border-destructive/30 w-[95%] sm:max-w-md mx-auto shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              Stop Tracking Brand
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Are you sure you want to stop tracking this brand? This will clear its data from this dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-3 sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => setConfirmRemove(false)}
              className="rounded-xl border border-border/40 hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmRemove(false);
                handleRemoveProfile();
              }}
              className="rounded-xl"
            >
              Stop Tracking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getMediaUrl(ad: any) {
  if (ad.displayFormat === "VIDEO" && ad.videos && ad.videos.length > 0) {
    return ad.videos[0].videoHdUrl || ad.videos[0].videoSdUrl || null;
  }
  if (ad.images && ad.images.length > 0) {
    return ad.images[0].originalImageUrl || ad.images[0].resizedImageUrl || null;
  }
  return null;
}

function getPreviewUrl(ad: any) {
  if (ad.displayFormat === "VIDEO" && ad.videos && ad.videos.length > 0) {
    return ad.videos[0].videoPreviewImageUrl || null;
  }
  return getMediaUrl(ad);
}

function AdCard({ post }: { post: any }) {
  const previewUrl = getPreviewUrl(post);
  return (
    <Card className="overflow-hidden group flex flex-col bg-card border-border/40 shadow-sm transition-all hover:shadow-xl hover:border-info/30">
      <div className="relative aspect-[4/5] bg-black/5 overflow-hidden">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/proxy-image?url=${encodeURIComponent(previewUrl)}`}
            alt="Thumbnail"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Film className="h-6 w-6 opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur-md border-0 w-fit text-[8px] px-1.5 h-4">
              {formatDate(post.startDate)}
            </Badge>
            <span className="text-white font-bold text-[10px] flex items-center gap-1 drop-shadow-md">
               {post.displayFormat || "AD"}
            </span>
          </div>
        </div>
      </div>
      {(post.pageName) && (
        <div className="p-2">
          <p className="text-[10px] text-muted-foreground line-clamp-1">
            {post.pageName}
          </p>
        </div>
      )}
    </Card>
  );
}

function SocialLink({ field, value, prefix = "@", onSave, onClickUnlinked }: any) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");

  if (editing) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <input value={val} onChange={(e) => setVal(e.target.value)} className="h-8 w-full max-w-[180px] rounded-lg text-xs border border-border/50 bg-background px-2 focus:outline-none focus:border-success" />
        <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={() => { onSave(val); setEditing(false); }}>
          <Check className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => {
        if (!value && onClickUnlinked) {
          onClickUnlinked();
        } else {
          setEditing(true);
        }
      }} 
      className="mt-1 flex items-center justify-between w-full text-foreground group"
    >
      <span className="text-sm font-bold tracking-tight">
        {value ? (
          <>
            <span className="opacity-20 mr-0.5">{prefix}</span>
            {value}
          </>
        ) : "Unlinked"}
      </span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
    </button>
  );
}
