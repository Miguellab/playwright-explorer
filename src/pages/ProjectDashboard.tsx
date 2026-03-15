import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getProject,
  listReleases,
  listRuns,
  testNow,
  getRelease,
} from "@/lib/sentinelle-api";
import type { Project, Release, ReleaseDetail, Run, SuggestedFlow } from "@/lib/sentinelle-types";
import { VerdictBadge } from "@/components/VerdictBadge";
import { VerdictIssues } from "@/components/VerdictIssues";
import { FlowAccordion } from "@/components/FlowAccordion";
import { groupFlowsByType, CHECK_TYPE_META, type CheckType } from "@/lib/flow-categories";
import {
  ArrowLeft,
  ExternalLink,
  Play,
  Loader2,
  Settings,
  History,
  Rocket,
  FlaskConical,
  ChevronDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AuthenticatedZone } from "@/components/AuthenticatedZone";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// ── Helpers ──

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

function triggerLabel(trigger: string): { text: string; icon: typeof Rocket } {
  switch (trigger) {
    case "release_detected":
    case "deploy_webhook":
      return { text: "Dernière publication détectée", icon: Rocket };
    case "manual":
      return { text: "Dernier test manuel", icon: FlaskConical };
    case "manual_flow_retest":
      return { text: "Dernier retest manuel", icon: FlaskConical };
    default:
      return { text: "Dernier test", icon: FlaskConical };
  }
}

function verdictContext(release: Release | ReleaseDetail | null): { label: string; subtitle: string; verdict: "OK" | "ALERTE" | "ERREUR" | "PENDING" } {
  if (!release) {
    return { label: "En attente de publication", subtitle: "Aucune publication n'a encore été détectée.", verdict: "PENDING" };
  }
  // Use verdictHeadline from API if available
  if (release.verdictHeadline) {
    const v = release.verdict as "OK" | "ALERTE" | "ERREUR" | "PENDING";
    const subtitle = release.verdictResult?.forUser
      ?? (v === "OK" ? "Toutes les vérifications configurées sont validées." : "");
    return { label: release.verdictHeadline, subtitle, verdict: v };
  }
  // Use enriched verdict if available
  if (release.verdictResult) {
    return {
      label: release.verdictResult.headline,
      subtitle: release.verdictResult.forUser,
      verdict: release.verdictResult.verdict as "OK" | "ALERTE" | "ERREUR" | "PENDING",
    };
  }
  const v = release.verdict;
  if (v === "OK") {
    return { label: "Publication vérifiée", subtitle: "Toutes les vérifications configurées sont validées.", verdict: "OK" };
  }
  if (v === "ALERTE") {
    const failedCount = release.runs.filter(r => r.status === "failed" || r.status === "error").length;
    return { label: "Problème détecté après publication", subtitle: `Le parcours principal fonctionne mais ${failedCount} vérification(s) en échec.`, verdict: "ALERTE" };
  }
  if (v === "ERREUR") {
    return { label: "Problème détecté après publication", subtitle: `Le parcours principal "${release.mainFlowLabel || "inconnu"}" a échoué.`, verdict: "ERREUR" };
  }
  return { label: "Vérification en cours…", subtitle: "Les tests sont en cours d'exécution.", verdict: "PENDING" };
}

const SECTION_ORDER: CheckType[] = ["user-flow", "page-check", "ui-element"];

// ── Main Component ──

