"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { ArrowLeft, Loader2, PlayCircle, Image as ImageIcon, Copy, ExternalLink, CalendarDays, Facebook, Sparkles } from "lucide-react";
import Link from 'next/link';

export default function ProfileAdsPage({ params }: { params: Promise<{ profileUrl: string }> }) {
  const resolvedParams = use(params);
  const profileUrl = decodeURIComponent(resolvedParams.profileUrl);
  
  const { token } = useAuth();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFormat, setFilterFormat] = useState<string>("ALL");
  const [sortDuration, setSortDuration] = useState<string>("NONE");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/facebook-ads/profiles/${encodeURIComponent(profileUrl)}/ads`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAds(data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token, profileUrl]);

  const getRunningDays = (ad: any) => {
    if (!ad.startDate) return 0;
    const start = new Date(ad.startDate).getTime();
    let end = Date.now();
    if (ad.endDate && !ad.isActive) {
      const parsedEnd = new Date(ad.endDate).getTime();
      if (parsedEnd < end) end = parsedEnd;
    }
    const diffTime = end - start;
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  let processedAds = ads.filter((ad) => {
    if (!ad.isActive) return false;
    
    if (filterFormat !== "ALL") {
      if (filterFormat === "DCA") {
        if (ad.displayFormat !== "DCA" && ad.displayFormat !== "DCO") return false;
      } else if (ad.displayFormat !== filterFormat) {
        return false;
      }
    }
    return true;
  }).map(ad => ({
    ...ad,
    runningDays: getRunningDays(ad)
  }));

  if (sortDuration === "DESC") {
    processedAds.sort((a, b) => b.runningDays - a.runningDays);
  } else if (sortDuration === "ASC") {
    processedAds.sort((a, b) => a.runningDays - b.runningDays);
  } else {
    processedAds.sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());
  }

  const getMediaUrl = (ad: any) => {
    if (ad.displayFormat === "VIDEO" && ad.videos && ad.videos.length > 0) {
      return ad.videos[0].videoHdUrl || ad.videos[0].videoSdUrl || null;
    }
    if (ad.images && ad.images.length > 0) {
      return ad.images[0].originalImageUrl || ad.images[0].resizedImageUrl || null;
    }
    return null;
  };

  const getPreviewUrl = (ad: any) => {
    if (ad.displayFormat === "VIDEO" && ad.videos && ad.videos.length > 0) {
      return ad.videos[0].videoPreviewImageUrl || null;
    }
    return getMediaUrl(ad);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/ads-library" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="mr-1 h-3 w-3" /> Back to Library
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
              <Facebook className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ads for Profile</h1>
              <p className="mt-1 text-xs text-muted-foreground break-all max-w-xl">
                {profileUrl}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20 px-3 py-1.5 text-sm">
            Total Active Ads: {ads.filter(a => a.isActive).length}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white/[0.02] p-4 rounded-xl border border-white/[0.05]">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mr-2 self-center">Format</span>
          <Button 
            size="sm" 
            variant={filterFormat === "ALL" ? "default" : "ghost"} 
            onClick={() => setFilterFormat("ALL")}
            className={filterFormat === "ALL" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            All
          </Button>
          <Button 
            size="sm" 
            variant={filterFormat === "VIDEO" ? "default" : "ghost"} 
            onClick={() => setFilterFormat("VIDEO")}
            className={filterFormat === "VIDEO" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Video
          </Button>
          <Button 
            size="sm" 
            variant={filterFormat === "IMAGE" ? "default" : "ghost"} 
            onClick={() => setFilterFormat("IMAGE")}
            className={filterFormat === "IMAGE" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> Image
          </Button>
          <Button 
            size="sm" 
            variant={filterFormat === "DPA" ? "default" : "ghost"} 
            onClick={() => setFilterFormat("DPA")}
            className={filterFormat === "DPA" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            DPA
          </Button>
          <Button 
            size="sm" 
            variant={filterFormat === "DCA" ? "default" : "ghost"} 
            onClick={() => setFilterFormat("DCA")}
            className={filterFormat === "DCA" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            DCA
          </Button>
        </div>
        <div className="w-px h-6 bg-white/[0.1] mx-2 hidden sm:block"></div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mr-2 self-center">Duration</span>
          <Button 
            size="sm" 
            variant={sortDuration === "NONE" ? "default" : "ghost"} 
            onClick={() => setSortDuration("NONE")}
            className={sortDuration === "NONE" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            Default
          </Button>
          <Button 
            size="sm" 
            variant={sortDuration === "DESC" ? "default" : "ghost"} 
            onClick={() => setSortDuration("DESC")}
            className={sortDuration === "DESC" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            Longest Running
          </Button>
          <Button 
            size="sm" 
            variant={sortDuration === "ASC" ? "default" : "ghost"} 
            onClick={() => setSortDuration("ASC")}
            className={sortDuration === "ASC" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            Shortest Running
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {processedAds.map((ad) => {
          const preview = getPreviewUrl(ad);
          const media = getMediaUrl(ad);
          
          return (
            <div key={ad.adArchiveId} className="group glass rounded-2xl overflow-hidden border border-white/[0.08] hover:border-blue-500/30 transition-all duration-300 flex flex-col">
              {/* Media Header */}
              <div className="relative aspect-[4/5] bg-black/40 flex items-center justify-center overflow-hidden border-b border-white/[0.05]">
                {ad.displayFormat === "VIDEO" && media ? (
                  <>
                    {preview && (
                      <img 
                        src={`/api/proxy-image?url=${encodeURIComponent(preview)}`} 
                        alt="Ad Preview Blur" 
                        className="absolute inset-0 w-full h-full object-cover blur-md opacity-30"
                      />
                    )}
                    <video 
                      src={media} 
                      controls 
                      poster={preview ? `/api/proxy-image?url=${encodeURIComponent(preview)}` : undefined}
                      className="relative z-10 w-full h-full object-contain"
                    />
                  </>
                ) : preview ? (
                  <>
                    <img 
                      src={`/api/proxy-image?url=${encodeURIComponent(preview)}`} 
                      alt="Ad Preview Blur" 
                      className="absolute inset-0 w-full h-full object-cover blur-md opacity-30"
                    />
                    <img 
                      src={`/api/proxy-image?url=${encodeURIComponent(preview)}`} 
                      alt="Ad Content" 
                      className="relative z-10 max-h-full max-w-full object-contain"
                    />
                  </>
                ) : (
                  <div className="text-muted-foreground/50 flex flex-col items-center">
                    <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                    <span className="text-xs font-medium">No Media Preview</span>
                  </div>
                )}
                
                <div className="absolute top-3 right-3 z-30 flex gap-2">
                  <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-white font-medium shadow-sm">
                    {ad.runningDays} {ad.runningDays === 1 ? 'Day' : 'Days'}
                  </Badge>
                  {ad.displayFormat && (
                    <Badge variant="secondary" className="bg-black/60 backdrop-blur-md border-white/10 font-medium shadow-sm">
                      {ad.displayFormat}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                  {ad.snapshot?.pageProfilePictureUrl ? (
                    <img src={`/api/proxy-image?url=${encodeURIComponent(ad.snapshot.pageProfilePictureUrl)}`} alt={ad.pageName || 'Page'} className="h-10 w-10 rounded-full border border-white/10" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <Facebook className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{ad.pageName || 'Unknown Page'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">Started: {new Date(ad.startDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-6 mb-4 flex-1">
                  {ad.bodyText || <span className="text-muted-foreground italic">No ad copy text provided.</span>}
                </div>

                <div className="mt-auto pt-3 border-t border-white/[0.05]">
                  {ad.linkUrl ? (
                    <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-xl border border-white/[0.05]">
                      <div className="flex flex-col min-w-0 mr-3">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Destination</span>
                        <span className="text-xs text-white/80 truncate font-medium mt-0.5">
                          {ad.linkUrl.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0]}
                        </span>
                      </div>
                      <Button asChild className="shrink-0 h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs capitalize px-4">
                        <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer">
                          {ad.ctaText ? ad.ctaText.replace(/_/g, ' ') : "Visit Link"}
                        </a>
                      </Button>
                    </div>
                  ) : ad.ctaText ? (
                    <div className="flex justify-between items-center bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
                      <span className="text-xs text-muted-foreground">Call to Action</span>
                      <span className="text-xs font-semibold text-blue-400 capitalize">{ad.ctaText.replace(/_/g, ' ')}</span>
                    </div>
                  ) : null}
                  
                  <div className="flex gap-2 mt-3">
                    {media && (
                      <Button variant="secondary" asChild className="flex-1 h-8 bg-white/[0.05] hover:bg-white/[0.1] text-[11px]">
                        <a href={media} target="_blank" rel="noopener noreferrer">
                          Source Media <ExternalLink className="ml-1.5 h-2.5 w-2.5" />
                        </a>
                      </Button>
                    )}
                    {ad.linkUrl && (
                      <Button onClick={() => { navigator.clipboard.writeText(ad.linkUrl); }} variant="outline" className="flex-1 h-8 glass text-[11px] border-white/[0.1]">
                        Copy Link <Copy className="ml-1.5 h-2.5 w-2.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {processedAds.length === 0 && (
          <div className="col-span-full glass rounded-2xl p-12 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
              <Sparkles className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold">No ads found</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              We couldn't find any ads matching your current filters. If you haven't scraped any ads yet, go back to the library and start scraping.
            </p>
            <Button asChild className="mt-6 bg-blue-600 hover:bg-blue-700">
              <Link href="/ads-library">Back to Library</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
