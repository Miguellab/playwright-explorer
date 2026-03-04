import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import { StepActionIcon } from "@/components/StepActionIcon";
import { VerdictBadge, VerdictText } from "@/components/VerdictBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  getProject,
  listRuns,
  testNow,
  getRun,
  toggleProject,
  deleteProject,
} from "@/lib/sentinelle-api";
import type { Project, Run } from "@/lib/sentinelle-types";
import {
  ArrowLeft,
  ExternalLink,
  Play,
  Loader2,
  Settings,
  Clock,
  RotateCcw,
  Hand,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Rocket,
  Search,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TRIGGER_LABELS: Record<string, { icon: typeof RotateCcw; label: string }> = {
  release_detected: { icon: RotateCcw, label: "Changement detecte" },
  manual: { icon: Hand, label: "Test manuel" },
  scheduled: { icon: CalendarClock, label: "Verification planifiee" },
  deploy_webhook: { icon: Rocket, label: "Deploy webhook" },
  discovery: { icon: Search, label: "Découverte" },
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "a l'instant";
  if (min < 60) return `il y a ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

function formatDuration(ms: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function ProjectDashboard() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<Run | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const latestRun = activeRun || (runs.length > 0 ? runs[0] : null);
  const isRunActive = activeRun && (activeRun.status === "queued" || activeRun.status === "running");

  // Load project + runs
  useEffect(() => {
    if (!id) return;
    Promise.all([getProject(id), listRuns(id)])
      .then(([p, r]) => {
        setProject(p);
        setRuns(Array.isArray(r) ? r : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Poll active run
  useEffect(() => {
    if (!activeRunId || !isRunActive) return;
    const interval = setInterval(async () => {
      try {
        const updated = await getRun(activeRunId);
        setActiveRun(updated);
        if (updated.status === "passed" || updated.status === "failed" || updated.status === "error") {
          clearInterval(interval);
          // Refresh runs list
          if (id) listRuns(id).then((r) => setRuns(Array.isArray(r) ? r : []));
        }
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeRunId, isRunActive, id]);

  const handleTestNow = useCallback(async () => {
    if (!id) return;
    setTesting(true);
    setExpandedSteps(new Set());
    try {
      const { runId } = await testNow(id);
      setActiveRunId(runId);
      const run = await getRun(runId);
      setActiveRun(run);
    } catch (e: unknown) {
      const err = e as Error & { status?: number };
      if (err.status === 429) {
        toast({ title: "Limite atteinte", description: "Limite quotidienne atteinte. Reessayez demain.", variant: "destructive" });
      } else if (err.message.includes("inaccessible") || err.message.includes("unreachable")) {
        toast({ title: "Service inaccessible", description: "Le service de test est inaccessible. Verifiez votre configuration.", variant: "destructive" });
      } else {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    } finally {
      setTesting(false);
    }
  }, [id, toast]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      toast({ title: "Projet supprimé" });
      navigate("/");
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer le projet.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }, [id, toast, navigate]);

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

  if (!project) {
    return (
      <div className="container py-10 text-center font-mono text-muted-foreground">
        Projet introuvable.
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
        {/* Back */}
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Mes projets
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-bold">{project.name}</h1>
              {project.goal && (
                <Badge variant="outline" className="font-mono text-xs">
                  {project.goal}
                </Badge>
              )}
              {!project.enabled && (
                <Badge variant="secondary" className="font-mono text-xs">
                  Surveillance en pause
                </Badge>
              )}
            </div>
            <a
              href={project.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              {project.siteUrl}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={project.enabled}
              onCheckedChange={async () => {
                try {
                  const updated = await toggleProject(project.id);
                  setProject(updated);
                } catch {}
              }}
            />
            <Link to={`/project/${project.id}/settings`}>
              <Button variant="outline" size="sm" className="font-mono text-xs">
                <Settings className="h-3 w-3" /> Parametres
              </Button>
            </Link>
          </div>
        </div>

        {/* Monitored flows summary */}
        {project.monitoredFlows && project.monitoredFlows.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">Parcours surveillés :</span>
            {project.monitoredFlows.map((flow) => (
              <Badge key={flow.id} variant="secondary" className="font-mono text-[10px]">
                {flow.labelFr}
              </Badge>
            ))}
          </div>
        )}

        {/* Last check info */}
        <div className="mt-2 flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Clock className="h-3 w-3" />
          {project.lastCheckedAt
            ? `Derniere verification ${timeAgo(project.lastCheckedAt)}`
            : "En attente de la premiere verification..."}
        </div>

        {/* Verdict + Summary + Test button */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Verdict card */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              {latestRun?.verdictSummary ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <VerdictBadge verdict={latestRun.verdictSummary.verdict} size="lg" />
                  </div>
                  <VerdictText verdict={latestRun.verdictSummary.verdict} />
                  <p className="font-mono text-sm text-muted-foreground whitespace-pre-line">
                    {latestRun.verdictSummary.forUser}
                  </p>
                </div>
              ) : latestRun && (latestRun.status === "queued" || latestRun.status === "running") ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-mono text-sm font-semibold">
                      {latestRun.status === "queued" ? "Test en file d'attente..." : "Test en cours..."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Les resultats s'afficheront ici automatiquement.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="font-mono text-sm text-muted-foreground">
                    Aucun test n'a encore ete lance. Cliquez sur « Tester maintenant » pour commencer.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action card */}
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
              <Button
                onClick={handleTestNow}
                disabled={testing || !!isRunActive}
                className="w-full font-mono"
                size="lg"
              >
                {testing || isRunActive ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Tester maintenant
              </Button>
              {!project.lastSeenSignature && (
                <p className="text-[10px] text-muted-foreground text-center font-mono">
                  Nous lancerons un test automatiquement des qu'une nouvelle version sera detectee.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live steps during active run */}
        {activeRun && activeRun.steps && activeRun.steps.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-sm uppercase tracking-wider">
                Etapes du test
                {isRunActive && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {activeRun.steps.map((step, i) => {
                const isExpanded = expandedSteps.has(i);
                const hasDetail = !!step.detail;
                return (
                  <div key={i} className="rounded border bg-secondary/30 overflow-hidden">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-secondary/50 transition-colors"
                      onClick={() => hasDetail && toggleStep(i)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {hasDetail ? (
                          isExpanded ? (
                            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                          )
                        ) : (
                          <span className="w-3 shrink-0" />
                        )}
                        <StepActionIcon action={step.action} className="h-3 w-3" />
                        <span className="font-mono text-xs truncate">{step.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {step.durationMs && step.durationMs > 0 && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {formatDuration(step.durationMs)}
                          </span>
                        )}
                        <StatusBadge status={step.status === "passed" ? "pass" : step.status === "failed" ? "fail" : step.status} />
                      </div>
                    </button>
                    {isExpanded && step.detail && (
                      <div className="border-t bg-secondary/10 px-3 py-2">
                        <pre className="font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-words">
                          {step.detail}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Run timeline */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-sm uppercase tracking-wider">
              Historique des tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground font-mono py-4 text-center">
                Aucun test n'a encore ete lance. Cliquez sur « Tester maintenant » pour commencer.
              </p>
            ) : (
              <div className="space-y-2">
                {runs.map((run) => {
                  const trigger = TRIGGER_LABELS[run.trigger] || TRIGGER_LABELS.manual;
                  const TriggerIcon = trigger.icon;
                  return (
                    <Link
                      key={run.id}
                      to={`/project/${project.id}/run/${run.id}`}
                      className="flex items-center justify-between rounded border bg-secondary/30 px-4 py-3 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono shrink-0">
                          <TriggerIcon className="h-3 w-3" />
                          {trigger.label}
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {run.startedAt ? new Date(run.startedAt).toLocaleString("fr-FR") : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        {run.durationMs && (
                          <span className="font-mono text-xs text-muted-foreground">
                            {formatDuration(run.durationMs)}
                          </span>
                        )}
                        {run.verdict ? (
                          <VerdictBadge verdict={run.verdict} />
                        ) : (
                          <StatusBadge status={run.status} />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
