"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Config, ScrapedVideo, Creator } from "@/lib/types";

function formatViews(n: number): string {
  if (n === undefined || n === null) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export default function RunPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<Config[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedConfig, setSelectedConfig] = useState("");
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [creatorSearch, setCreatorSearch] = useState("");
  const [maxVideos, setMaxVideos] = useState(20);
  const [topK, setTopK] = useState(3);
  const [nDays, setNDays] = useState(30);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedVideoUrls, setSelectedVideoUrls] = useState<Set<string>>(new Set());
  
  const logEndRef = useRef<HTMLDivElement>(null);

  const { running, progress, candidates, runPipeline, resetPipeline } = usePipeline();

  useEffect(() => {
    fetch("/api/configs").then((r) => r.json()).then(setConfigs);
    fetch("/api/creators").then((r) => r.json()).then((data) => {
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

  // Redirect on successful analysis completion
  useEffect(() => {
    if (progress?.status === "completed" && progress.phase === "done" && (progress.videosAnalyzed ?? 0) > 0) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        router.push("/videos");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [progress, router]);

  const handleFetch = () => {
    if (!selectedConfig || selectedCreators.size === 0) return;
    runPipeline({ 
      configName: selectedConfig, 
      maxVideos, 
      topK, 
      nDays,
      usernames: Array.from(selectedCreators)
    });
  };

  const handleRunAnalysis = () => {
    if (!candidates || selectedVideoUrls.size === 0) return;
    const selectedVideos = candidates.filter(v => selectedVideoUrls.has(v.videoUrl || v.postId || ""));
    runPipeline({ 
      configName: selectedConfig, 
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
    if (candidates && progress?.phase !== "analyzing" && progress?.status !== "running") return "picking";
    if (running && progress?.phase === "scraping") return "fetching";
    if (running && progress?.phase === "analyzing") return "analyzing";
    if (progress?.status === "completed" && progress.phase === "done") return "done";
    return "setup";
  }, [running, progress, candidates]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Run Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentStep === "setup" && "Step 1: Select creators & config"}
            {currentStep === "fetching" && "Fetching video candidates..."}
            {currentStep === "picking" && `Step 2: Pick videos to analyze (${candidates?.length ?? 0} found)`}
            {currentStep === "analyzing" && "Step 3: AI Analysis in progress..."}
            {currentStep === "done" && "Pipeline complete!"}
          </p>
        </div>
        {currentStep !== "setup" && !running && (
          <Button variant="ghost" size="sm" onClick={resetPipeline} className="gap-2">
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
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center rounded-full border-purple-500/30 text-purple-400 text-[10px]">1</Badge>
                  <h2 className="text-sm font-semibold text-foreground/90">Select Creators</h2>
                </div>
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
                  className="pl-9 h-9 rounded-xl glass border-white/[0.08] text-xs"
                />
             </div>

             <ScrollArea className="h-[320px] pr-4">
                <div className="grid gap-2">
                   {filteredCreators.map(creator => {
                     const isSelected = selectedCreators.has(creator.username);
                     return (
                       <label 
                        key={creator.username}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isSelected 
                          ? "bg-purple-500/10 border-purple-500/30" 
                          : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05]"
                        }`}
                       >
                         <Checkbox 
                           checked={isSelected}
                           onCheckedChange={() => toggleCreator(creator.username)}
                           className="rounded-md border-white/20 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                         />
                         <div className="h-8 w-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                           <img 
                               src={`/api/proxy-image?url=${encodeURIComponent(creator.profilePicUrl)}`} 
                               alt={creator.username}
                               className="h-full w-full object-cover"
                           />
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-xs font-semibold truncate leading-none">@{creator.username}</p>
                           <p className="text-[10px] text-muted-foreground mt-1">{creator.category}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-[10px] font-medium">{formatViews(creator.followers)}</p>
                           <p className="text-[9px] text-muted-foreground">followers</p>
                         </div>
                       </label>
                     );
                   })}
                </div>
             </ScrollArea>
          </div>

          {/* Config Right Panel */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="glass rounded-2xl p-6 space-y-6 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center rounded-full border-blue-500/30 text-blue-400 text-[10px]">2</Badge>
                <h2 className="text-sm font-semibold text-foreground/90">Configuration</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Analysis Strategy</Label>
                  <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                    <SelectTrigger className="mt-1.5 rounded-xl glass border-white/[0.08] h-11 text-xs">
                      <SelectValue placeholder="Select a strategy..." />
                    </SelectTrigger>
                    <SelectContent>
                      {configs.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-[10px] text-muted-foreground mb-2">No configurations found</p>
                          <Link href="/configs">
                            <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg border-white/[0.08]">
                              Create Config
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        configs.map((c) => (
                          <SelectItem key={c.id || c.configName} value={c.configName}>
                            {c.configName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-white transition-colors"
                  >
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`} />
                    Advanced scraping settings
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
                          className="mt-1 rounded-lg glass border-white/[0.08] h-9 text-xs"
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
                            className="mt-1 rounded-lg glass border-white/[0.08] h-9 text-xs"
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
                            className="mt-1 rounded-lg glass border-white/[0.08] h-9 text-xs"
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
              disabled={running || !selectedConfig || selectedCreators.size === 0}
              size="lg"
              className={`w-full rounded-2xl h-14 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0 glow-sm transition-all duration-300 hover:glow text-sm font-bold gap-3 shadow-xl ${
                selectedCreators.size === 0 ? "opacity-50 grayscale" : "animate-in slide-in-from-bottom-2"
              }`}
            >
              <Zap className={`h-5 w-5 ${selectedCreators.size > 0 ? "text-yellow-300 fill-yellow-300" : ""}`} />
              Fetch Reels for {selectedCreators.size} Creators
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: VIDEO PICKER */}
      {currentStep === "picking" && candidates && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSelectAll}
                className="text-xs gap-2 rounded-lg py-0 h-8"
              >
                {selectedVideoUrls.size === candidates.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                {selectedVideoUrls.size === candidates.length ? "Deselect All" : "Select All"}
              </Button>
              <span className="text-xs text-muted-foreground">
                {selectedVideoUrls.size} of {candidates.length} videos selected
              </span>
            </div>
            <Button
              onClick={handleRunAnalysis}
              disabled={selectedVideoUrls.size === 0}
              className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 border-0 glow-sm h-9 px-6 text-xs"
            >
              Run AI Analysis on {selectedVideoUrls.size} Reels
              <ArrowRight className="h-3.5 w-3.5 ml-2" />
            </Button>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {candidates.map((video) => {
              const isSelected = selectedVideoUrls.has(video.videoUrl);
              return (
                <div 
                  key={video.videoUrl} 
                  className={`group relative glass rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border ${isSelected ? "border-purple-500/50 glow-sm" : "border-white/[0.06] hover:border-white/[0.12]"}`}
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
      {(running || currentStep === "done") && progress && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="glass rounded-2xl p-6 space-y-5 relative overflow-hidden">
            {showSuccess && (
              <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 text-center">
                <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-500/30">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-in zoom-in duration-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Analysis Successful!</h2>
                <p className="text-emerald-100/70 text-sm max-w-[280px]">
                  Redirecting you to the videos dashboard to see your AI-generated insights...
                </p>
                <Loader2 className="h-4 w-4 text-emerald-400/50 animate-spin mt-6" />
              </div>
            )}
            
            <div className={showSuccess ? "opacity-0" : "opacity-100 transition-opacity duration-500"}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {progress.status === "running" && <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />}
                  {progress.status === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  {progress.status === "error" && <XCircle className="h-4 w-4 text-red-400" />}
                  <h2 className="text-sm font-semibold">
                    {progress.status === "running" && progress.phase === "scraping" && "Scraping creators..."}
                    {progress.status === "running" && progress.phase === "analyzing" && `Analyzing ${progress.videosTotal} selected videos...`}
                    {progress.status === "completed" && "Pipeline complete"}
                    {progress.status === "error" && "Pipeline failed"}
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {progress.phase === "scraping" && (
                    <span>Creators: <span className="text-foreground">{progress.creatorsScraped}/{progress.creatorsTotal}</span></span>
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
                <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
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
                      className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2"
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
              <Badge variant="secondary" className="ml-auto rounded-md text-[10px] bg-white/[0.05] border border-white/[0.06]">
                {progress?.log?.length ?? 0} entries
              </Badge>
            </summary>
            <div className="border-t border-white/[0.06]">
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
