import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import { StepActionIcon } from "@/components/StepActionIcon";
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
  discoverAuthenticatedFlows,
} from "@/lib/sentinelle-api";
import type { Project, Run } from "@/lib/sentinelle-types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

/** Group runs whose startedAt is within 2s of each other */
function groupRuns(runs: Run[]): Run[][] {
  if (runs.length === 0) return [];
  const groups: Run[][] = [];
  let currentGroup: Run[] = [runs[0]];

  for (let i = 1; i < runs.length; i++) {
    const prevTime = currentGroup[0].startedAt ? new Date(currentGroup[0].startedAt).getTime() : 0;
    const currTime = runs[i].startedAt ? new Date(runs[i].startedAt).getTime() : 0;
    if (prevTime && currTime && Math.abs(prevTime - currTime) <= 2000) {
      currentGroup.push(runs[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [runs[i]];
    }
  }
  groups.push(currentGroup);
  return groups;
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
  const [discovering, setDiscovering] = useState(false);
  const [activeRunIds, setActiveRunIds] = useState<string[]>([]);
  const [activeRuns, setActiveRuns] = useState<Run[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const latestActiveRun = activeRuns.length > 0 ? activeRuns[0] : null;
  const latestRun = latestActiveRun || (runs.length > 0 ? runs[0] : null);
  const hasActiveRuns = activeRuns.some((r) => r.status === "queued" || r.status === "running");

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

  // Poll active runs
  useEffect(() => {
    if (activeRunIds.length === 0 || !hasActiveRuns) return;
    const interval = setInterval(async () => {
      try {
        const updated = await Promise.all(activeRunIds.map((rid) => getRun(rid)));
        setActiveRuns(updated);
        const allDone = updated.every(
          (r) => r.status === "passed" || r.status === "failed" || r.status === "error"
        );
        if (allDone) {
          clearInterval(interval);
          if (id) listRuns(id).then((r) => setRuns(Array.isArray(r) ? r : []));
        }
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeRunIds, hasActiveRuns, id]);

  const handleTestNow = useCallback(async () => {
    if (!id) return;
    setTesting(true);
    setExpandedSteps(new Set());
    try {
      const response = await testNow(id);
      const runIds = response.runs.map((r) => r.runId);
      setActiveRunIds(runIds);
      const fetchedRuns = await Promise.all(runIds.map((rid) => getRun(rid)));
      setActiveRuns(fetchedRuns);
      toast({
        title: `${response.runs.length} test${response.runs.length > 1 ? "s" : ""} lancé${response.runs.length > 1 ? "s" : ""}`,
        description: response.message || response.runs.map((r) => r.flow).join(", "),
      });
    } catch (e: unknown) {
      const err = e as Error & { status?: number; code?: string };
      if (err.status === 400 && (err.message?.includes("NO_MONITORED_FLOWS") || err.message?.includes("parcours"))) {
        toast({ title: "Aucun parcours surveillé", description: err.message, variant: "destructive" });
        if (id) getProject(id).then(setProject).catch(() => {});
      } else if (err.status === 429) {
        toast({ title: "Limite atteinte", description: "Limite quotidienne atteinte. Reessayez demain.", variant: "destructive" });
      } else if (err.message?.includes("inaccessible") || err.message?.includes("unreachable")) {
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

  const handleAuthenticatedDiscovery = useCallback(async () => {
    if (!id) return;
    setDiscovering(true);
    try {
      const result = await discoverAuthenticatedFlows(id);
      if (result.loginSuccess) {
        toast({
          title: `${result.flows.length} parcours authentifié${result.flows.length > 1 ? "s" : ""} découvert${result.flows.length > 1 ? "s" : ""}`,
          description: result.flows.map((f) => f.labelFr).join(", ") || "Aucun nouveau parcours détecté.",
        });
      } else {
        toast({
          title: "Connexion échouée",
          description: "Impossible de se connecter avec les identifiants configurés. Vérifiez-les dans les paramètres.",
          variant: "destructive",
        });
      }
      const updatedProject = await getProject(id);
      setProject(updatedProject);
    } catch (e: unknown) {
      const err = e as Error;
      toast({
        title: "Erreur de découverte",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDiscovering(false);
    }
  }, [id, toast]);

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

  const runGroups = groupRuns(runs);

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
              {project.configStatus === "no_flows" ? (
                <Badge className="bg-status-pending/15 text-status-pending border-status-pending/30 font-mono text-[10px]">
                  Configuration
                </Badge>
              ) : latestRun ? (
                <StatusBadge status={latestRun.status} />
              ) : null}
              {!project.enabled && (
                <Badge variant="secondary" className="font-mono text-xs">
                  Surveillance en pause
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <a
                href={project.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                {project.siteUrl}
              </a>
              {project.lastCheckedAt && (
                <>
                  <span>·</span>
                  <Clock className="h-3 w-3" />
                  {timeAgo(project.lastCheckedAt)}
                </>
              )}
            </div>
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-mono">Supprimer le projet ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes les données et l'historique des tests seront supprimés.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-mono">Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono"
                  >
                    {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Monitored flows summary */}
        {project.monitoredFlows && project.monitoredFlows.length > 0 && (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">Parcours surveillés :</span>
              {project.monitoredFlows.map((flow) => (
                <span key={flow.id} className="inline-flex items-center gap-1">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {flow.labelFr}
                  </Badge>
                  {flow.authenticatedOnly && (
                    <Badge variant="outline" className="font-mono text-[10px] border-blue-500/50 text-blue-600 dark:text-blue-400">
                      Post-login
                    </Badge>
                  )}
                </span>
              ))}
            </div>
            {project.monitoredFlows.some((f) => f.requiresCredentials && !f.hasCredentials) && (
              <div className="flex items-center justify-between rounded-lg border border-status-pending/30 bg-status-pending/5 p-3">
                <p className="font-mono text-xs text-status-pending">
                  Certains parcours nécessitent des identifiants de test pour un résultat fiable.
                </p>
                <Link to={`/project/${project.id}/settings`}>
                  <Button variant="outline" size="sm" className="font-mono text-xs">
                    <Settings className="mr-1 h-3 w-3" /> Configurer
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Authenticated discovery */}
        {project.monitoredFlows?.some((f) => f.goal === "LOGIN" && f.hasCredentials) && (
          <Card className="mt-4">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-sm font-semibold">Zone authentifiée</p>
                <p className="text-xs text-muted-foreground">
                  Explorez les parcours post-connexion (dashboard, paramètres, etc.)
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="font-mono text-xs"
                onClick={handleAuthenticatedDiscovery}
                disabled={discovering}
              >
                {discovering ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Search className="mr-1 h-3 w-3" />
                )}
                Découvrir les parcours
              </Button>
            </CardContent>
          </Card>
        )}

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
              ) : project.configStatus === "no_flows" ? (
                <div className="text-center py-4 space-y-2">
                  <Badge className="bg-status-pending/15 text-status-pending border-status-pending/30 font-mono text-xs">
                    Configuration requise
                  </Badge>
                  <p className="font-mono text-sm text-muted-foreground">
                    {project.configMessage || "Aucun parcours surveillé — lancez une découverte et sélectionnez les parcours à surveiller."}
                  </p>
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full">
                      <Button
                        onClick={handleTestNow}
                        disabled={testing || hasActiveRuns || project.configStatus === "no_flows"}
                        className="w-full font-mono"
                        size="lg"
                      >
                        {testing || hasActiveRuns ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        Tester maintenant
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {project.configStatus === "no_flows" && (
                    <TooltipContent>
                      <p className="font-mono text-xs">Sélectionnez d'abord des parcours à surveiller</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              {!project.lastSeenSignature && (
                <p className="text-[10px] text-muted-foreground text-center font-mono">
                  Nous lancerons un test automatiquement des qu'une nouvelle version sera detectee.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live steps during active runs */}
        {activeRuns.length > 0 && activeRuns.some((r) => r.steps && r.steps.length > 0) && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-sm uppercase tracking-wider">
                Etapes du test
                {hasActiveRuns && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeRuns.map((activeRun) => (
                activeRun.steps && activeRun.steps.length > 0 && (
                  <div key={activeRun.id} className="space-y-1.5">
                    {activeRun.flowLabel && (
                      <Badge variant="outline" className="font-mono text-[10px] mb-1">
                        {activeRun.flowLabel}
                      </Badge>
                    )}
                    {activeRun.steps.map((step, i) => {
                      const stepKey = `${activeRun.id}-${i}`;
                      const isExpanded = expandedSteps.has(i);
                      const hasDetail = !!step.detail;
                      return (
                        <div key={stepKey} className="rounded border bg-secondary/30 overflow-hidden">
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
                  </div>
                )
              ))}
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
                {runGroups.map((group, gi) => (
                  <div
                    key={gi}
                    className={group.length > 1 ? "border-l-2 border-primary/30 pl-3 space-y-2" : "space-y-2"}
                  >
                    {group.map((run) => {
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
                            {run.flowLabel && (
                              <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                                {run.flowLabel}
                              </Badge>
                            )}
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
                ))}
              </div>
            )}

            {/* Legend */}
            <p className="mt-4 font-mono text-[10px] text-muted-foreground text-center">
              Statut = le test s'est-il exécuté ? | Verdict = votre parcours fonctionne-t-il ?
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
