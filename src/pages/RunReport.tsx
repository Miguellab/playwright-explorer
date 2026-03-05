import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

import { StepActionIcon } from "@/components/StepActionIcon";
import { AuthImage } from "@/components/AuthImage";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getRun, getScreenshotUrl } from "@/lib/sentinelle-api";
import type { Run } from "@/lib/sentinelle-types";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Bug,
  Search,
  Camera,
  X,
} from "lucide-react";

const REPORT_BASE = import.meta.env.VITE_SENTINELLE_API_URL || "";

function formatDuration(ms: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function stepDuration(ms: number): string {
  if (ms > 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

export default function RunReport() {
  const { id: projectId, runId } = useParams<{ id: string; runId: string }>();
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const isRunActive = run && (run.status === "queued" || run.status === "running");

  useEffect(() => {
    if (!runId) return;
    getRun(runId)
      .then(setRun)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [runId]);

  // Poll while active
  useEffect(() => {
    if (!runId || !isRunActive) return;
    const interval = setInterval(async () => {
      try {
        const updated = await getRun(runId);
        setRun(updated);
        if (updated.status === "passed" || updated.status === "failed" || updated.status === "error") {
          clearInterval(interval);
        }
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [runId, isRunActive]);

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="container py-10 text-center font-mono text-muted-foreground">
        Run introuvable.
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
        {/* Back */}
        <Link
          to={`/project/${projectId}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Retour au projet
        </Link>

        {/* Flow label */}
        {run.flowLabel && (
          <div className="mb-3">
            <Badge variant="outline" className="font-mono text-xs">
              Parcours : {run.flowLabel}
            </Badge>
          </div>
        )}

        {/* Status header */}
        <div className="flex items-center gap-3">
          <StatusBadge status={run.status} />
          {isRunActive && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <span className="font-mono text-xs text-muted-foreground">
            Durée : {formatDuration(run.durationMs)}
          </span>
          {run.startedAt && (
            <span className="font-mono text-xs text-muted-foreground">
              {new Date(run.startedAt).toLocaleString("fr-FR")}
            </span>
          )}
        </div>

        {/* Error banner */}
        {(run.status === "failed" || run.status === "error") && run.error && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-status-fail/30 bg-status-fail/5 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-fail" />
            <pre className="font-mono text-xs text-status-fail whitespace-pre-wrap break-words">
              {run.error}
            </pre>
          </div>
        )}

      {/* Steps card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">
            <span className="mr-2">Étapes</span>
            <Badge variant="secondary">{run.steps.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {run.steps.map((step, i) => (
            <div key={i} className="rounded-md border">
              <button
                className="flex w-full items-center justify-between rounded-md p-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => toggleStep(i)}
              >
                <div className="flex items-center gap-2">
                  <StepActionIcon action={step.action} />
                  <span>
                    {step.label}
                  </span>
                </div>
                <div className="ml-2 flex items-center">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{stepDuration(step.durationMs)}</span>
                  {expandedSteps.has(i) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </button>
              {expandedSteps.has(i) && (
                <div className="border-t p-4 text-sm text-muted-foreground">
                  {step.message}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Screenshots card */}
      {run.assets?.screenshots && run.assets.screenshots.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">
              <span className="mr-2">Screenshots</span>
              <Badge variant="secondary">{run.assets.screenshots.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {run.assets.screenshots.map((ss) => (
              <button key={ss.filename} onClick={() => setLightboxSrc(getScreenshotUrl(run.id, ss.filename))}>
                <div className="group relative aspect-video overflow-hidden rounded-md border shadow-sm transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <AuthImage
                    src={getScreenshotUrl(run.id, ss.filename)}
                    alt={ss.label}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-all"
                  />
                  <div className="absolute inset-0 bg-background/40 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute left-2 top-2 rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
                    {ss.label}
                  </div>
                  <Search className="absolute right-2 top-2 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Screenshot lightbox */}
      <Dialog open={!!lightboxSrc} onOpenChange={() => setLightboxSrc(null)}>
        <DialogContent className="fixed inset-0 z-50 flex max-h-screen w-full flex-col items-center justify-center gap-4 bg-background">
          <div className="absolute right-4 top-4">
            <button
              className="rounded-md border p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
              onClick={() => setLightboxSrc(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {lightboxSrc && (
            <AuthImage
              src={lightboxSrc}
              alt="Screenshot"
              className="max-h-[80vh] max-w-[90vw] rounded-md shadow-lg"
              width={1280}
              height={720}
            />
          )}
          {run.assets?.screenshots && (
            <div className="flex gap-2">
              {run.assets.screenshots.map((ss) => (
                <button
                  key={ss.filename}
                  className={cn(
                    "rounded-md border p-2 transition-colors hover:bg-secondary hover:text-secondary-foreground",
                    lightboxSrc === getScreenshotUrl(run.id, ss.filename) && "bg-secondary text-secondary-foreground"
                  )}
                  onClick={() => setLightboxSrc(getScreenshotUrl(run.id, ss.filename))}
                >
                  <Camera className="h-4 w-4" />
                </button>
              ))}
              {run.assets.reportUrl && (
                <Link
                  to={run.assets.reportUrl}
                  target="_blank"
                  className="rounded-md border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
              {run.runnerRunId && (
                <Link
                  to={`https://app.lambdatest.com/logs/?testID=${run.runnerRunId}`}
                  target="_blank"
                  className="rounded-md border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                >
                  <Bug className="h-4 w-4" />
                </Link>
              )}
              {run.assets.reportUrl && (
                <button
                  className="rounded-md border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                  onClick={() => setReportOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

        {/* Console errors */}
        {run.findings?.consoleErrors && run.findings.consoleErrors.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">
                <span className="mr-2">Console</span>
                <Badge variant="destructive">{run.findings.consoleErrors.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {run.findings.consoleErrors.map((e, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <pre className="font-mono text-xs text-destructive whitespace-pre-wrap break-words">
                    {e.message}
                  </pre>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Failed requests */}
        {run.findings?.failedRequests && run.findings.failedRequests.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">
                <span className="mr-2">Requêtes</span>
                <Badge variant="destructive">{run.findings.failedRequests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {run.findings.failedRequests.map((r, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="flex flex-col">
                    <p className="font-mono text-xs text-destructive">{r.url}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      Statut: {r.status}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Diagnostics */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-4 text-sm text-muted-foreground">
            <li>
              User agent:{" "}
              <code className="font-mono">{run.findings?.userAgent || "N/A"}</code>
            </li>
            <li>
              Window size:{" "}
              <code className="font-mono">
                {run.findings?.windowWidth}x{run.findings?.windowHeight}
              </code>
            </li>
            <li>
              Viewport size:{" "}
              <code className="font-mono">
                {run.findings?.viewportWidth}x{run.findings?.viewportHeight}
              </code>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Report button */}
      {run.assets?.reportUrl && (
        <div className="mt-6 text-center">
          <Link
            to={run.assets.reportUrl}
            target="_blank"
            className="font-mono text-xs text-muted-foreground hover:underline"
          >
            Voir le rapport complet (LambdaTest)
          </Link>
        </div>
      )}
    </div>
  );
}
