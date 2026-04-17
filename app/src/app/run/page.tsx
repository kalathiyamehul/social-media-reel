"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Play, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  Zap, 
  ChevronDown, 
  ArrowRight, 
  Film, 
  AlertTriangle, 
  Search, 
  ChevronLeft,
  CheckSquare,
  Square
} from "lucide-react";
import { usePipeline } from "@/context/pipeline-context";
import type { PromptTemplate as Template, ScrapedVideo, Creator, PipelineProgress } from "@/lib/types";

function formatViews(n: number): string {
  if (n === undefined || n === null) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export default function RunPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [creatorSearch, setCreatorSearch] = useState("");
  const [maxVideos, setMaxVideos] = useState(20);
  const [topK, setTopK] = useState(3);
  const [nDays, setNDays] = useState(30);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [selectedVideoUrls, setSelectedVideoUrls] = useState<Set<string>>(new Set());
  
  const logEndRef = useRef<HTMLDivElement>(null);

  const { running, progress, candidates, runPipeline, resetPipeline } = usePipeline();
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/templates", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      });

    fetch("/api/creators", {
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
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [progress?.log.length]);

  // When candidates arrive, select them all by default
  useEffect(() => {
    if (candidates) {
      setSelectedVideoUrls(new Set(candidates.map(v => (v.videoUrl || v.postId || ""))));
    }
  }, [candidates]);

  const [showSuccess, setShowSuccess] = useState(false);
  // Track the last seen status to detect transitions
  const lastStatusRef = useRef(progress?.status);

  // Redirect on successful analysis completion
  useEffect(() => {
    // Only redirect if the status TRANSITIONS to 'completed' while on this page
    if (
      progress?.status === "completed" && 
      lastStatusRef.current !== "completed" &&
      progress.phase === "done" && 
      (progress.videosAnalyzed ?? 0) > 0
    ) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        router.push("/videos");
      }, 2500);
      return () => clearTimeout(timer);
    }
    lastStatusRef.current = progress?.status;
  }, [progress, router]);

  const handleRunAnalysis = () => {
    if (!candidates || selectedVideoUrls.size === 0) return;
    const selectedVideos = candidates.filter(v => selectedVideoUrls.has(v.videoUrl || v.postId || ""));
    runPipeline({ 
      templateName: selectedTemplate, 
      maxVideos, 
      topK, 
      nDays, 
      selectedVideos 
    });
  };

  const toggleCreator = (username: string) => {
    const next = new Set(selectedCreators);
    if (next.has(username)) next.delete(username);
    else next.add(username);
    setSelectedCreators(next);
  };

  const filteredCreators = creators.filter(c => 
    c.username.toLowerCase().includes(creatorSearch.toLowerCase())
  );

  const toggleSelectAllCreators = () => {
    if (selectedCreators.size === filteredCreators.length) {
      setSelectedCreators(new Set());
    } else {
      setSelectedCreators(new Set(filteredCreators.map(c => c.username)));
    }
  };

  const toggleSelectAll = () => {
    if (candidates) {
      if (selectedVideoUrls.size === candidates.length) {
        setSelectedVideoUrls(new Set());
      } else {
        setSelectedVideoUrls(new Set(candidates.map(v => v.videoUrl || v.postId || "")));
      }
    }
  };

  const toggleVideo = (url: string) => {
    const next = new Set(selectedVideoUrls);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelectedVideoUrls(next);
  };

  const totalProgress = useMemo(() => {
    if (!progress) return 0;
    if (progress.phase === "scraping") {
      const scraped = progress.creatorsScraped ?? 0;
      const total = progress.creatorsTotal ?? 1;
      return (scraped / total) * 100;
    }
    if (progress.phase === "analyzing") {
      const analyzed = progress.videosAnalyzed ?? 0;
      const total = progress.videosTotal ?? 1;
      return (analyzed / total) * 100;
    }
    if (progress.phase === "done") return 100;
    return 0;
  }, [progress]);

  const currentStep = useMemo(() => {
    if (!progress) return "setup";

    // 1. Completion state (Only when we actually analyzed something)
    if (progress.status === "completed" && progress.phase === "done") return "done";
    
    // 2. Analysis state (Running or Error)
    const isAnalyzing = progress.phase === "analyzing";
    if (isAnalyzing || (running && isAnalyzing)) return "analyzing";
    
    // 3. Picking state
    if (progress.phase === "picking" || (candidates && progress.status === "completed" && progress.phase !== "done")) return "picking";

    // 4. Initial fetching/scraping state
    if (running && progress.phase === "scraping") return "fetching";
    
    // 5. Default setup state
    return "setup";
  }, [running, progress, candidates]);

  const handleFetch = useCallback(() => {
    console.log("[Pipeline] handleFetch triggered", { selectedTemplate, selectedCreatorsSize: selectedCreators.size });
    if (!selectedTemplate || selectedCreators.size === 0) {
      console.warn("[Pipeline] Aborting fetch: missing template or creators");
      return;
    }
    runPipeline({ 
      templateName: selectedTemplate, 
      maxVideos, 
      topK, 
      nDays,
      usernames: Array.from(selectedCreators)
    });
  }, [selectedTemplate, selectedCreators, maxVideos, topK, nDays, runPipeline]);

  // Automatic fetching removed as requested

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Run Pipeline</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {currentStep === "setup" && "Step 1: Select creators & strategy"}
            {currentStep === "fetching" && "Loading unanalyzed reels from database..."}
            {currentStep === "picking" && `Step 2: Pick videos to analyze (${candidates?.length ?? 0} found)`}
            {currentStep === "analyzing" && "Step 3: AI Analysis in progress..."}
            {currentStep === "done" && "Pipeline complete!"}
          </p>
        </div>
        {currentStep !== "setup" && !running && (
          <Button variant="ghost" size="sm" onClick={resetPipeline} className="w-fit gap-2 text-xs sm:text-sm h-8 sm:h-9">
            <ChevronLeft className="h-4 w-4" />
            Start Over
          </Button>
        )}
      </div>

      {/* STEP 1: INITIAL SETUP */}
      {currentStep === "setup" && (
        <div className="grid gap-6 md:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Creator Selection Left Panel */}
          <div className="md:col-span-7 glass rounded-2xl p-6 space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-tight text-foreground/90">Select Creators</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleSelectAllCreators}
                  className="h-7 text-[10px] gap-1.5 hover:bg-white/5"
                >
                  {selectedCreators.size === filteredCreators.length ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                  {selectedCreators.size === filteredCreators.length ? "Deselect All" : "Select All"}
                </Button>
             </div>

             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Filter creators..." 
                  value={creatorSearch}
                  onChange={(e) => setCreatorSearch(e.target.value)}
                  className="pl-9 h-9 rounded-xl glass border-border text-xs shadow-sm"
                />
             </div>

             <ScrollArea className="h-[400px] pr-4">
                <div className="grid gap-2">
                   {filteredCreators.map(creator => {
                     const isSelected = selectedCreators.has(creator.username);
                     return (
                       <label 
                        key={creator.username}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                          isSelected 
                          ? "bg-purple-500/5 border-purple-500/30 shadow-md shadow-purple-500/5" 
                          : "bg-muted/30 border-border hover:bg-muted/50 shadow-sm"
                        }`}
                       >
                         <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
                            isSelected ? "border-purple-500 bg-purple-500" : "border-border/60 bg-transparent"
                         }`}>
                           {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                         </div>

                         <div className="h-10 w-10 rounded-full overflow-hidden border border-border/30 shrink-0 shadow-sm">
                           <img 
                               src={`/api/proxy-image?url=${encodeURIComponent(creator.profilePicUrl)}`} 
                               alt={creator.username}
                               className="h-full w-full object-cover"
                           />
                         </div>
                         
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-bold truncate text-foreground transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">@{creator.username}</p>
                           <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{creator.category}</p>
                         </div>

                         <div className="text-right shrink-0">
                           <p className="text-sm font-bold tracking-tight">{formatViews(creator.followers)}</p>
                           <p className="text-[10px] text-muted-foreground font-medium lowercase">followers</p>
                         </div>
                         <input 
                           type="checkbox"
                           className="sr-only"
                           checked={isSelected}
                           onChange={() => toggleCreator(creator.username)}
                         />
                       </label>
                     );
                   })}
                </div>
             </ScrollArea>
          </div>

          {/* Template Right Panel */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="glass rounded-2xl p-6 space-y-6 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-foreground/90">Prompt Template</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Prompt Template</Label>
                  <ScrollArea className="h-[240px] mt-2 pr-4 -mr-4 border-t border-border/5 pt-2">
                    <div className="grid gap-2">
                      {templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 glass rounded-xl border-dashed border-border/40 text-center">
                          <Zap className="h-6 w-6 text-muted-foreground/30 mb-2" />
                          <p className="text-[10px] text-muted-foreground">No templates found</p>
                          <Link href="/templates" className="mt-2">
                             <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg border-border/50">
                               Setup Now
                             </Button>
                          </Link>
                        </div>
                      ) : (
                        templates.map((t) => {
                          const isSelected = selectedTemplate === t.templateName;
                          return (
                            <button
                              key={t.id || t.templateName}
                              onClick={() => setSelectedTemplate(t.templateName)}
                              className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group/strat ${
                                isSelected 
                                  ? "bg-purple-500/10 border-purple-500 shadow-md shadow-purple-500/5 ring-1 ring-purple-500/20" 
                                  : "glass border-border hover:border-purple-500/30 hover:bg-muted/50"
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <CheckCircle2 className="h-3 w-3 text-purple-500" />
                                </div>
                              )}
                              <p className={`text-xs font-bold transition-colors ${isSelected ? "text-purple-600 dark:text-purple-400" : "text-foreground"}`}>
                                {t.templateName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 rounded-md transition-colors ${isSelected ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30" : "bg-muted/80 text-muted-foreground border-border/30"}`}>
                                  {t.creatorsCategory || "General"}
                                </Badge>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`} />
                    More settings
                  </button>

                  {showAdvanced && (
                    <div className="grid gap-3 pt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Max Reels per Creator</Label>
                        <Input
                          type="number"
                          value={maxVideos}
                          onChange={(e) => setMaxVideos(Number(e.target.value))}
                          min={1}
                          max={100}
                          className="mt-1 rounded-lg glass border-border/50 h-9 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Top K to Fetch</Label>
                          <Input
                            type="number"
                            value={topK}
                            onChange={(e) => setTopK(Number(e.target.value))}
                            min={1}
                            max={10}
                            className="mt-1 rounded-lg glass border-border/50 h-9 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Days Lookback</Label>
                          <Input
                            type="number"
                            value={nDays}
                            onChange={(e) => setNDays(Number(e.target.value))}
                            min={1}
                            max={365}
                            className="mt-1 rounded-lg glass border-border/50 h-9 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleFetch}
              disabled={!selectedTemplate || selectedCreators.size === 0 || running}
              className={`w-full rounded-2xl h-14 font-semibold transition-all duration-300 border shadow-lg ${
                !selectedTemplate || selectedCreators.size === 0
                  ? "bg-foreground/[0.01] border-dashed border-border/20 text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-indigo-600 border-purple-400/30 text-white hover:shadow-purple-500/20 glow-sm"
              }`}
            >
              {!selectedTemplate || selectedCreators.size === 0 ? (
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span className="text-xs">Select template & creators to start</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start Fetching Reels</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: VIDEO PICKER */}
      {currentStep === "picking" && candidates && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSelectAll}
                className="text-[10px] sm:text-xs gap-2 rounded-lg py-0 h-8"
              >
                {selectedVideoUrls.size === candidates.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                {selectedVideoUrls.size === candidates.length ? "Deselect All" : "Select All"}
              </Button>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {selectedVideoUrls.size} of {candidates.length} selected
              </span>
            </div>
            <Button
              onClick={handleRunAnalysis}
              disabled={selectedVideoUrls.size === 0}
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 border-0 glow-sm h-10 sm:h-9 px-6 text-[10px] sm:text-xs"
            >
              Run AI Analysis on {selectedVideoUrls.size} Reels
              <ArrowRight className="h-3.5 w-3.5 ml-2" />
            </Button>
          </div>

          <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {candidates.map((video) => {
              const isSelected = selectedVideoUrls.has(video.videoUrl);
              return (
                <div 
                  key={video.videoUrl} 
                  className={`group relative glass rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border ${isSelected ? "border-purple-500/50 glow-sm" : "border-border/60 hover:border-border"}`}
                  onClick={() => toggleVideo(video.videoUrl)}
                >
                  <div className="aspect-[9/16] relative bg-gradient-to-b from-purple-900/20 to-black/40 group-hover:from-purple-900/30 transition-all">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {video.thumbnail ? (
                      <img
                        src={`/api/proxy-image?url=${encodeURIComponent(video.thumbnail)}`}
                        alt={`@${video.username}`}
                        className="h-full w-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all"
                        onError={(e) => {
                          // Hide broken image to show styled background
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                         <Film className="h-8 w-8 text-white/10" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                       <Checkbox 
                        checked={isSelected} 
                        className="rounded-md h-5 w-5 bg-black/40 border-white/20 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-400" 
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-[10px] font-bold text-white truncate">@{video.username}</p>
                      <p className="text-[10px] text-white/70 font-medium">
                        {formatViews(video.views)} views
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3 & LOGS: PROGRESS VIEW */}
      {(running || currentStep === "done" || progress?.status === "error") && progress && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="glass rounded-2xl p-6 space-y-5 relative overflow-hidden">
            {showSuccess && (
              <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500 text-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400 animate-in zoom-in duration-500" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Analysis Successful!</h2>
                <p className="text-emerald-100/70 text-xs sm:text-sm max-w-[280px]">
                  Redirecting to the videos dashboard...
                </p>
                <Loader2 className="h-4 w-4 text-emerald-400/50 animate-spin mt-6" />
              </div>
            )}
            
            <div className={showSuccess ? "opacity-0" : "opacity-100 transition-opacity duration-500"}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {progress.status === "running" && <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />}
                  <h2 className="text-sm font-semibold">
                    {progress?.status === "running" && progress.phase === "scraping" && "Loading unanalyzed reels..."}
                    {progress.status === "running" && progress.phase === "analyzing" && `Analyzing ${progress.videosTotal} selected videos...`}
                    {progress.status === "completed" && "Pipeline complete"}
                    {progress.status === "error" && "Pipeline failed"}
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {progress.phase === "scraping" && (
                    <span>Database query: <span className="text-foreground">Done</span></span>
                  )}
                  {(progress.phase === "analyzing" || progress.phase === "done") && (
                    <span>Analyzed: <span className="text-foreground">{progress.videosAnalyzed}/{progress.videosTotal}</span></span>
                  )}
                  {(progress?.errors?.length ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      {progress?.errors?.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-5">
                <div className="h-2 rounded-full bg-muted border border-border/20 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress?.status === "completed"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                        : progress?.status === "error"
                        ? "bg-gradient-to-r from-red-500 to-orange-500"
                        : "bg-gradient-to-r from-purple-500 to-indigo-500"
                    }`}
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              </div>

              {/* Active tasks */}
              {(progress?.activeTasks?.length ?? 0) > 0 && (
                <div className="space-y-2 mt-5">
                  {progress.activeTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-xl bg-muted/60 border border-border px-3 py-2 shadow-sm"
                    >
                      <Loader2 className="h-3 w-3 text-purple-400 animate-spin shrink-0" />
                      <span className="text-xs font-medium text-foreground/80">@{task.creator}</span>
                      <span className="text-[11px] text-muted-foreground">{task.step}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Completion CTA */}
              {progress?.status === "completed" && progress.phase === "done" && (progress.videosAnalyzed ?? 0) > 0 && (
                <Button asChild className="w-full mt-5 rounded-xl h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 font-semibold gap-2">
                  <Link href="/videos">
                    <Film className="h-4 w-4" />
                    View {progress.videosAnalyzed} New Video Analyses
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              
              {/* Scrape phase complete wait message */}
              {progress?.status === "completed" && progress.phase === "done" && progress.candidates && (
                <div className="text-center p-2 mt-3">
                   <p className="text-xs text-muted-foreground">
                     Candidate fetching complete. Please select videos above to continue.
                   </p>
                </div>
              )}
            </div>
          </div>

          {/* Log — collapsible */}
          <details className="glass rounded-2xl overflow-hidden" open={running}>
            <summary className="p-4 flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Terminal className="h-4 w-4" />
              <span className="font-medium">Live Execution Log</span>
              <Badge variant="secondary" className="ml-auto rounded-md text-[10px] bg-muted/80 border border-border">
                {progress?.log?.length ?? 0} entries
              </Badge>
            </summary>
            <div className="border-t border-border/20">
              <ScrollArea className="h-[200px] p-4">
                <div className="space-y-0.5 font-mono text-[10px]">
                  {(progress?.log ?? []).map((line, i) => (
                    <div
                      key={i}
                      className={`leading-5 ${
                        line.includes("Error") || line.includes("error")
                          ? "text-red-400"
                          : line.includes("done") || line.includes("complete") || line.includes("Complete")
                          ? "text-emerald-400/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      {line}
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </ScrollArea>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
