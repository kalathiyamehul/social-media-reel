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
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

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

  const filteredAds = ads.filter((ad) => {
    if (filterFormat !== "ALL" && ad.displayFormat !== filterFormat) return false;
    if (filterStatus === "ACTIVE" && !ad.isActive) return false;
    if (filterStatus === "INACTIVE" && ad.isActive) return false;
    return true;
  });

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
            Total Ads: {ads.length}
          </Badge>
          <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 px-3 py-1.5 text-sm">
            Active: {ads.filter(a => a.isActive).length}
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
        </div>
        <div className="w-px h-6 bg-white/[0.1] mx-2 hidden sm:block"></div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mr-2 self-center">Status</span>
          <Button 
            size="sm" 
            variant={filterStatus === "ALL" ? "default" : "ghost"} 
            onClick={() => setFilterStatus("ALL")}
            className={filterStatus === "ALL" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            All
          </Button>
          <Button 
            size="sm" 
            variant={filterStatus === "ACTIVE" ? "default" : "ghost"} 
            onClick={() => setFilterStatus("ACTIVE")}
            className={filterStatus === "ACTIVE" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            Active Only
          </Button>
          <Button 
            size="sm" 
            variant={filterStatus === "INACTIVE" ? "default" : "ghost"} 
            onClick={() => setFilterStatus("INACTIVE")}
            className={filterStatus === "INACTIVE" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            Inactive Only
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {filteredAds.map((ad) => {
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
                  <Badge className={`${ad.isActive ? 'bg-emerald-500/80' : 'bg-zinc-600/80'} text-xs backdrop-blur-md`}>
                    {ad.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {ad.displayFormat && (
                    <Badge variant="secondary" className="bg-black/60 backdrop-blur-md border-white/10">
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

                <div className="mt-auto space-y-3 pt-3 border-t border-white/[0.05]">
                  {ad.ctaText && (
                    <div className="flex justify-between items-center bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
                      <span className="text-xs text-muted-foreground">Call to Action</span>
                      <span className="text-xs font-semibold text-blue-400 capitalize">{ad.ctaText.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {media && (
                      <Button variant="secondary" asChild className="flex-1 h-9 bg-white/[0.05] hover:bg-white/[0.1] text-xs">
                        <a href={media} target="_blank" rel="noopener noreferrer">
                          {ad.displayFormat === 'VIDEO' ? 'Watch Video' : 'View Image'} <ExternalLink className="ml-1.5 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {ad.linkUrl && (
                      <Button onClick={() => { navigator.clipboard.writeText(ad.linkUrl); }} variant="outline" className="flex-1 h-9 glass text-xs">
                        Copy Link <Copy className="ml-1.5 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAds.length === 0 && (
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