export default function ProjectDashboard() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [latestRelease, setLatestRelease] = useState<Release | ReleaseDetail | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [releaseRuns, setReleaseRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [dailyRunCount, setDailyRunCount] = useState<number | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    const [p, releases, latestRuns] = await Promise.all([
      getProject(id),
      listReleases(id, 1),
      listRuns(id, 10),
    ]);
    setProject(p);
    setRuns(latestRuns);
    const rel = releases.length > 0 ? releases[0] : null;
    setLatestRelease(rel);

    const hasActive = latestRuns.some(r => r.status === "queued" || r.status === "running");
    if (hasActive && !pollRef.current) {
      startPolling();
    }

    if (rel?.id) {
      try {
        const detail = await getRelease(rel.id);
        setReleaseRuns(detail.runs);
        setLatestRelease(detail);
      } catch {}
    }
  }, [id]);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      if (!id) return;
      const latestRuns = await listRuns(id, 10);
      setRuns(latestRuns);
      const hasActive = latestRuns.some(r => r.status === "queued" || r.status === "running");
      if (!hasActive) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setTesting(false);
        loadData();
      }
    }, 5000);
  }, [id, loadData]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadData]);

  const handleTestNow = useCallback(async () => {
    if (!id) return;
    setTesting(true);
    try {
      const response = await testNow(id);
      toast({
        title: "Test lancé",
        description: response.message || `${response.runs.length} test${response.runs.length > 1 ? "s" : ""} en cours.`,
      });
      startPolling();
      const latestRuns = await listRuns(id, 10);
      setRuns(latestRuns);
    } catch (e: unknown) {
      setTesting(false);
      const err = e as Error & { status?: number };
      if (err.status === 429) {
        toast({ title: "Limite atteinte", description: "Réessayez demain.", variant: "destructive" });
      } else {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    }
  }, [id, toast, startPolling]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        Projet introuvable.
      </div>
    );
  }

  const { label: vLabel, subtitle: vSubtitle, verdict: vVerdict } = verdictContext(latestRelease);

  const monitoredFlows = project.monitoredFlows ?? [];
  const mainFlowId = project.mainFlowId;
  const flowsByType = groupFlowsByType(monitoredFlows);

  // Build run lookup from release runs, falling back to latest runs
  const findRunForFlow = (flowId: string) =>
    releaseRuns.find(r => r.flowId === flowId) ?? runs.find(r => r.flowId === flowId);

  // Compute queue context for PENDING flows
  const allFlows = SECTION_ORDER.flatMap(type => flowsByType[type]);
  const totalInQueue = allFlows.length;
  const completedInQueue = allFlows.filter(f => {
    const r = findRunForFlow(f.id);
    return r && r.status !== "queued" && r.status !== "running";
  }).length;
  let queueIndex = 0;
  const queuePositionMap: Record<string, number> = {};
  for (const f of allFlows) {
    const r = findRunForFlow(f.id);
    if (!r || r.status === "queued") {
      queuePositionMap[f.id] = completedInQueue + queueIndex + 1;
      queueIndex++;
    }
  }

  const isActive = testing || runs.some(r => r.status === "queued" || r.status === "running");

  // Release trigger context line
  const releaseContextLine = latestRelease ? (() => {
    const info = triggerLabel(latestRelease.trigger);
    const TriggerIcon = info.icon;
    return (
      <>
        <TriggerIcon className="h-3 w-3" />
        <span>{info.text} — {timeAgo(latestRelease.detectedAt)}</span>
      </>
    );
  })() : null;

  return (
    <div className="container max-w-3xl py-10 space-y-8">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Mes projets
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <a
              href={project.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              {project.siteUrl.replace(/^https?:\/\//, "")}
            </a>
            {releaseContextLine && (
              <>
                <span>·</span>
                {releaseContextLine}
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/project/${project.id}/releases`}>
            <Button variant="outline" size="sm" className="text-xs">
              <History className="h-3 w-3 mr-1" /> Historique
            </Button>
          </Link>
          <Link to={`/project/${project.id}/settings`}>
            <Button variant="outline" size="sm" className="text-xs">
              <Settings className="h-3 w-3 mr-1" /> Paramètres
            </Button>
          </Link>
        </div>
      </div>

      {/* No flows configured */}
      {project.configStatus === "no_flows" && (
        <Card className="border-border bg-surface">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Aucun parcours configuré. Lancez une découverte pour commencer.
            </p>
            <Button
              onClick={() => navigate(`/project/${project.id}/discover`)}
              className="bg-neon text-background hover:bg-neon/90"
            >
              Découvrir les parcours
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Verdict Card */}
      {project.configStatus !== "no_flows" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <VerdictBadge verdict={vVerdict} size="lg" label={vLabel} subtitle={vSubtitle} />
          {latestRelease?.verdictResult?.issues && latestRelease.verdictResult.issues.length > 0 && (
            <div className="mt-3">
              <VerdictIssues issues={latestRelease.verdictResult.issues} />
            </div>
          )}
        </motion.div>
      )}

      {/* Grouped flow sections */}
      {project.configStatus !== "no_flows" && SECTION_ORDER.map(type => {
        const flows = flowsByType[type];
        if (flows.length === 0) return null;
        const meta = CHECK_TYPE_META[type];
        return (
          <div key={type} className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border", meta.badgeClass)}>
                  {meta.title}
                </span>
                <span className="text-xs text-muted-foreground">({flows.length})</span>
              </div>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            </div>
            {flows.map(flow => (
              <FlowAccordion
                key={flow.id}
                flow={flow}
                run={findRunForFlow(flow.id)}
                isMainFlow={flow.id === mainFlowId}
                projectId={id}
                onRetestComplete={loadData}
                disabled={isActive}
                queuePosition={queuePositionMap[flow.id]}
                totalInQueue={totalInQueue}
                completedInQueue={completedInQueue}
              />
            ))}
          </div>
        );
      })}

      {/* Authenticated Zone */}
      {project.configStatus !== "no_flows" && (
        <AuthenticatedZone
          projectId={project.id}
          project={project}
          onProjectUpdated={() => {
            getProject(project.id).then(setProject).catch(() => {});
          }}
        />
      )}

      {/* Action */}
      {project.configStatus !== "no_flows" && (
        <div className="space-y-2">
          {dailyRunCount != null && project.maxRunsPerDay && (
            <p className={cn(
              "text-xs text-center",
              dailyRunCount >= project.maxRunsPerDay ? "text-status-alerte" : "text-muted-foreground"
            )}>
              {dailyRunCount >= project.maxRunsPerDay
                ? `Limite atteinte (${dailyRunCount}/${project.maxRunsPerDay})`
                : `${dailyRunCount}/${project.maxRunsPerDay} tests aujourd'hui`
              }
            </p>
          )}
          <Button
            onClick={handleTestNow}
            disabled={isActive || (dailyRunCount != null && project.maxRunsPerDay != null && dailyRunCount >= project.maxRunsPerDay)}
            className="w-full bg-neon text-background hover:bg-neon/90 font-semibold"
            size="lg"
          >
            {isActive ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isActive ? "Test en cours…" : "Lancer un test manuel"}
          </Button>
        </div>
      )}
    </div>
  );
}
