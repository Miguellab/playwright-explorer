import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

import { StepActionIcon } from "@/components/StepActionIcon";
import { AuthImage } from "@/components/AuthImage";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PerformanceMetricsCard } from "@/components/PerformanceMetricsCard";
import { getRun, getScreenshotUrl, getProject, getTraceUrl } from "@/lib/sentinelle-api";
import type { Run, Project } from "@/lib/sentinelle-types";
import {
  ArrowLeft,
  
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Bug,
  Search,
  Camera,
  X,
} from "lucide-react";



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

        {/* Steps */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-sm uppercase tracking-wider">
              Etapes du test
              {isRunActive && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {run.steps && run.steps.length > 0 ? (
              run.steps.map((step, i) => {
                const isExpanded = expandedSteps.has(i);
                const hasDetail = !!step.detail;
                const statusIcon =
                  step.status === "passed"
                    ? "pass"
                    : step.status === "failed"
                    ? "fail"
                    : step.status;
                return (
                  <div key={i} className="rounded border bg-secondary/30 overflow-hidden">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                      onClick={() => hasDetail && toggleStep(i)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {hasDetail ? (
                          isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )
                        ) : (
                          <span className="w-3.5 shrink-0" />
                        )}
                        <StepActionIcon action={step.action} />
                        <span className="font-mono text-sm truncate">{step.label}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        {step.durationMs && step.durationMs > 0 && (
                          <span className="font-mono text-xs text-muted-foreground">
                            {stepDuration(step.durationMs)}
                          </span>
                        )}
                        <StatusBadge status={statusIcon} />
                      </div>
                    </button>
                    {isExpanded && step.detail && (
                      <div className="border-t bg-secondary/10 px-4 py-3">
                        <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap break-words">
                          {step.detail}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            ) : isRunActive ? (
              <div className="flex items-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-mono text-sm">En attente des resultats...</span>
              </div>
            ) : (
              <p className="font-mono text-sm text-muted-foreground py-2">
                Aucune etape enregistree.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Screenshots */}
        {run.assets?.screenshots && run.assets.screenshots.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" /> Captures d'ecran ({run.assets.screenshots.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {run.assets.screenshots.map((shot, i) => (
                  <button
                    key={i}
                    type="button"
                    className="rounded-lg border bg-secondary/20 overflow-hidden hover:border-primary/40 transition-colors text-left"
                    onClick={() => setLightboxSrc(getScreenshotUrl(shot.path))}
                  >
                    <AuthImage
                      url={getScreenshotUrl(shot.path)}
                      alt={shot.label}
                    />
                    <p className="px-3 py-2 font-mono text-xs text-muted-foreground">{shot.label}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Screenshot lightbox */}
        <Dialog open={!!lightboxSrc} onOpenChange={() => setLightboxSrc(null)}>
          <DialogContent className="max-w-4xl p-2">
            {lightboxSrc && (
              <AuthImage url={lightboxSrc} alt="Screenshot" className="rounded" />
            )}
          </DialogContent>
        </Dialog>

        {/* Console errors */}
        {run.findings?.consoleErrors && run.findings.consoleErrors.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-status-fail">
                Erreurs console ({run.findings.consoleErrors.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {run.findings.consoleErrors.map((err, i) => (
                <div
                  key={i}
                  className="rounded border border-status-fail/20 bg-status-fail/5 px-3 py-2 space-y-0.5"
                >
                  <code className="font-mono text-xs block">{err.text}</code>
                  {err.url && (
                    <p className="font-mono text-[10px] text-muted-foreground">{err.url}</p>
                  )}
                  {err.timestamp && (
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {new Date(err.timestamp).toLocaleString("fr-FR")}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Failed requests */}
        {run.findings?.failedRequests && run.findings.failedRequests.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-status-skipped">
                Requetes echouees ({run.findings.failedRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {run.findings.failedRequests.map((req, i) => (
                <div
                  key={i}
                  className="rounded border border-status-skipped/20 bg-status-skipped/5 px-3 py-2"
                >
                  <p className="font-mono text-xs">
                    <span className="font-semibold">{req.status}</span>{" "}
                    <span className="text-muted-foreground">{req.url}</span>
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Diagnostics — only if errors */}
        {(() => {
          const errorDiags = run.findings?.diagnostics?.filter((d) => d.error) ?? [];
          if (errorDiags.length === 0) return null;
          return (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="font-mono text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Bug className="h-3.5 w-3.5" /> Diagnostics ({errorDiags.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {errorDiags.map((diag, i) => (
                  <div key={i} className="rounded border bg-secondary/20 p-3 space-y-1">
                    <p className="font-mono text-xs font-semibold">{diag.step}</p>
                    {diag.url && (
                      <p className="font-mono text-[10px] text-muted-foreground truncate">{diag.url}</p>
                    )}
                    <p className="font-mono text-xs text-status-fail">{diag.error}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })()}

    </div>
  );
}
