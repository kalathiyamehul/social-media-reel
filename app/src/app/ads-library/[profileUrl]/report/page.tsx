"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { ArrowLeft, Loader2, BarChart3, ExternalLink, RefreshCw, Sparkles, AlertCircle, FileDown, Share2 } from "lucide-react";
import { classifyError } from "@/lib/error-utils";
import Link from 'next/link';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const normalizeMarkdown = (md: string): string => {
  return md.replace(/([^\n])\n([^\n])/g, (_, p1, p2) => {
    if (/^[|#\-*>_\s*\d+\.]/.test(p2)) return p1 + '\n' + p2;
    return p1 + ' ' + p2;
  });
};

export default function AdReportPage({ params }: { params: Promise<{ profileUrl: string }> }) {
  const resolvedParams = use(params);
  const profileUrl = decodeURIComponent(resolvedParams.profileUrl);

  const { token } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/facebook-ads/report?profileUrl=${encodeURIComponent(profileUrl)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load report (HTTP ${r.status})`);
        return r.json();
      })
      .then((data) => { if (data.report) setReport(data.report); })
      .catch((err) => {
        const classified = classifyError({ message: err instanceof Error ? err.message : String(err) });
        setLoadError(`${classified.icon} ${classified.title}: ${classified.description}`);
      })
      .finally(() => setLoading(false));
  }, [token, profileUrl]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
        <div className="h-12 w-12 rounded-2xl bg-info/20 flex items-center justify-center border border-info/30 animate-pulse">
          <BarChart3 className="h-6 w-6 text-info" />
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-info" />
        <p className="text-sm text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-5">
        <div className="h-14 w-14 rounded-2xl bg-info/10 flex items-center justify-center border border-info/20">
          {loadError ? <AlertCircle className="h-7 w-7 text-destructive" /> : <BarChart3 className="h-7 w-7 text-info" />}
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            {loadError ? "Failed to Load Report" : "No Report Found"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {loadError || "No intelligence report has been generated yet for this profile."}
          </p>
        </div>
        <Button asChild className="bg-info hover:bg-info">
          <Link href={`/ads-library/${encodeURIComponent(profileUrl)}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back & Generate
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/ads-library/${encodeURIComponent(profileUrl)}`}
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="mr-1 h-3 w-3" /> Back to Ads
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-info/20 border border-info/30">
              <BarChart3 className="h-5 w-5 text-info" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Competitor Ad Intelligence Report
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 break-all max-w-xl">
                {profileUrl}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {report.isMock && (
            <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">
              <Sparkles className="mr-1 h-3 w-3" /> Mock Report
            </Badge>
          )}
          {!report.isMock && (
            <Badge className="bg-info/10 text-info border-info/20 text-xs">
              ✦ AI Generated
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {new Date(report.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="border-border/50 text-xs hover:bg-foreground/5"
            onClick={() => {
              const blob = new Blob([report.reportMarkdown], { type: 'text/markdown' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `ad-intelligence-report-${Date.now()}.md`;
              a.click();
            }}
          >
            <ExternalLink className="mr-1.5 h-3 w-3" /> Export .md
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={exporting}
            className="border-info/30 text-info hover:bg-info/10 text-xs"
            onClick={async () => {
              setExporting(true);
              try {
                const { exportReportAsPdf } = await import('@/lib/pdf-export');
                exportReportAsPdf({
                  markdown: report.reportMarkdown,
                  brandName: report.pageName || 'Unknown Brand',
                  generatedAt: new Date(report.generatedAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  }),
                  isMock: report.isMock,
                });
              } catch (err) {
                console.error('PDF export failed:', err);
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? (
              <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Generating...</>
            ) : (
              <><FileDown className="mr-1.5 h-3 w-3" /> Export PDF</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = `${window.location.origin}/ad-report/${encodeURIComponent(profileUrl)}`;
              navigator.clipboard.writeText(url);
              // We'll just alert since toast isn't imported here, wait, let's import toast or use alert.
              // I will use alert since toast is not in this file. Or better, just copy it silently.
              alert("Public link copied to clipboard!");
            }}
            className="border-info/30 text-info hover:bg-info/10 text-xs"
          >
            <Share2 className="mr-1.5 h-3 w-3" /> Share Report
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-info/30 text-info hover:bg-info/10 text-xs"
          >
            <Link href={`/ads-library/${encodeURIComponent(profileUrl)}?action=regenerate`}>
              <RefreshCw className="mr-1.5 h-3 w-3" /> Regenerate
            </Link>
          </Button>
        </div>
      </div>

      {/* Report Card */}
      <div className="rounded-2xl border border-info/30 bg-gradient-to-br from-info/5 via-background/90 to-info/5 overflow-hidden shadow-2xl shadow-info/10 backdrop-blur-sm">
        <div className="px-6 py-8 overflow-x-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold text-foreground mt-8 mb-4 pb-3 border-b border-border/40 first:mt-0">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-bold text-info dark:text-info mt-6 mb-3">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-semibold text-info dark:text-info mt-5 mb-2">{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-sm font-semibold text-foreground/90 mt-4 mb-1">{children}</h4>
              ),
              p: ({ children }) => (
                <p className="text-foreground/80 text-sm leading-7 mb-3">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-foreground">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-foreground/70">{children}</em>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1.5 mb-4 pl-2 font-medium text-foreground/80">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1.5 mb-4 pl-2 font-medium text-foreground/80">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-foreground/80 text-sm leading-6">{children}</li>
              ),
              hr: () => <hr className="border-border/40 my-8" />,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-info pl-4 py-2 my-4 bg-info/10 rounded-r-lg text-info dark:text-info/80 text-sm italic">{children}</blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-info/10 text-info dark:text-info px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
              ),
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-info dark:text-info underline underline-offset-2 hover:text-info dark:hover:text-info">{children}</a>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-5 rounded-xl border border-border/40 bg-foreground/[0.01]">
                  <table className="w-full text-xs border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-foreground/[0.03]">{children}</thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-border/40">{children}</tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-foreground/[0.02] transition-colors">{children}</tr>
              ),
              th: ({ children }) => (
                <th className="text-left text-info dark:text-info font-semibold px-4 py-3 uppercase tracking-wider text-[10px]">{children}</th>
              ),
              td: ({ children }) => (
                <td className="text-foreground/80 px-4 py-3 align-top">{children}</td>
              ),
            }}
          >
            {normalizeMarkdown(report.reportMarkdown)}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
