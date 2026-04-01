"use client";

import { createContext, useContext, useState, useRef, useCallback } from "react";
import type { PipelineProgress, ScrapedVideo, PipelineParams } from "@/lib/types";

interface PipelineContextValue {
  running: boolean;
  progress: PipelineProgress | null;
  candidates: ScrapedVideo[] | null;
  runPipeline: (params: PipelineParams) => void;
  resetPipeline: () => void;
}

const PipelineContext = createContext<PipelineContextValue | null>(null);

export function PipelineProvider({ children }: { children: React.ReactNode }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [candidates, setCandidates] = useState<ScrapedVideo[] | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const resetPipeline = useCallback(() => {
    setRunning(false);
    setProgress(null);
    setCandidates(null);
  }, []);

  const runPipeline = useCallback(async (params: PipelineParams) => {
    if (running) return;
    setRunning(true);
    
    // If we're starting a fresh run (no selected videos), clear previous progress
    if (!params.selectedVideos) {
      setProgress(null);
      setCandidates(null);
    }

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: abortRef.current.signal,
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              setProgress(data);
              
              // If candidates are returned, store them
              if (data.status === "completed" && data.candidates) {
                setCandidates(data.candidates);
              }
            } catch {
              // skip
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setProgress((prev) => ({
        ...(prev || { phase: "done" as const, activeTasks: [], creatorsCompleted: 0, creatorsTotal: 0, creatorsScraped: 0, videosAnalyzed: 0, videosTotal: 0, log: [] }),
        status: "error" as const,
        errors: [err instanceof Error ? err.message : "Unknown error"],
      }));
    } finally {
      setRunning(false);
    }
  }, [running]);

  return (
    <PipelineContext.Provider value={{ running, progress, candidates, runPipeline, resetPipeline }}>
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline() {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error("usePipeline must be used within PipelineProvider");
  return ctx;
}
