"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Headphones, Loader2, Mic } from "lucide-react";
import { fetchPodcastAudio, fetchPodcastScript } from "@/lib/actions";
import { useSavedReports } from "@/hooks/useSavedReports";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type StepId = "report" | "script" | "audio";
type StepStatus = "pending" | "active" | "done" | "error";

const STEPS: { id: StepId; label: string; detail: string }[] = [
  { id: "report", label: "Loading earnings report", detail: "Fetching analysis and market context" },
  { id: "script", label: "Writing podcast script", detail: "Condensing the report into a spoken brief" },
  { id: "audio", label: "Generating audio", detail: "Synthesizing voice with ElevenLabs" },
];

const PROGRESS: Record<StepId, number> = {
  report: 15,
  script: 45,
  audio: 85,
};

export function PodcastPlayer({ ticker }: { ticker: string }) {
  const { save } = useSavedReports();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "generating" | "ready" | "error">("idle");
  const [stepStatus, setStepStatus] = useState<Record<StepId, StepStatus>>({
    report: "pending",
    script: "pending",
    audio: "pending",
  });
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef(0);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const resetGeneration = () => {
    setStepStatus({ report: "pending", script: "pending", audio: "pending" });
    setProgress(0);
    setError(null);
    setPhase("idle");
  };

  const setStep = (id: StepId, status: StepStatus) => {
    setStepStatus((prev) => ({ ...prev, [id]: status }));
    if (status === "active") setProgress(PROGRESS[id]);
    if (status === "done") {
      const idx = STEPS.findIndex((s) => s.id === id);
      const next = STEPS[idx + 1];
      setProgress(next ? PROGRESS[next.id] - 10 : 100);
    }
  };

  const fail = (message: string, step: StepId) => {
    setError(message);
    setPhase("error");
    setStepStatus((prev) => ({ ...prev, [step]: "error" }));
  };

  const generate = async () => {
    const runId = ++abortRef.current;
    resetGeneration();
    setPhase("generating");
    setOpen(true);

    setStep("report", "active");
    const scriptResult = await fetchPodcastScript({ ticker });
    if (runId !== abortRef.current) return;

    if (!scriptResult.ok) {
      fail(scriptResult.message, "report");
      return;
    }
    setStep("report", "done");

    setStep("script", "active");
    await new Promise((r) => setTimeout(r, 350));
    if (runId !== abortRef.current) return;
    setStep("script", "done");

    setStep("audio", "active");
    const audioResult = await fetchPodcastAudio({ script: scriptResult.script });
    if (runId !== abortRef.current) return;

    if (!audioResult.ok) {
      fail(audioResult.message, "audio");
      return;
    }
    setStep("audio", "done");
    setProgress(100);

    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const bytes = Uint8Array.from(atob(audioResult.audioBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: audioResult.mimeType });
    const url = URL.createObjectURL(blob);

    setAudioUrl(url);
    setTitle(scriptResult.title);
    setPhase("ready");

    void save({
      type: "podcast",
      id: `${scriptResult.ticker}-${scriptResult.earningsQuarter}-podcast`,
      ticker: scriptResult.ticker,
      companyName: scriptResult.companyName,
      earningsQuarter: scriptResult.earningsQuarter,
      title: scriptResult.title,
      script: scriptResult.script,
      audioBase64: audioResult.audioBase64,
      mimeType: audioResult.mimeType,
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && phase === "generating") return;
    setOpen(next);
    if (!next && phase !== "ready") {
      abortRef.current += 1;
      resetGeneration();
    }
  };

  const handleButtonClick = () => {
    if (phase === "ready" && audioUrl) {
      setOpen(true);
      return;
    }
    void generate();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={phase === "generating"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition",
          phase === "ready"
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border hover:bg-accent",
          phase === "generating" && "opacity-70",
        )}
        title="Generate a short audio brief from this report"
      >
        {phase === "generating" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Headphones className="h-3.5 w-3.5" />
        )}
        {phase === "generating" ? "Generating…" : phase === "ready" ? "Listen" : "Podcast"}
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn("sm:max-w-md", phase === "generating" && "[&>button]:hidden")}
          onInteractOutside={(e) => {
            if (phase === "generating") e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (phase === "generating") e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              {phase === "ready" ? "Your podcast is ready" : "Creating your podcast"}
            </DialogTitle>
            <DialogDescription>
              {phase === "ready"
                ? `Audio brief for ${ticker.toUpperCase()} — bite-sized earnings coverage.`
                : `Turning the ${ticker.toUpperCase()} earnings report into a short audio brief.`}
            </DialogDescription>
          </DialogHeader>

          {phase === "generating" || phase === "error" ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <ul className="space-y-3">
                {STEPS.map((step) => {
                  const status = stepStatus[step.id];
                  return (
                    <li key={step.id} className="flex items-start gap-3">
                      <StepIcon status={status} />
                      <div className="min-w-0 pt-0.5">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            status === "pending" && "text-muted-foreground",
                            status === "error" && "text-destructive",
                          )}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {phase === "error" && error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              {phase === "error" ? (
                <button
                  type="button"
                  onClick={() => void generate()}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Try again
                </button>
              ) : null}
            </div>
          ) : null}

          {phase === "ready" && audioUrl ? (
            <div className="space-y-4">
              {title ? <p className="text-sm font-medium">{title}</p> : null}
              <audio
                ref={audioRef}
                src={audioUrl}
                className="w-full"
                controls
                autoPlay
              />
              <button
                type="button"
                onClick={() => void generate()}
                className="w-full rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
              >
                Regenerate
              </button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive text-xs font-bold">
        !
      </span>
    );
  }
  return <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 border-muted" />;
}
