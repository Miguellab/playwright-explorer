import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getProject,
  listReleases,
  testNow,
  getRelease,
  getMainFlow,
} from "@/lib/sentinelle-api";
import type { Project, Release, ReleaseDetail, MainFlowInfo, RunStep } from "@/lib/sentinelle-types";
import { VerdictBadge } from "@/components/VerdictBadge";
import { MainFlowSteps } from "@/components/MainFlowSteps";
import {
  ArrowLeft,
  ExternalLink,
  Play,
  Loader2,
  Settings,
  Clock,
  History,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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

export default function ProjectDashboard() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [latestRelease, setLatestRelease] = useState<Release | ReleaseDetail | null>(null);
  const [mainFlow, setMainFlow] = useState<MainFlowInfo | null>(null);
  const [mainFlowSteps, setMainFlowSteps] = useState<RunStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [pollingReleaseId, setPollingReleaseId] = useState<string | null>(null);

  // Load project + latest release + main flow
  useEffect(() => {
    if (!id) return;
    Promise.all([getProject(id), listReleases(id, 1), getMainFlow(id)])
      .then(([p, releases, mf]) => {
        setProject(p);
        setMainFlow(mf);
        if (releases.length > 0) {
          setLatestRelease(releases[0]);
          // If pending, start polling
          if (releases[0].verdict === "PENDING") {
            setPollingReleaseId(releases[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch main flow steps from release detail
  useEffect(() => {
    if (!latestRelease) return;
    getRelease(latestRelease.id)
      .then((detail: ReleaseDetail) => {
        const mainRun = detail.runs.find((r) =>
          latestRelease.mainFlowId ? r.flowId === latestRelease.mainFlowId : detail.runs.indexOf(r) === 0
        );
        if (mainRun?.steps) {
          setMainFlowSteps(mainRun.steps);
        }
        // Update release with latest data
        setLatestRelease(detail);
        if (detail.verdict !== "PENDING") {
          setPollingReleaseId(null);
        }
      })
      .catch(() => {});
  }, [latestRelease?.id]);

  // Poll release while PENDING
  useEffect(() => {
    if (!pollingReleaseId) return;
    const interval = setInterval(async () => {
      try {
        const detail = await getRelease(pollingReleaseId);
        setLatestRelease(detail);
        const mainRun = detail.runs.find((r) =>
          detail.mainFlowId ? r.flowId === detail.mainFlowId : detail.runs.indexOf(r) === 0
        );
        if (mainRun?.steps) setMainFlowSteps(mainRun.steps);
        if (detail.verdict !== "PENDING") {
          clearInterval(interval);
          setPollingReleaseId(null);
        }
      } catch { }
    }, 3000);
    return () => clearInterval(interval);
  }, [pollingReleaseId]);

  const handleTestNow = useCallback(async () => {
    if (!id) return;
    setTesting(true);
    try {
      const response = await testNow(id);
      setPollingReleaseId(response.releaseId);
      // Immediately fetch the new release
      const releases = await listReleases(id, 1);
      if (releases.length > 0) {
        setLatestRelease(releases[0]);
        setMainFlowSteps([]);
      }
      toast({
        title: "Test lancé",
        description: response.message || `${response.runs.length} test${response.runs.length > 1 ? "s" : ""} en cours.`,
      });
    } catch (e: unknown) {
      const err = e as Error & { status?: number };
      if (err.status === 429) {
        toast({ title: "Limite atteinte", description: "Réessayez demain.", variant: "destructive" });
      } else {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    } finally {
      setTesting(false);
    }
  }, [id, toast]);

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

  const isPending = latestRelease?.verdict === "PENDING";

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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <a
              href={project.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              {project.siteUrl.replace(/^https?:\/\//, "")}
            </a>
            {latestRelease && (
              <>
                <span>·</span>
                <Clock className="h-3 w-3" />
                <span>Dernière publication {timeAgo(latestRelease.detectedAt)}</span>
              </>
            )}
          </div>
        </div>
        <Link to={`/project/${project.id}/settings`}>
          <Button variant="outline" size="sm" className="text-xs">
            <Settings className="h-3 w-3 mr-1" /> Paramètres
          </Button>
        </Link>
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
          {latestRelease ? (
            <div className="space-y-6">
              <VerdictBadge verdict={latestRelease.verdict} size="lg" />

              {/* Main flow result */}
              {mainFlow && latestRelease.mainFlowLabel && (
                <Card className="border-border bg-surface">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-neon bg-neon/10 rounded px-2 py-0.5">
                        Parcours principal
                      </span>
                      <span className="text-sm font-medium">{latestRelease.mainFlowLabel}</span>
                    </div>
                    <MainFlowSteps steps={mainFlowSteps} />
                    {isPending && mainFlowSteps.length === 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        En attente des résultats…
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Other runs summary */}
              {latestRelease.runs.filter(r => !('isMainFlow' in r ? r.isMainFlow : r.flowId === latestRelease.mainFlowId)).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Autres parcours</p>
                  {latestRelease.runs.filter(r => !('isMainFlow' in r ? r.isMainFlow : r.flowId === latestRelease.mainFlowId)).map((run) => (
                    <div key={run.id} className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
                      <span className="text-sm">{run.flowLabel}</span>
                      <VerdictBadge
                        verdict={
                          run.status === "passed" ? "OK"
                            : run.status === "failed" ? "ERREUR"
                              : run.status === "error" ? "ERREUR"
                                : "PENDING"
                        }
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Card className="border-border bg-surface">
              <CardContent className="p-8 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Aucune publication détectée pour le moment.
                </p>
                <p className="text-xs text-muted-foreground">
                  Lancez un test pour valider votre application.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Actions */}
      {project.configStatus !== "no_flows" && (
        <div className="flex gap-3">
          <Button
            onClick={handleTestNow}
            disabled={testing || isPending}
            className="flex-1 bg-neon text-background hover:bg-neon/90 font-semibold"
            size="lg"
          >
            {testing || isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isPending ? "Vérification en cours…" : "Lancer un test maintenant"}
          </Button>

          {latestRelease && (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(`/project/${project.id}/release/${latestRelease.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Détails
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(`/project/${project.id}/releases`)}
              >
                <History className="mr-2 h-4 w-4" />
                Historique
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
