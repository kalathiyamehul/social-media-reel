"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Loader2, XCircle, BarChart3, Sparkles } from "lucide-react";
import { classifyError } from "@/lib/error-utils";
import Link from "next/link";

/* ─── Step definitions ─────────────────────────────────────── */
const REAL_STEPS = [
  { icon: "🔍", label: "Loading ad data from database" },
  { icon: "📊", label: "Counting active ads & building context" },
  { icon: "🎨", label: "Analyzing creative & format strategy" },
  { icon: "💰", label: "Estimating funnel, spend & orders" },
  { icon: "🔎", label: "Identifying competitive gaps & weaknesses" },
  { icon: "📄", label: "Assembling full intelligence report" },
  { icon: "💾", label: "Saving report to database" },
];

const MOCK_STEPS = [
  { icon: "⚡", label: "Generating mock report data" },
];

type StepState = "waiting" | "running" | "done" | "error";

interface StepStatus {
  state: StepState;
  label: string;
  icon: string;
}

export default function AnalisingPage({ params }: { params: Promise<{ profileUrl: string }> }) {
  const resolvedParams = use(params);
  const profileUrl = decodeURIComponent(resolvedParams.profileUrl);

  const { token, setShowCreditModal } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // const isMock = searchParams.get("mock") === "true";
  const isMock = false;

  const baseSteps = isMock ? MOCK_STEPS : REAL_STEPS;
  const [steps, setSteps] = useState<StepStatus[]>(
    baseSteps.map((s) => ({ ...s, state: "waiting" }))
  );
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [dynamicLabel, setDynamicLabel] = useState<string | null>(null);

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Run SSE stream
  useEffect(() => {
    if (!token) return;

    const url = `/api/facebook-ads/analyze-stream?profileUrl=${encodeURIComponent(profileUrl)}&mock=${isMock}`;

    async function run() {
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          const text = await res.text();
          if (text.toLowerCase().includes("credits") || text.toLowerCase().includes("insufficient")) {
            setShowCreditModal(true);
          }
          throw new Error(`Server error ${res.status}: ${text}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt = JSON.parse(line.slice(6));

              if (evt.type === "ping") {
                continue;
              } else if (evt.type === "progress") {
                const idx = evt.step - 1;
                setCurrentStep(idx);
                if (evt.label) setDynamicLabel(evt.label);

                setSteps((prev) =>
                  prev.map((s, i) => {
                    if (i < idx) return { ...s, state: "done" };
                    if (i === idx) return { ...s, state: "running", label: evt.label || s.label };
                    return s;
                  })
                );
              } else if (evt.type === "done") {
                // Mark all done
                setSteps((prev) => prev.map((s) => ({ ...s, state: "done" })));
                setDone(true);
                setCurrentStep(baseSteps.length);
                setTimeout(() => {
                  router.push(`/ads-library/${encodeURIComponent(profileUrl)}/report`);
                }, 1800);
              } else if (evt.type === "error") {
                if (evt.error?.toLowerCase().includes("credits") || evt.error?.toLowerCase().includes("insufficient")) {
                  setShowCreditModal(true);
                }
                throw new Error(evt.error);
              }
            } catch (parseErr: any) {
              if (parseErr.message && !parseErr.message.includes("JSON")) throw parseErr;
            }
          }
        }
      } catch (err: any) {
        const classified = classifyError({ message: err.message });
        if (classified.action === "credits") {
          setShowCreditModal(true);
        }
        setError(`${classified.icon} ${classified.title}: ${classified.description}`);
        setSteps((prev) =>
          prev.map((s, i) =>
            i === currentStep ? { ...s, state: "error" } : s
          )
        );
      }
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const completedCount = steps.filter((s) => s.state === "done").length;
  const progressPct = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-10 px-4">
      {/* Back link */}
      <div className="w-full max-w-2xl mb-6">
        <Link
          href={`/ads-library/${encodeURIComponent(profileUrl)}`}
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1 h-3 w-3" /> Back to Ads
        </Link>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        {/* Header card */}
        <div className="rounded-2xl border border-info/30 bg-gradient-to-br from-info/5 via-background/90 to-info/5 p-6 shadow-2xl shadow-info/10 backdrop-blur-sm">
          {/* Title */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-info/20 flex items-center justify-center border border-info/30 shrink-0">
              {done ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : error ? (
                <XCircle className="h-6 w-6 text-destructive" />
              ) : (
                <BarChart3 className="h-6 w-6 text-info animate-pulse" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {done
                  ? "Report Ready! Redirecting..."
                  : error
                  ? "Analysis Failed"
                  : "Generating Ad Intelligence Report"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isMock ? "⚠️ Mock Mode" : "✦ Real AI Analysis"} ·{" "}
                {`${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")} elapsed`}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {!error && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{done ? "Complete" : "In Progress"}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 w-full bg-foreground/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progressPct}%`,
                    background:
                      done
                        ? "linear-gradient(90deg, #10b981, #34d399)"
                        : "linear-gradient(90deg, #7c3aed, #3b82f6)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div
                key={i}
                className={[
                  "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300",
                  step.state === "done"
                    ? "border-success/20 bg-success/20"
                    : step.state === "running"
                    ? "border-info/40 bg-info/20 shadow-lg shadow-info/20"
                    : step.state === "error"
                    ? "border-destructive/30 bg-destructive/20"
                    : "border-border/40 bg-foreground/[0.02] opacity-50",
                ].join(" ")}
              >
                {/* Step icon / spinner */}
                <div className="shrink-0 w-7 h-7 flex items-center justify-center">
                  {step.state === "done" && (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                  {step.state === "running" && (
                    <Loader2 className="h-5 w-5 text-info animate-spin" />
                  )}
                  {step.state === "error" && (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  {step.state === "waiting" && (
                    <span className="text-base leading-none">{step.icon}</span>
                  )}
                </div>

                {/* Step label */}
                <div className="flex-1 min-w-0">
                  <p
                    className={[
                      "text-sm font-medium truncate",
                      step.state === "done"
                        ? "text-success dark:text-success"
                        : step.state === "running"
                        ? "text-foreground font-bold"
                        : step.state === "error"
                        ? "text-destructive dark:text-destructive"
                        : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {step.state === "running" && dynamicLabel ? dynamicLabel : step.label}
                  </p>
                </div>

                {/* Status badge */}
                <div className="shrink-0">
                  {step.state === "done" && (
                    <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                      DONE
                    </span>
                  )}
                  {step.state === "running" && (
                    <span className="text-[10px] font-semibold text-info bg-info/10 px-2 py-0.5 rounded-full animate-pulse">
                      RUNNING
                    </span>
                  )}
                  {step.state === "waiting" && (
                    <span className="text-[10px] font-semibold text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-full">
                      WAITING
                    </span>
                  )}
                  {step.state === "error" && (
                    <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                      FAILED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Done / Error bottom actions */}
        {done && (
          <div className="flex items-center justify-center gap-2 text-sm text-success animate-pulse">
            <Sparkles className="h-4 w-4" />
            Redirecting to your intelligence report...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">Analysis Failed</p>
                <p className="text-xs text-destructive/70 mt-1 break-words">{error}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-border/50 text-xs"
              >
                <Link href={`/ads-library/${encodeURIComponent(profileUrl)}`}>
                  <ArrowLeft className="mr-1.5 h-3 w-3" /> Go Back
                </Link>
              </Button>
              <Button
                size="sm"
                className="bg-info hover:bg-info text-xs"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
