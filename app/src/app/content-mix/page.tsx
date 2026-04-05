"use client";

import { useEffect, useState, useMemo } from "react";
import { Film, Sparkles, Wand2, CheckCircle2, RotateCcw, Play, Heart, MessageCircle, X, CheckSquare, Square, ChevronRight, Layers, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownContent } from "@/components/markdown-content";
import type { Video } from "@/lib/types";

function formatViews(n: number): string {
  if (n === undefined || n === null) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export default function ContentMixPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [mixCount, setMixCount] = useState<2 | 3>(2);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/videos").then((r) => r.json()).then(setVideos);
  }, []);

  const toggleVideo = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= mixCount) return prev; // Don't allow more than mixCount
      return [...prev, id];
    });
  };

  const handleMerge = async () => {
    if (selectedIds.length !== mixCount) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    const selectedVideos = videos.filter(v => selectedIds.includes(v.id || v.link));
    
    try {
      const response = await fetch("/api/content-mix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videos: selectedVideos }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Synthesis failed");
      
      setResult(data.mixedConcept);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedIds([]);
    setResult(null);
    setError(null);
  };

  const isReady = selectedIds.length === mixCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Mix</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Synthesize the best strategies from multiple viral reels into a new hybrid concept
          </p>
        </div>
        {(result || selectedIds.length > 0) && !loading && (
          <Button variant="ghost" size="sm" onClick={reset} className="gap-2 text-xs h-8">
            <RotateCcw className="h-3.5 w-3.5" />
            Clear & Reset
          </Button>
        )}
      </div>

      {!result ? (
        <div className="space-y-8">
          {/* Step 1: Select Count */}
          <div className="glass rounded-2xl p-6 border-white/[0.08] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Layers className="h-48 w-48" />
             </div>
             
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="bg-purple-500/20 p-2 rounded-lg">
                    <Wand2 className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">Step 1: Choose Mix Configuration</h2>
                    <p className="text-[11px] text-muted-foreground">How many viral elements would you like to fuse?</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {[2, 3].map((count) => (
                    <button
                      key={count}
                      onClick={() => { setMixCount(count as 2 | 3); setSelectedIds([]); }}
                      className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                        mixCount === count 
                          ? "bg-purple-500/10 border-purple-500/30 text-purple-200 glow-sm" 
                          : "glass border-white/[0.08] text-muted-foreground hover:border-white/[0.2]"
                      }`}
                    >
                      <span className="text-2xl font-bold">{count}</span>
                      <span className="text-[10px] uppercase tracking-wider font-medium opacity-60">Videos Mix</span>
                    </button>
                  ))}
                </div>
             </div>
          </div>

          {/* Step 2: Selection Grid */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                   <h2 className="text-sm font-semibold">Step 2: Select {mixCount} Videos</h2>
                   <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-[10px] bg-white/[0.05] border border-white/[0.08]">
                      {selectedIds.length} / {mixCount}
                   </Badge>
                </div>
                
                <Button 
                   onClick={handleMerge}
                   disabled={!isReady || loading}
                   className="h-9 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0 glow-sm disabled:opacity-30 transition-all font-semibold text-xs gap-2"
                >
                  {loading ? (
                    <>
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Merge Concepts
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </>
                  )}
                </Button>
             </div>

             <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
               {videos.map((video) => {
                 const id = video.id || video.link;
                 const isSelected = selectedIds.includes(id);
                 const isDisabled = !isSelected && selectedIds.length >= mixCount;

                 return (
                   <div 
                     key={id} 
                     onClick={() => !isDisabled && toggleVideo(id)}
                     className={`group relative glass rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border ${
                       isSelected 
                         ? "border-purple-500/50 ring-1 ring-purple-500/20 glow-sm" 
                         : isDisabled 
                         ? "opacity-30 grayscale pointer-events-none" 
                         : "border-white/[0.06] hover:border-white/[0.12]"
                     }`}
                   >
                     <div className="aspect-[3/4] relative bg-white/[0.02]">
                       {video.thumbnail ? (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img
                           src={`/api/proxy-image?url=${encodeURIComponent(video.thumbnail)}`}
                           alt={`@${video.creator}`}
                           className="h-full w-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all"
                         />
                       ) : (
                         <div className="flex h-full items-center justify-center">
                            <Film className="h-8 w-8 text-muted-foreground/20" />
                         </div>
                       )}
                       
                       <div className="absolute top-2 right-2">
                         {isSelected ? (
                           <div className="bg-purple-500 text-white rounded-full p-1 shadow-lg border border-white/20">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                           </div>
                         ) : (
                           <div className="bg-black/30 backdrop-blur-md text-white/50 rounded-full h-5.5 w-5.5 flex items-center justify-center border border-white/10 group-hover:border-white/30">
                              <span className="text-[10px] p-1 opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                           </div>
                         )}
                       </div>

                       <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                         <p className="text-[10px] font-bold text-white truncate">@{video.creator}</p>
                         <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-white/70 font-medium flex items-center gap-0.5">
                              <Play className="h-2 w-2 fill-current" />
                              {formatViews(video.views)}
                            </span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded-sm bg-white/10 text-white/60 border border-white/5 overflow-hidden text-ellipsis whitespace-nowrap max-w-[80px]">
                               {video.configName}
                            </span>
                         </div>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      ) : (
        /* Step 3: Results Display */
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
           {/* Summary Header */}
           <div className="flex items-end gap-4 glass-strong rounded-2xl p-6 border-white/[0.08] relative">
              <div className="flex -space-x-3">
                 {videos.filter(v => selectedIds.includes(v.id || v.link)).map((v, i) => (
                    <div key={i} className="h-16 w-12 rounded-lg border-2 border-background overflow-hidden relative shadow-xl">
                       <img 
                          src={`/api/proxy-image?url=${encodeURIComponent(v.thumbnail)}`} 
                          alt="" 
                          className="h-full w-full object-cover"
                       />
                       <div className="absolute inset-0 bg-purple-500/20" />
                    </div>
                 ))}
              </div>
              <div className="flex-1">
                 <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20 rounded-full mb-2">Hybrid Concept Generated</Badge>
                 <h2 className="text-xl font-bold text-foreground/90">Successfully Synced {mixCount} Strategies</h2>
              </div>
              <Button variant="outline" size="sm" onClick={reset} className="rounded-xl border-white/[0.08] text-xs h-9">
                 New Mix
                 <RotateCcw className="ml-2 h-3 w-3" />
              </Button>
           </div>

           <div className="glass rounded-3xl p-8 border-white/[0.08] shadow-2xl overflow-hidden relative">
              {/* Artistic flare */}
              <div className="absolute -top-32 -right-32 h-64 w-64 bg-purple-500/10 rounded-full blur-[100px]" />
              <div className="absolute -bottom-32 -left-32 h-64 w-64 bg-indigo-500/10 rounded-full blur-[100px]" />
              
              <div className="relative z-10 prose prose-invert prose-sm max-w-none">
                 <MarkdownContent content={result} variant="concepts" />
              </div>
           </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-400/5 border border-red-400/10 text-red-400 text-sm flex items-center gap-3">
           <X className="h-4 w-4" />
           {error}
        </div>
      )}
    </div>
  );
}
