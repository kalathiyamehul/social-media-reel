"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { ArrowLeft, Loader2, PlayCircle, Image as ImageIcon, Copy, ExternalLink, Facebook, Sparkles, BarChart3, CheckCircle2, AlertTriangle, RefreshCw, FileText } from "lucide-react";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';


export default function ProfileAdsPage({ params }: { params: Promise<{ profileUrl: string }> }) {
  const resolvedParams = use(params);
  const profileUrl = decodeURIComponent(resolvedParams.profileUrl);
  
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFormat, setFilterFormat] = useState<string>("ALL");
  const [sortDuration, setSortDuration] = useState<string>("NONE");

  // Analysis state
  const [report, setReport] = useState<any>(null);
  const [analysing, setAnalysing] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [analyseProgress, setAnalyseProgress] = useState<{ step: number; total: number; label: string } | null>(null);
  const [analyseError, setAnalyseError] = useState<string | null>(null);


  useEffect(() => {
    if (!token) return;
    fetch(`/api/facebook-ads/profiles/${encodeURIComponent(profileUrl)}/ads`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAds(data); })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    // Load existing report
    fetch(`/api/facebook-ads/report?profileUrl=${encodeURIComponent(profileUrl)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (data.report) setReport(data.report); })
      .catch(() => {});
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

  const handleAnalyse = async () => {
    if (!token) return;
    setAnalysing(true);
    setAnalyseError(null);
    setAnalyseProgress({ step: 0, total: 7, label: '⏳ Connecting to analysis engine...' });

    try {
      const url = `/api/facebook-ads/analyze-stream?profileUrl=${encodeURIComponent(profileUrl)}&mock=${isMock}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === 'progress') {
              setAnalyseProgress({ step: evt.step, total: evt.total, label: evt.label });
            } else if (evt.type === 'done') {
              setAnalyseProgress({ step: evt.total || 7, total: evt.total || 7, label: '✅ Report saved! Redirecting...' });
              await new Promise(r => setTimeout(r, 800));
              router.push(`/ads-library/${encodeURIComponent(profileUrl)}/report`);
              return;
            } else if (evt.type === 'error') {
              throw new Error(evt.error);
            }
          } catch (parseErr: any) {
            if (parseErr.message && !parseErr.message.includes('JSON')) throw parseErr;
          }
        }
      }
    } catch (err: any) {
      setAnalyseError(err.message);
    } finally {
      setAnalysing(false);
    }
  };

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

  // Normalize markdown: single \n inside prose text → space
  // Keeps double-newlines (paragraph breaks), tables, headings, lists, hrs intact
  const normalizeMarkdown = (md: string): string => {
    return md.replace(/([^\n])\n([^\n])/g, (_, p1, p2) => {
      // Keep newline if next line is a markdown structural element
      if (/^[|#\-*>_\s*\d+\.]/.test(p2)) return p1 + '\n' + p2;
      return p1 + ' ' + p2;
    });
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

        <div className="flex flex-col gap-3 items-end">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20 px-3 py-1.5 text-sm">
              Total Active Ads: {ads.filter(a => a.isActive).length}
            </Badge>
          </div>

          {/* Analyse Button + Mock Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setIsMock(m => !m)}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${isMock ? 'bg-amber-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isMock ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <span className={`text-xs font-medium ${isMock ? 'text-amber-400' : 'text-muted-foreground'}`}>
                {isMock ? 'Mock Mode' : 'Real AI'}
              </span>
            </label>
            {report ? (
              <>
                <Button
                  asChild
                  className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold shadow-lg shadow-violet-500/20 px-5"
                >
                  <Link href={`/ads-library/${encodeURIComponent(profileUrl)}/report`}>
                    <FileText className="mr-2 h-4 w-4" /> View Report
                  </Link>
                </Button>
                <Button
                  onClick={handleAnalyse}
                  disabled={analysing}
                  variant="outline"
                  className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                >
                  {analysing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleAnalyse}
                disabled={analysing}
                className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold shadow-lg shadow-violet-500/20 px-5"
              >
                {analysing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysing...</>
                ) : (
                  <><BarChart3 className="mr-2 h-4 w-4" /> Analyse Ads</>
                )}
              </Button>
            )}
          </div>

          {/* Progress / existing report status */}
          {analyseProgress && (
            <div className="text-xs text-blue-300 flex items-center gap-2 animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              Step {analyseProgress.step}/{analyseProgress.total}: {analyseProgress.label}
            </div>
          )}
          {analyseError && (
            <div className="text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" /> {analyseError}
            </div>
          )}
          {report && !analysing && (
            <div className="text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" />
              {report.isMock ? 'Mock report' : 'AI report'} — {new Date(report.generatedAt).toLocaleDateString()}
              {" · "}
              <Link href={`/ads-library/${encodeURIComponent(profileUrl)}/report`} className="underline hover:text-emerald-300">
                View Report →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mr-2 self-center">Format</span>

          {(["ALL", "VIDEO", "IMAGE", "DPA", "DCA"] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFilterFormat(fmt)}
              className={[
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium transition-colors",
                filterFormat === fmt
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-border bg-transparent text-foreground hover:bg-muted",
              ].join(" ")}
            >
              {fmt === "VIDEO" && <PlayCircle className="h-3.5 w-3.5" />}
              {fmt === "IMAGE" && <ImageIcon className="h-3.5 w-3.5" />}
              {fmt === "ALL" ? "All" : fmt}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-border mx-2 hidden sm:block" />

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mr-2 self-center">Duration</span>

          {(["NONE", "DESC", "ASC"] as const).map((dur) => (
            <button
              key={dur}
              onClick={() => setSortDuration(dur)}
              className={[
                "inline-flex items-center h-8 px-3 rounded-md text-sm font-medium transition-colors",
                sortDuration === dur
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-border bg-transparent text-foreground hover:bg-muted",
              ].join(" ")}
            >
              {dur === "NONE" ? "Default" : dur === "DESC" ? "Longest Running" : "Shortest Running"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {processedAds.map((ad) => {
          const preview = getPreviewUrl(ad);
          const media = getMediaUrl(ad);
          
          return (
            <div key={ad.adArchiveId} className="group glass rounded-2xl overflow-hidden border border-border/50 hover:border-blue-500/30 transition-all duration-300 flex flex-col">
              {/* Media Header — only rendered when there is actual media */}
              {(ad.displayFormat === "VIDEO" ? !!media : !!preview) && (
                <div className="relative aspect-[4/5] bg-muted/30 flex items-center justify-center overflow-hidden border-b border-border/40">
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
                  ) : (
                    <>
                      <img
                        src={`/api/proxy-image?url=${encodeURIComponent(preview!)}`}
                        alt="Ad Preview Blur"
                        className="absolute inset-0 w-full h-full object-cover blur-md opacity-30"
                      />
                      <img
                        src={`/api/proxy-image?url=${encodeURIComponent(preview!)}`}
                        alt="Ad Content"
                        className="relative z-10 max-h-full max-w-full object-contain"
                      />
                    </>
                  )}

                  <div className="absolute top-3 right-3 z-30 flex gap-2">
                    <Badge className="bg-black/70 backdrop-blur-md border-white/10 text-white font-medium shadow-sm">
                      {ad.runningDays} {ad.runningDays === 1 ? 'Day' : 'Days'}
                    </Badge>
                    {ad.displayFormat && (
                      <Badge variant="secondary" className="bg-black/70 backdrop-blur-md border-white/10 font-medium shadow-sm">
                        {ad.displayFormat}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col">
                {/* Format badge row — shown when no media header */}
                {!(ad.displayFormat === "VIDEO" ? !!media : !!preview) && (
                  <div className="flex gap-2 mb-3">
                    <Badge className="bg-muted text-muted-foreground border-border/60 font-medium">
                      {ad.runningDays} {ad.runningDays === 1 ? 'Day' : 'Days'}
                    </Badge>
                    {ad.displayFormat && (
                      <Badge variant="secondary" className="font-medium">
                        {ad.displayFormat}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-3 mb-4">
                  {ad.snapshot?.pageProfilePictureUrl ? (
                    <img src={`/api/proxy-image?url=${encodeURIComponent(ad.snapshot.pageProfilePictureUrl)}`} alt={ad.pageName || 'Page'} className="h-10 w-10 rounded-full border border-border/50" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border/50">
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

                <div className="mt-auto pt-3 border-t border-border/40">
                  {ad.linkUrl ? (
                    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/40">
                      <div className="flex flex-col min-w-0 mr-3">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Destination</span>
                        <span className="text-xs text-foreground/80 truncate font-medium mt-0.5">
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
                    <div className="flex justify-between items-center bg-muted/30 p-2.5 rounded-lg border border-border/40">
                      <span className="text-xs text-muted-foreground">Call to Action</span>
                      <span className="text-xs font-semibold text-blue-400 capitalize">{ad.ctaText.replace(/_/g, ' ')}</span>
                    </div>
                  ) : null}

                  <div className="flex gap-2 mt-3">
                    {media && (
                      <Button variant="secondary" asChild className="flex-1 h-8 text-[11px]">
                        <a href={media} target="_blank" rel="noopener noreferrer">
                          Source Media <ExternalLink className="ml-1.5 h-2.5 w-2.5" />
                        </a>
                      </Button>
                    )}
                    {ad.linkUrl && (
                      <Button onClick={() => { navigator.clipboard.writeText(ad.linkUrl); }} variant="outline" className="flex-1 h-8 text-[11px] border-border/50">
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

      {/* ── Report Action Banner ───────────────────────────────────────────── */}
      {analysing && analyseProgress && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-950/40 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-violet-300 font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Intelligence Report...
            </div>
            <span className="text-xs text-muted-foreground">Step {analyseProgress.step}/{analyseProgress.total}</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((analyseProgress.step / analyseProgress.total) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground animate-pulse">{analyseProgress.label}</p>
        </div>
      )}

      {analyseError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-950/30 p-4 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{analyseError}</p>
        </div>
      )}

      {!report && !analysing && (
        <div className="rounded-2xl border border-dashed border-violet-500/20 p-8 text-center flex flex-col items-center gap-4 bg-violet-500/[0.02]">
          <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
            <BarChart3 className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">No Intelligence Report Yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Generate a full competitor AI report — creative strategy, spend estimation, funnel analysis, and competitive gaps.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setIsMock(true); setTimeout(handleAnalyse, 50); }} variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs h-8">
              Try Mock
            </Button>
            <Button onClick={handleAnalyse} className="bg-violet-600 hover:bg-violet-700 text-xs h-8">
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Generate AI Report
            </Button>
          </div>
        </div>
      )}

      {report && !analysing && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-950/30 p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {report.isMock ? '⚠️ Mock Report Ready' : '✦ AI Report Ready'}
              </p>
              <p className="text-xs text-muted-foreground">
                Generated {new Date(report.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAnalyse}
              disabled={analysing}
              variant="outline"
              size="sm"
              className="border-violet-500/20 text-violet-300 hover:bg-violet-500/10 text-xs"
            >
              <RefreshCw className="mr-1.5 h-3 w-3" /> Regenerate
            </Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white text-xs">
              <Link href={`/ads-library/${encodeURIComponent(profileUrl)}/report`}>
                <FileText className="mr-1.5 h-3 w-3" /> View Report
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

