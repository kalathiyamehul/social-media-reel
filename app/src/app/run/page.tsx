"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
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
import type { Config, ScrapedVideo } from "@/lib/types";

function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export default function RunPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [selectedConfig, setSelectedConfig] = useState("");
  const [maxVideos, setMaxVideos] = useState(20);
  const [topK, setTopK] = useState(3);
  const [nDays, setNDays] = useState(30);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedVideoUrls, setSelectedVideoUrls] = useState<Set<string>>(new Set());
  
  const logEndRef = useRef<HTMLDivElement>(null);

  const { running, progress, candidates, runPipeline, resetPipeline } = usePipeline();

  useEffect(() => {
    fetch("/api/configs").then((r) => r.json()).then(setConfigs);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [progress?.log.length]);

  // When candidates arrive, select them all by default
  useEffect(() => {
    if (candidates) {
      setSelectedVideoUrls(new Set(candidates.map(v => v.videoUrl)));
    }
  }, [candidates]);

  const handleFetch = () => {
    if (!selectedConfig) return;
    runPipeline({ configName: selectedConfig, maxVideos, topK, nDays });
  };

  const handleRunAnalysis = () => {
    if (!candidates || selectedVideoUrls.size === 0) return;
    const selectedVideos = candidates.filter(v => selectedVideoUrls.has(v.videoUrl));
    runPipeline({ 
      configName: selectedConfig, 
      maxVideos, 
      topK, 
      nDays, 
      selectedVideos 
    });
  };

  const toggleSelectAll = () => {
    if (candidates) {
      if (selectedVideoUrls.size === candidates.length) {
        setSelectedVideoUrls(new Set());
      } else {
        setSelectedVideoUrls(new Set(candidates.map(v => v.videoUrl)));
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
      return progress.creatorsTotal > 0 ? (progress.creatorsScraped / progress.creatorsTotal) * 100 : 0;
    }
    if (progress.phase === "analyzing") {
      return progress.videosTotal > 0 ? (progress.videosAnalyzed / progress.videosTotal) * 100 : 0;
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
            {currentStep === "setup" && "Step 1: Configure and fetch candidates"}
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
        <div className="glass rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold">Select Target Config</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Configuration</Label>
              <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                <SelectTrigger className="mt-1.5 rounded-xl glass border-white/[0.08] h-11">
                  <SelectValue placeholder="Select a config..." />
                </SelectTrigger>
                <SelectContent>
                  {configs.map((c) => (
                    <SelectItem key={c.id} value={c.configName}>{c.configName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`} />
              Advanced scraping settings
            </button>

            {showAdvanced && (
              <div className="grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <Label className="text-xs text-muted-foreground">Max Reels per Creator</Label>
                  <Input
                    type="number"
                    value={maxVideos}
                    onChange={(e) => setMaxVideos(Number(e.target.value))}
                    min={1}
                    max={100}
                    className="mt-1.5 rounded-xl glass border-white/[0.08] h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Top K to Fetch</Label>
                  <Input
                    type="number"
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                    min={1}
                    max={10}
                    className="mt-1.5 rounded-xl glass border-white/[0.08] h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Days Lookback</Label>
                  <Input
                    type="number"
                    value={nDays}
                    onChange={(e) => setNDays(Number(e.target.value))}
                    min={1}
                    max={365}
                    className="mt-1.5 rounded-xl glass border-white/[0.08] h-11"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleFetch}
              disabled={running || !selectedConfig}
              size="lg"
              className="w-full rounded-xl h-12 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0 glow-sm transition-all duration-300 hover:glow text-sm font-semibold"
            >
              <Zap className="h-4 w-4 mr-2" />
              Fetch Candidate Reels
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
                  <div className="aspect-[9/16] relative bg-white/[0.02]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(video.thumbnail)}`}
                      alt={`@${video.username}`}
                      className="h-full w-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all"
                    />
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
          <div className="glass rounded-2xl p-6 space-y-5">
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
                {progress.errors.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    {progress.errors.length}
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progress.status === "completed"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : progress.status === "error"
                      ? "bg-gradient-to-r from-red-500 to-orange-500"
                      : "bg-gradient-to-r from-purple-500 to-indigo-500"
                  }`}
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>

            {/* Active tasks */}
            {progress.activeTasks.length > 0 && (
              <div className="space-y-2">
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
            {progress.status === "completed" && progress.phase === "done" && progress.videosAnalyzed > 0 && (
              <Button asChild className="w-full rounded-xl h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 font-semibold gap-2">
                <Link href="/videos">
                  <Film className="h-4 w-4" />
                  View {progress.videosAnalyzed} New Video Analyses
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            
            {/* Scrape phase complete wait message */}
            {progress.status === "completed" && progress.phase === "done" && progress.candidates && (
              <div className="text-center p-2">
                 <p className="text-xs text-muted-foreground">
                   Candidate fetching complete. Please select videos above to continue.
                 </p>
              </div>
            )}
          </div>

          {/* Log — collapsible */}
          <details className="glass rounded-2xl overflow-hidden" open={running}>
            <summary className="p-4 flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Terminal className="h-4 w-4" />
              <span className="font-medium">Live Execution Log</span>
              <Badge variant="secondary" className="ml-auto rounded-md text-[10px] bg-white/[0.05] border border-white/[0.06]">
                {progress.log.length} entries
              </Badge>
            </summary>
            <div className="border-t border-white/[0.06]">
              <ScrollArea className="h-[200px] p-4">
                <div className="space-y-0.5 font-mono text-[10px]">
                  {progress.log.map((line, i) => (
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
