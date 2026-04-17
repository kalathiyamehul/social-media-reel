"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart, MessageCircle, Film, Sparkles, Search, Star, Play, ArrowUpDown, X, ExternalLink, ScanSearch } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import type { Video, PromptTemplate as Template } from "@/lib/types";
import Link from "next/link";

function formatViews(n: number): string {
  if (n === undefined || n === null) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

type SortOption = "views" | "date-posted" | "date-added" | "starred";

export default function VideosPage() {
  return (
    <Suspense>
      <VideosContent />
    </Suspense>
  );
}

function VideosContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filterTemplate, setFilterTemplate] = useState<string>("all");
  const [filterCreator, setFilterCreator] = useState<string>(searchParams.get("creator") || "all");
  const [sortBy, setSortBy] = useState<SortOption>("views");
  const [modalVideo, setModalVideo] = useState<Video | null>(null);
  const [modalSection, setModalSection] = useState<"analysis" | "concepts">("analysis");

  useEffect(() => {
    if (!token) return;
    fetch("/api/videos?onlyAnalyzed=true", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVideos(data.map((p: any) => ({
            id: p.postId,
            link: p.url,
            thumbnail: p.thumbnailUrl,
            creator: p.username,
            views: p.videoPlayCount,
            likes: p.likesCount,
            comments: p.commentsCount,
            analysis: p.analysis,
            newConcepts: p.newConcepts,
            datePosted: p.timestamp ? new Date(p.timestamp).toLocaleDateString() : "",
            dateAdded: new Date(p.createdAt).toLocaleDateString(),
            templateName: p.templateName,
            starred: p.starred
          })));
        }
      });

    fetch("/api/templates", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      });
  }, [token]);

  const uniqueCreators = [...new Set(videos.map((v) => v.creator))].sort();

  const filtered = videos
    .filter((v) => {
      if (filterTemplate !== "all" && v.templateName !== filterTemplate) return false;
      if (filterCreator !== "all" && v.creator !== filterCreator) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "starred") {
        if (a.starred !== b.starred) return a.starred ? -1 : 1;
        return b.views - a.views;
      }
      if (sortBy === "views") return b.views - a.views;
      if (sortBy === "date-posted") return (b.datePosted || "").localeCompare(a.datePosted || "");
      if (sortBy === "date-added") return (b.dateAdded || "").localeCompare(a.dateAdded || "");
      return 0;
    });

  const openModal = (video: Video, section: "analysis" | "concepts") => {
    setModalVideo(video);
    setModalSection(section);
  };

  const handleReanalyze = async (postId: string, templateName: string) => {
    if (!token || !templateName) return;
    
    // Set loading state in the local video object
    setVideos((prev) =>
      prev.map((v) =>
        v.id === postId
          ? { ...v, analysis: "🔄 Re-analyzing... please wait.", newConcepts: "🔄 Regenerating concepts..." }
          : v
      )
    );
    
    // If modal is open for this video, update its local display too
    if (modalVideo?.id === postId) {
      setModalVideo((prev) => prev ? { 
        ...prev, 
        analysis: "🔄 Re-analyzing... please wait.", 
        newConcepts: "🔄 Regenerating concepts..." 
      } : null);
    }

    try {
      const res = await fetch("/api/pipeline/re-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, templateName }),
      });

      if (!res.ok) throw new Error("Failed to re-analyze");
      const data = await res.json();

      // Update videos state with new results
      setVideos((prev) =>
        prev.map((v) =>
          v.id === postId
            ? { ...v, analysis: data.analysis, newConcepts: data.newConcepts }
            : v
        )
      );

      // If modal is open, update modal video
      if (modalVideo?.id === postId) {
        setModalVideo((prev) => prev ? { 
          ...prev, 
          analysis: data.analysis, 
          newConcepts: data.newConcepts 
        } : null);
      }
    } catch (err) {
      console.error("Re-analysis failed:", err);
      const errorMsg = "Error during AI re-analysis. Please try again later.";
      setVideos((prev) =>
        prev.map((v) =>
          v.id === postId
            ? { ...v, analysis: errorMsg, newConcepts: errorMsg }
            : v
        )
      );
      if (modalVideo?.id === postId) {
        setModalVideo((prev) => prev ? { ...prev, analysis: errorMsg, newConcepts: errorMsg } : null);
      }
    }
  };

  const toggleStar = async (id: string, currentStarred: boolean) => {
    const newStarred = !currentStarred;
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, starred: newStarred } : v))
    );
    await fetch(`/api/videos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starred: newStarred }),
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Videos</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Browse analyzed competitor reels with AI insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25 border-none">
            <Link href="/analyze">
              <ScanSearch className="h-4 w-4 mr-2" />
              Single Reel Deep Analyzer
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Select value={filterTemplate} onValueChange={setFilterTemplate}>
          <SelectTrigger className="w-full sm:w-[220px] rounded-xl glass border-border/50 h-10 text-xs">
            <SelectValue placeholder="Filter by template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Templates</SelectItem>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.templateName}>{t.templateName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCreator} onValueChange={setFilterCreator}>
          <SelectTrigger className="w-[150px] sm:w-[200px] flex-1 sm:flex-none rounded-xl glass border-border/50 h-10 text-xs">
            <SelectValue placeholder="Filter by creator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Creators</SelectItem>
            {uniqueCreators.map((c) => (
              <SelectItem key={c} value={c}>@{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[140px] sm:w-[180px] flex-1 sm:flex-none rounded-xl glass border-border/50 h-10 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="views">Most Views</SelectItem>
            <SelectItem value="date-posted">Date Posted</SelectItem>
            <SelectItem value="date-added">Date Added</SelectItem>
            <SelectItem value="starred">Starred First</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-[10px] sm:text-xs bg-foreground/[0.05] border border-border/40 h-10 sm:h-auto">
          {filtered.length} videos
        </Badge>
      </div>

      <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((video) => {
          const id = video.id || video.link;

          return (
            <div key={id} className="group">
              <div className="glass rounded-2xl overflow-hidden transition-all duration-300 hover:border-border">
                <a
                  href={video.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-[9/16] w-full bg-foreground/[0.02] overflow-hidden"
                >
                  {video.thumbnail ? (
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(video.thumbnail)}`}
                      alt={`@${video.creator}`}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Film className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-8 pb-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <Play className="h-4 w-4 text-white fill-white" />
                      <span className="text-[15px] font-bold text-white">
                        {formatViews(video.views)}
                      </span>
                    </div>
                  </div>
                </a>

                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold truncate">@{video.creator}</p>
                    <button
                      onClick={() => toggleStar(id, video.starred)}
                      className="shrink-0 ml-1.5 transition-colors"
                    >
                      <Star
                        className={`h-4 w-4 ${video.starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40 hover:text-yellow-400/60"}`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {formatViews(video.likes)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {formatViews(video.comments)}
                    </span>
                    <span className="ml-auto text-[10px]">{video.datePosted}</span>
                  </div>

                  <Badge variant="secondary" className="rounded-md text-[10px] bg-foreground/[0.05] border border-border/30 text-muted-foreground">
                      {video.templateName}
                  </Badge>

                  <div className="flex gap-1.5 pt-1">
                    {video.analysis?.startsWith("Error during AI analysis") ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReanalyze(id, video.templateName || "")}
                        className="flex-1 rounded-xl text-[11px] h-7 gap-1 transition-all duration-200 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                      >
                        <Sparkles className="h-3 w-3" />
                        Retry
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal(video, "analysis")}
                          className="flex-1 rounded-xl text-[11px] h-7 gap-1 transition-all duration-200 glass border-border/20 text-muted-foreground hover:text-foreground"
                        >
                          <Search className="h-3 w-3" />
                          Analysis
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal(video, "concepts")}
                          className="flex-1 rounded-xl text-[11px] h-7 gap-1 transition-all duration-200 glass border-border/20 text-muted-foreground hover:text-foreground"
                        >
                          <Sparkles className="h-3 w-3" />
                          Concepts
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Film className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">No videos found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Run a pipeline analysis to generate results, or adjust your filters.
          </p>
        </div>
      )}

      <Dialog open={!!modalVideo} onOpenChange={(open) => { if (!open) setModalVideo(null); }}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-hidden glass-strong rounded-2xl border-border p-0 gap-0">
          <DialogTitle className="sr-only">
            {modalSection === "analysis" ? "Video Analysis" : "New Concepts"}
          </DialogTitle>
          {modalVideo && (
            <>
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 p-4 sm:p-5 border-b border-border/20">
                <div className="relative h-20 w-16 sm:h-16 sm:w-12 shrink-0 rounded-lg overflow-hidden bg-foreground/[0.02] shadow-lg">
                  {modalVideo.thumbnail ? (
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(modalVideo.thumbnail)}`}
                      alt={`@${modalVideo.creator}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Film className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <p className="text-sm font-semibold">@{modalVideo.creator}</p>
                    <a
                      href={modalVideo.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-purple-400 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <div className="mt-1 flex items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Play className="h-3 w-3 fill-current" />
                      {formatViews(modalVideo.views)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {formatViews(modalVideo.likes)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {formatViews(modalVideo.comments)}
                    </span>
                  </div>
                </div>
                {/* Section toggle & Retry button */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
                  {modalVideo.analysis?.startsWith("Error during AI analysis") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReanalyze(modalVideo.id, modalVideo.templateName || "")}
                      className="rounded-xl text-xs h-8 gap-1.5 transition-all duration-200 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                    >
                      <Sparkles className="h-3 w-3" />
                      Retry Analysis
                    </Button>
                  )}
                  <div className="flex gap-1.5 flex-1 sm:flex-none">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setModalSection("analysis")}
                      className={`flex-1 sm:flex-none rounded-xl text-xs h-8 gap-1.5 transition-all duration-200 ${
                        modalSection === "analysis"
                          ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Search className="h-3 w-3" />
                      Analysis
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setModalSection("concepts")}
                      className={`flex-1 sm:flex-none rounded-xl text-xs h-8 gap-1.5 transition-all duration-200 ${
                        modalSection === "concepts"
                          ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      Concepts
                    </Button>
                  </div>
                </div>
              </div>

              {/* Modal body — scrollable */}
              <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
                <MarkdownContent
                  content={modalSection === "analysis" ? modalVideo.analysis : modalVideo.newConcepts}
                  variant={modalSection === "analysis" ? "analysis" : "concepts"}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
