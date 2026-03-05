import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

import { StepActionIcon } from "@/components/StepActionIcon";
import { AuthImage } from "@/components/AuthImage";
import { VerdictBadge } from "@/components/VerdictBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  UserCheck,
  Terminal,
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
  const [ctoOpen, setCtoOpen] = useState(false);
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

  const vs = run.verdictSummary;
  const hasIssues = vs && vs.issues && vs.issues.length > 0;
  const hasHumanQA = vs?.issues?.some((i) => i.humanQA);

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

        {/* Verdict banner */}
        {vs ? (
          <div className={cn(
            "rounded-lg p-6 space-y-3",
            vs.verdict === "OK" && "bg-status-pass/10 border border-status-pass/30",
            vs.verdict === "EN ATTENTE" && "bg-status-pending/10 border border-status-pending/30",
            vs.verdict === "ALERTE" && "bg-status-skipped/10 border border-status-skipped/30",
            vs.verdict === "ERREUR" && "bg-status-fail/10 border border-status-fail/30",
          )}>
            <div className="flex items-center gap-3">
              <VerdictBadge verdict={vs.verdict} size="lg" explanation={vs.verdictExplanation} />
            </div>
            <p className="font-mono text-base font-bold">{vs.headline}</p>
            {run.status !== "passed" && vs.verdict === "OK" && run.error && (
              <p className="font-mono text-xs text-muted-foreground italic">
                Le test s'est terminé avec une erreur technique, mais l'analyse IA n'a détecté aucun problème fonctionnel.
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <span>Durée : {formatDuration(run.durationMs)}</span>
              {run.startedAt && (
                <span>{new Date(run.startedAt).toLocaleString("fr-FR")}</span>
              )}
              {run.status !== "passed" && vs.verdict === "OK" && (
                <span className="text-muted-foreground/60 text-[10px]">
                  (statut technique : {run.status})
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <StatusBadge status={run.status} />
            {isRunActive && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            <span className="font-mono text-xs text-muted-foreground">
              Durée : {formatDuration(run.durationMs)}
            </span>
          </div>
        )}

        {/* Error banner */}
        {run.status === "failed" && run.error && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-status-fail/30 bg-status-fail/5 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-fail" />
            <pre className="font-mono text-xs text-status-fail whitespace-pre-wrap break-words">
              {run.error}
            </pre>
          </div>
        )}

        {/* Summary for user */}
        {vs && vs.forUser && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-sm uppercase tracking-wider">
                Résumé pour vous
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-mono text-sm text-muted-foreground whitespace-pre-line">
                {vs.forUser}
              </p>
              {hasHumanQA && (
                <Button variant="outline" size="sm" className="font-mono text-xs">
                  <UserCheck className="h-3 w-3 mr-1" /> Demander un QA manuel
                </Button>
              )}

              {/* Collapsible CTO details */}
              {vs.forCTO && (
                <Collapsible open={ctoOpen} onOpenChange={setCtoOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="font-mono text-xs gap-1.5">
                      <Terminal className="h-3 w-3" />
                      Détails techniques
                      <ChevronDown className={cn("h-3 w-3 transition-transform", ctoOpen && "rotate-180")} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="mt-3 rounded border bg-secondary/30 p-4 font-mono text-xs text-muted-foreground whitespace-pre-wrap break-words">
                      {vs.forCTO}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>
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
                        {step.durationMs > 0 && (
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

        {/* Issues */}
        {hasIssues && vs && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-sm uppercase tracking-wider">
                Problemes detectes ({vs.issues.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...vs.issues]
                .sort((a, b) => (a.severity === "critical" ? -1 : 1) - (b.severity === "critical" ? -1 : 1))
                .map((issue, i) => (
                  <div
                    key={i}
                    className={`rounded border p-3 space-y-1.5 ${
                      issue.severity === "critical"
                        ? "border-status-fail/30 bg-status-fail/5"
                        : "border-status-skipped/30 bg-status-skipped/5"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`font-mono text-[10px] ${
                          issue.severity === "critical"
                            ? "text-status-fail border-status-fail/30"
                            : "text-status-skipped border-status-skipped/30"
                        }`}
                      >
                        {issue.severity}
                      </Badge>
                      <span className="font-mono text-xs">{issue.message}</span>
                      {issue.humanQA && (
                        <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
                          QA Manuel recommandé
                        </Badge>
                      )}
                    </div>
                    {issue.action && (
                      <p className="font-mono text-xs italic text-muted-foreground pl-1">
                        → {issue.action}
                      </p>
                    )}
                    {issue.details && issue.details.length > 0 && (
                      <ul className="pl-4 space-y-0.5">
                        {issue.details.map((d, di) => (
                          <li key={di} className="font-mono text-[11px] text-muted-foreground list-disc">
                            {d}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

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

        {/* Diagnostics */}
        {run.findings?.diagnostics && run.findings.diagnostics.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" /> Diagnostics ({run.findings.diagnostics.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {run.findings.diagnostics.map((diag, i) => (
                <div key={i} className="rounded border bg-secondary/20 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {diag.error ? (
                      <Bug className="h-3.5 w-3.5 shrink-0 text-status-fail" />
                    ) : (
                      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="font-mono text-xs font-semibold">{diag.step}</span>
                    {diag.type && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        ({diag.type})
                      </span>
                    )}
                  </div>
                  {diag.error && (
                    <pre className="font-mono text-xs text-status-fail whitespace-pre-wrap break-words rounded bg-status-fail/5 border border-status-fail/20 p-2">
                      {diag.error}
                    </pre>
                  )}
                  {diag.type === "page_audit" && (
                    <div className="space-y-1.5">
                      {diag.url && (
                        <p className="font-mono text-[10px] text-muted-foreground truncate">
                          URL : {diag.url}
                        </p>
                      )}
                      {diag.title && (
                        <p className="font-mono text-[10px] text-muted-foreground">
                          Titre : {diag.title}
                        </p>
                      )}
                      {diag.frames &&
                        diag.frames.map((frame, fi) => (
                          <div key={fi} className="rounded border bg-secondary/30 p-2 space-y-1">
                            <p className="font-mono text-[10px] text-muted-foreground truncate">
                              Frame : {frame.url}
                            </p>
                            {frame.inputs.length > 0 && (
                              <div>
                                <p className="font-mono text-[10px] font-semibold text-muted-foreground">
                                  Inputs ({frame.inputCount}) :
                                </p>
                                {frame.inputs.map((inp, ii) => (
                                  <code
                                    key={ii}
                                    className="block font-mono text-[10px] text-muted-foreground pl-2 break-all"
                                  >
                                    {inp}
                                  </code>
                                ))}
                              </div>
                            )}
                            {frame.buttons.length > 0 && (
                              <div>
                                <p className="font-mono text-[10px] font-semibold text-muted-foreground">
                                  Boutons ({frame.buttonCount}) :
                                </p>
                                {frame.buttons.map((btn, bi) => (
                                  <code
                                    key={bi}
                                    className="block font-mono text-[10px] text-muted-foreground pl-2 break-all"
                                  >
                                    {btn}
                                  </code>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* CTO section (collapsible) */}
        {vs?.forCTO && (
          <Card className="mt-6">
            <Collapsible open={ctoOpen} onOpenChange={setCtoOpen}>
              <CardHeader className="pb-3">
                <CollapsibleTrigger className="flex w-full items-center justify-between">
                  <CardTitle className="font-mono text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5" /> Pour le CTO
                  </CardTitle>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      ctoOpen ? "rotate-180" : ""
                    }`}
                  />
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap break-words rounded bg-secondary/30 border p-4">
                    {vs.forCTO}
                  </pre>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Report in-app */}
        {runId && (
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="font-mono" onClick={() => setReportOpen(true)}>
              <ExternalLink className="h-4 w-4 mr-2" /> Voir le rapport complet
            </Button>
          </div>
        )}

        {/* Report iframe dialog */}
        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-[90vh] p-0 gap-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="font-mono text-sm font-semibold">Rapport complet</span>
              <Button variant="ghost" size="sm" onClick={() => setReportOpen(false)}>
                <X className="h-4 w-4 mr-1" /> Fermer
              </Button>
            </div>
            <iframe
              src={`${REPORT_BASE}/runs/${runId}/report`}
              className="w-full flex-1 border-0"
              title="Rapport de test"
            />
          </DialogContent>
        </Dialog>

        {/* Legend */}
        <p className="mt-6 font-mono text-[10px] text-muted-foreground text-center">
          Statut = le test s'est-il exécuté ? | Verdict = votre parcours fonctionne-t-il ?
        </p>
    </div>
  );
}
