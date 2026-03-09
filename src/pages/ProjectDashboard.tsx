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
  getMainFlow,
} from "@/lib/sentinelle-api";
import type { Project, Release, ReleaseDetail, MainFlowInfo, Run, SuggestedFlow, ReleaseRunSummary } from "@/lib/sentinelle-types";
import { VerdictBadge } from "@/components/VerdictBadge";
import { MainFlowSteps } from "@/components/MainFlowSteps";
import {
  ArrowLeft,
  ExternalLink,
  Play,
  Loader2,
  Settings,
  History,
  Rocket,
  FlaskConical,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { AuthenticatedZone } from "@/components/AuthenticatedZone";

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

function runStatusToVerdict(status: string): "OK" | "ALERTE" | "ERREUR" | "PENDING" {
  if (status === "passed") return "OK";
  if (status === "failed") return "ALERTE";
  if (status === "error") return "ERREUR";
  return "PENDING";
}

function verdictContext(release: Release | ReleaseDetail | null): { label: string; subtitle: string; verdict: "OK" | "ALERTE" | "ERREUR" | "PENDING" } {
  if (!release) {
    return { label: "En attente de publication", subtitle: "Aucune publication n'a encore été détectée.", verdict: "PENDING" };
  }
  const v = release.verdict;
  if (v === "OK") {
    return { label: "Publication vérifiée", subtitle: "Tous les parcours surveillés fonctionnent correctement.", verdict: "OK" };
  }
  if (v === "ALERTE") {
    const failedCount = release.runs.filter(r => r.status === "failed" || r.status === "error").length;
    return { label: "Problème détecté après publication", subtitle: `Le parcours principal fonctionne mais ${failedCount} parcours secondaire(s) en échec.`, verdict: "ALERTE" };
  }
  if (v === "ERREUR") {
    return { label: "Problème détecté après publication", subtitle: `Le parcours principal "${release.mainFlowLabel || "inconnu"}" a échoué.`, verdict: "ERREUR" };
  }
  // PENDING
  return { label: "Vérification en cours…", subtitle: "Les tests sont en cours d'exécution.", verdict: "PENDING" };
}

// ── Flow Card ──

function FlowCard({ flow, run }: { flow: SuggestedFlow; run?: Run }) {
  const status = run ? runStatusToVerdict(run.status) : "PENDING";
  const stepsInfo = run?.stepsSummary;

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
      <div className="space-y-1 min-w-0 flex-1">
        <span className="text-sm font-medium">{flow.labelFr || flow.goal}</span>
        {stepsInfo && (
          <p className="text-xs text-muted-foreground">
            {stepsInfo.passed}/{stepsInfo.total} étapes réussies
          </p>
        )}
        {run?.errorSummary && (
          <p className="text-xs text-status-erreur flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {run.errorSummary}
          </p>
        )}
      </div>
      <VerdictBadge verdict={status} size="sm" />
    </div>
  );
}

// ── Main Component ──

export default function ProjectDashboard() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [latestRelease, setLatestRelease] = useState<Release | ReleaseDetail | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [mainFlowSteps, setMainFlowSteps] = useState<import("@/lib/sentinelle-types").RunStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load data ──
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

    // Check if any run is still active
    const hasActive = latestRuns.some(r => r.status === "queued" || r.status === "running");
    if (hasActive && !pollRef.current) {
      startPolling();
    }

    // Load main flow steps from release detail
    if (rel?.id) {
      try {
        const detail = await getRelease(rel.id);
        const mainRun = detail.runs.find(r =>
          rel.mainFlowId ? r.flowId === rel.mainFlowId : detail.runs.indexOf(r) === 0
        );
        if (mainRun?.steps) setMainFlowSteps(mainRun.steps);
        // Update release with full data
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
        // Refresh everything
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
      // Start polling
      startPolling();
      // Refresh runs immediately
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

  // ── Render ──

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

  const lastRun = runs[0] ?? null;
  const { label: vLabel, subtitle: vSubtitle, verdict: vVerdict } = verdictContext(latestRelease);

  // Flow separation
  const mainFlowId = project.mainFlowId;
  const monitoredFlows = project.monitoredFlows ?? [];
  const mainFlow = mainFlowId ? monitoredFlows.find(f => f.id === mainFlowId) : null;
  const otherFlows = mainFlowId ? monitoredFlows.filter(f => f.id !== mainFlowId) : monitoredFlows;

  // Find latest run per flow
  const latestRunByFlow = (flowId: string) => runs.find(r => r.flowId === flowId);

  const isActive = testing || runs.some(r => r.status === "queued" || r.status === "running");

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
            {lastRun?.startedAt && (() => {
              const info = triggerLabel(lastRun.trigger);
              const TriggerIcon = info.icon;
              return (
                <>
                  <span>·</span>
                  <TriggerIcon className="h-3 w-3" />
                  <span>{info.text} — {timeAgo(lastRun.startedAt)}</span>
                </>
              );
            })()}
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
        </motion.div>
      )}

      {/* Parcours principal */}
      {project.configStatus !== "no_flows" && mainFlow && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neon bg-neon/10 rounded px-2 py-0.5">
              Parcours principal
            </span>
          </div>
          <FlowCard flow={mainFlow} run={latestRunByFlow(mainFlow.id)} />
          {mainFlowSteps.length > 0 && (
            <Card className="border-border bg-surface">
              <CardContent className="p-5">
                <MainFlowSteps steps={mainFlowSteps} />
              </CardContent>
            </Card>
          )}
          {isActive && mainFlowSteps.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              En attente des résultats…
            </div>
          )}
        </div>
      )}

      {/* Autres parcours surveillés */}
      {project.configStatus !== "no_flows" && otherFlows.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            {mainFlow ? "Autres parcours surveillés" : "Parcours surveillés"}
          </p>
          {otherFlows.map(flow => (
            <FlowCard key={flow.id} flow={flow} run={latestRunByFlow(flow.id)} />
          ))}
        </div>
      )}

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
        <Button
          onClick={handleTestNow}
          disabled={isActive}
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
      )}
    </div>
  );
}
