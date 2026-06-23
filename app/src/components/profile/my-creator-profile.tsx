"use client";

import { useState, useEffect, useCallback } from "react";
import { BASE_URL } from "@/lib/config";
import { useAuth } from "@/context/auth-context";
import { Loader2, Instagram, Facebook, Sparkles, Zap, History, PlayCircle, Eye, Heart, Film, ArrowRight, TrendingUp, UserCircle, Mail, Globe, Linkedin, Check, Pencil, Users, Share2 } from "lucide-react";
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

export function MyCreatorProfile({ profile, onSaveField, memberSince }: { profile: any; onSaveField?: any; memberSince?: any }) {
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
    if (!token || !profile?.instagramHandle) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch creator details
      const cRes = await fetch(`/api/creators/${profile.instagramHandle}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (cRes.ok) {
        const cData = await cRes.json();
        setCreator(cData);
      }

      // Fetch posts
      const pRes = await fetch(`/api/videos?username=${profile.instagramHandle}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        setPosts(pData);
      }

      // Fetch Mentor History
      const hRes = await fetch(`${BASE_URL}/self-analysis/history?platform=INSTAGRAM`, {
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
  }, [token, profile?.instagramHandle]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSyncProfile = async () => {
    setConfirmSync(false);
    if (!token || !profile?.instagramHandle) return;
    try {
      setSyncing(true);
      const res = await fetch(`/api/self-analysis/sync-profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: profile.instagramHandle })
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
    if (!token || !profile?.instagramHandle) return;
    try {
      setGeneratingReport(true);
      const res = await fetch(`/api/self-analysis/instagram`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: profile.instagramHandle })
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
    onSaveField?.('instagramHandle', '');
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
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 mt-8">

      {/* Hero Profile Section */}
      <div className="relative rounded-3xl overflow-hidden border border-border/50 bg-card shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-50" />
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
              <span className="text-4xl font-bold opacity-30">{profile?.instagramHandle ? profile.instagramHandle.charAt(0).toUpperCase() : "?"}</span>
            )}
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground truncate">
              {creator?.name || (profile?.instagramHandle ? `@${profile.instagramHandle}` : profile?.fullName || "Unlinked Profile")}
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1 mb-3 truncate flex items-center gap-2">
              <Instagram className="h-4 w-4 text-orange-500" /> {profile?.instagramHandle ? `@${profile.instagramHandle}` : "Not Connected"}
            </p>

            {creator?.category && (
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20 mb-4">
                {creator.category}
              </Badge>
            )}

            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed whitespace-pre-wrap line-clamp-3">
              {creator?.bio || (!profile?.instagramHandle ? "Connect your Instagram profile to start generating AI insights and tracking your performance." : "No biography provided.")}
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
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Posts</span>
              </div>
            </div>
            <div className="flex sm:flex-col justify-center">
              {profile?.instagramHandle && (
                <Button
                  onClick={() => setConfirmSync(true)}
                  disabled={syncing}
                  className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/20 rounded-xl h-full py-4 w-full sm:w-auto whitespace-nowrap"
                >
                  {syncing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing...</>
                  ) : (
                    <><Zap className="mr-2 h-4 w-4" /> Sync Profile</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full focus-visible:outline-none">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 bg-muted/50 p-1 mb-8 rounded-xl max-w-2xl">
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Account Settings</TabsTrigger>
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Dashboard</TabsTrigger>
          <TabsTrigger value="mentor" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-purple-600 data-[state=active]:text-purple-600">Mentor Report</TabsTrigger>
          <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Performances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
          {!profile?.instagramHandle && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-orange-500/5 to-rose-500/5 border-orange-500/20 overflow-hidden relative">
                <div className="absolute right-0 top-0 opacity-10 translate-x-1/4 -translate-y-1/4">
                  <Instagram className="h-48 w-48 text-orange-500" />
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-orange-500" />
                    Connect Instagram
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sync profile & get Mentor feedback.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex flex-col gap-2">
                    <input
                      id="inline-instagram"
                      placeholder="@username"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val) {
                            onSaveField?.('instagramHandle', val);
                            setTimeout(() => setConfirmSync(true), 500);
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => {
                        const el = document.getElementById('inline-instagram') as HTMLInputElement;
                        if (el?.value) {
                          onSaveField?.('instagramHandle', el.value);
                          setTimeout(() => setConfirmSync(true), 500);
                        }
                      }}
                    >
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {profile?.instagramHandle && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="shadow-sm border-border/40">
                  <CardContent className="p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                      <Film className="h-3 w-3 text-orange-500" /> Reels (30d)
                    </p>
                    <p className="text-3xl font-black tracking-tighter">{formatNumber(creator?.reelsCount30d || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-border/40">
                  <CardContent className="p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                      <Eye className="h-3 w-3 text-sky-500" /> Avg Views
                    </p>
                    <p className="text-3xl font-black tracking-tighter">{formatNumber(creator?.avgViews30d || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-border/40">
                  <CardContent className="p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-emerald-500" /> Engagement
                    </p>
                    <p className="text-3xl font-black tracking-tighter">{(creator?.engagementRate ? creator.engagementRate * 100 : 0).toFixed(2)}%</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-border/40">
                  <CardContent className="p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                      <Heart className="h-3 w-3 text-rose-500" /> Avg Likes
                    </p>
                    <p className="text-3xl font-black tracking-tighter">
                      {posts.length > 0 ? formatNumber(Math.round(posts.reduce((sum, p) => sum + p.likesCount, 0) / posts.length)) : 0}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {creator?.aiInsights && (
                <div className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-sm border-border/40">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-emerald-500" />
                          Why You Are Successful
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-4">
                          {creator.aiInsights.successFactors?.map((reason: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm">
                              <span className="flex shrink-0 w-6 h-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs">{i + 1}</span>
                              <span className="pt-0.5 leading-relaxed font-medium text-foreground/80">{reason}</span>
                            </li>
                          ))}
                          {!creator.aiInsights.successFactors?.length && (
                            <p className="text-muted-foreground text-sm italic">Not enough data to analyze success factors yet.</p>
                          )}
                        </ul>
                      </CardContent>
                    </Card>

                    <div className="space-y-6 flex flex-col">
                      <Card className="shadow-sm border-border/40 flex-1">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Film className="h-5 w-5 text-blue-500" />
                            Content Themes & Niche
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {creator.aiInsights.contentThemes?.map((theme: string, i: number) => (
                              <Badge key={i} variant="secondary" className="px-3 py-1.5 bg-blue-500/10 text-blue-600 border-none font-medium hover:bg-blue-500/20 text-xs">
                                {theme}
                              </Badge>
                            ))}
                            {!creator.aiInsights.contentThemes?.length && (
                              <p className="text-muted-foreground text-sm italic">No dominant themes detected.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-sm border-border/40">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Eye className="h-5 w-5 text-purple-500" />
                            Consistency & Evolution
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                          {creator.aiInsights.evolution && (
                            <div>
                              <span className="font-semibold block mb-1">Growth Path:</span>
                              <span className="text-muted-foreground">{creator.aiInsights.evolution}</span>
                            </div>
                          )}
                          {creator.aiInsights.consistencyFeedback && (
                            <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                              <span className="font-semibold block mb-1">Posting Habit:</span>
                              <span className="text-muted-foreground">{creator.aiInsights.consistencyFeedback}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Card className="shadow-sm border-border/40 bg-gradient-to-br from-orange-500/5 to-transparent">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Zap className="h-5 w-5 text-orange-500" />
                          Hook Strategy Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-foreground/80 font-medium italic">
                          &quot;{creator.aiInsights.hookAnalysis || "Analyzing how you capture attention in the first 3 seconds..."}&quot;
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border-border/40 bg-gradient-to-br from-emerald-500/5 to-transparent">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5 text-emerald-500" />
                          Target Audience Profile
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-foreground/80 font-medium">
                          {creator.aiInsights.audienceArchetype || "Identifying the core demographic and interest groups..."}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {creator.aiInsights.strongVsGoodPoints && (
                    <div className="mt-8 border border-border/50 rounded-2xl p-6 sm:p-8 bg-card shadow-sm overflow-x-auto">
                      <MarkdownContent content={creator.aiInsights.strongVsGoodPoints} variant="analysis" />
                    </div>
                  )}
                </div>
              )}

              {!creator?.aiInsights && (
                <div className="flex flex-col items-center justify-center p-8 mt-6 bg-muted/20 border border-dashed border-border/60 rounded-3xl text-center">
                  <Sparkles className="h-10 w-10 text-orange-500/50 mb-4" />
                  <h3 className="text-lg font-bold text-foreground">Analytics Not Synced Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md mt-2">
                    Click the &quot;Sync Profile&quot; button above to scrape your latest reels and generate your Hook Strategy.
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
                    <History className="h-4 w-4 text-purple-500" /> Past Reports
                  </h3>
                  <Button 
                    size="sm" 
                    onClick={() => setConfirmReport(true)}
                    disabled={generatingReport}
                    className="h-8 text-[10px] bg-purple-500 hover:bg-purple-600 text-white"
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
                      className={`w-full text-left p-4 rounded-xl border transition-all ${activeAnalysis?.id === h.id ? "bg-purple-500/10 border-purple-500/30 shadow-sm" : "bg-card border-border/50 hover:border-purple-500/30"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-foreground">
                          {new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${h.healthScore > 80 ? "bg-emerald-500/20 text-emerald-600" :
                            h.healthScore > 60 ? "bg-amber-500/20 text-amber-600" : "bg-red-500/20 text-red-600"
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
                  <div className="bg-gradient-to-r from-purple-500/10 to-transparent border-b border-border/50 p-6 sm:p-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" /> Brutal Mentor Analysis
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">Generated on {new Date(activeAnalysis.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}/report/${encodeURIComponent(profile.instagramHandle)}`;
                          navigator.clipboard.writeText(url);
                          toast.success("Public link copied to clipboard!");
                        }}
                        className="h-8 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-xs hidden sm:flex"
                      >
                        <Share2 className="mr-1.5 h-3 w-3" /> Share Report
                      </Button>
                      <div className={`text-4xl font-black tracking-tighter ${activeAnalysis.healthScore > 80 ? "text-emerald-500" :
                          activeAnalysis.healthScore > 60 ? "text-amber-500" : "text-red-500"
                        }`}>
                        {activeAnalysis.healthScore}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 sm:p-8 overflow-x-auto">
                    <MarkdownContent content={activeAnalysis.reportMarkdown} variant="analysis" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 mt-8 text-center border border-dashed rounded-3xl glass border-purple-500/20 text-muted-foreground bg-gradient-to-br from-purple-500/5 to-transparent">
              <Zap className="h-12 w-12 text-purple-500/50 mb-4" />
              <h3 className="text-xl font-bold text-foreground">No Brutal Mentor Reports Yet</h3>
              <p className="max-w-md mt-2 mb-6">
                Generate your first brutally honest breakdown of your profile. Discover your fatal flaws and learn exactly how to fix them.
              </p>
              <Button 
                onClick={() => setConfirmReport(true)}
                disabled={generatingReport}
                className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/20 px-8 h-12"
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
              <PostCard key={post.postId} post={post} type="viral" />
            ))}
            {posts.length === 0 && <p className="text-muted-foreground text-sm col-span-full">No performances tracked yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 focus-visible:outline-none">
          <Card className="rounded-3xl bg-background/50 backdrop-blur-xl border border-border/50 p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><UserCircle className="h-5 w-5 text-muted-foreground" /> Account Settings</h2>
            <div className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Email Address</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{profile?.email}</p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Account Created</span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{memberSince}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-border/30 grid gap-4 sm:grid-cols-3">
                <div className="p-5 rounded-2xl bg-foreground/[0.02] border border-border/30 group hover:border-orange-500/20 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <Instagram className="h-4 w-4 text-orange-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Handle</span>
                  </div>
                  <SocialLink 
                    field="instagramHandle" 
                    value={profile?.instagramHandle} 
                    onSave={(v: string) => onSaveField?.('instagramHandle', v)} 
                    onClickUnlinked={() => setActiveTab("overview")} 
                  />
                </div>
                <div className="p-5 rounded-2xl bg-foreground/[0.02] border border-border/30 group hover:border-blue-500/20 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <Facebook className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Page URL</span>
                  </div>
                  <SocialLink 
                    field="facebookPageUrl" 
                    value={profile?.facebookPageUrl} 
                    prefix="" 
                    onSave={(v: string) => onSaveField?.('facebookPageUrl', v)} 
                    onClickUnlinked={() => setActiveTab("overview")} 
                  />
                </div>
                <div className="p-5 rounded-2xl bg-foreground/[0.02] border border-border/30 group hover:border-sky-500/20 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <Linkedin className="h-4 w-4 text-sky-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Handle</span>
                  </div>
                  <SocialLink 
                    field="linkedInHandle" 
                    value={profile?.linkedInHandle} 
                    prefix="in/" 
                    onSave={(v: string) => onSaveField?.('linkedInHandle', v)} 
                    onClickUnlinked={() => setActiveTab("overview")} 
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border/30 flex justify-end">
                <Button 
                  variant="outline" 
                  className="text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-600 transition-all rounded-xl"
                  onClick={() => setConfirmRemove(true)}
                >
                  Remove Profile Connection
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmCreditModal
        open={confirmSync}
        onOpenChange={setConfirmSync}
        onConfirm={() => {
          handleSyncProfile();
        }}
        title="Sync Profile & Analytics"
        description="This will scrape your profile and generate your Hook Strategy analysis."
        creditCost="1 Credit"
        confirmText="Start Sync"
      />

      <ConfirmCreditModal
        open={confirmReport}
        onOpenChange={setConfirmReport}
        onConfirm={() => {
          handleGenerateReport();
        }}
        title="Generate Mentor Report"
        description="This will consume 1 credit to generate a deep, brutally honest AI breakdown of your Instagram profile's strengths and weaknesses."
        creditCost="1 Credit"
        confirmText="Generate Report"
      />

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent className="glass-strong rounded-2xl border-red-500/30 w-[95%] sm:max-w-md mx-auto shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              Remove Profile
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Are you sure you want to remove your connected profile? This will clear all your dashboard data. You can always reconnect later.
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
              variant="outline"
              onClick={() => {
                setConfirmRemove(false);
                handleRemoveProfile();
              }}
              className="rounded-xl"
            >
              Remove Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PostCard({ post, type }: { post: any, type: 'viral' | 'engagement' }) {
  return (
    <Card className="overflow-hidden group flex flex-col bg-card border-border/40 shadow-sm transition-all hover:shadow-xl hover:border-orange-500/30">
      <div className="relative aspect-[10/16] bg-black/5 overflow-hidden">
        {post.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/proxy-image?url=${encodeURIComponent(post.thumbnailUrl)}`}
            alt="Thumbnail"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Film className="h-6 w-6 opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <a
          href={post.videoUrl || post.url || `https://instagram.com/reel/${post.postId}`}
          target="_blank"
          rel="noreferrer"
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]"
        >
          <PlayCircle className="h-10 w-10 text-white drop-shadow-lg" />
        </a>

        <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur-md border-0 w-fit text-[8px] px-1.5 h-4">
              {formatDate(post.timestamp)}
            </Badge>
            {type === 'viral' ? (
              <span className="text-white font-bold text-[10px] flex items-center gap-1 drop-shadow-md">
                <Eye className="h-2.5 w-2.5 text-orange-400" /> {formatNumber(post.videoPlayCount || 0)}
              </span>
            ) : (
              <span className="text-white font-bold text-[10px] flex items-center gap-1 drop-shadow-md">
                <Heart className="h-2.5 w-2.5 text-rose-400 fill-rose-400" /> {formatNumber(post.likesCount || 0)}
              </span>
            )}
          </div>
        </div>
      </div>
      {(post.caption) && (
        <div className="p-2">
          <p className="text-[10px] text-muted-foreground line-clamp-1">
            {post.caption}
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
        <input value={val} onChange={(e) => setVal(e.target.value)} className="h-8 w-full max-w-[180px] rounded-lg text-xs border border-border/50 bg-background px-2 focus:outline-none focus:border-emerald-500" />
        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={() => { onSave(val); setEditing(false); }}>
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
