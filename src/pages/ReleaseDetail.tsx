import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRelease, getProject, runSingleFlow, getTraceUrl } from "@/lib/sentinelle-api";
import type { ReleaseDetail as ReleaseDetailType, Project, Run } from "@/lib/sentinelle-types";
import { VerdictBadge } from "@/components/VerdictBadge";
import { MainFlowSteps } from "@/components/MainFlowSteps";
import { IssueCard } from "@/components/IssueCard";
import { EvidenceViewer } from "@/components/EvidenceViewer";
import {
  ArrowLeft,
  Loader2,
  RotateCcw,
  Download,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function ReleaseDetail() {
  const { id: projectId, releaseId } = useParams<{ id: string; releaseId: string }>();
  const { toast } = useToast();

  const [release, setRelease] = useState<ReleaseDetailType | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [retesting, setRetesting] = useState<string | null>(null);
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());

  const isActive = release?.verdict === "PENDING";

  useEffect(() => {
    if (!releaseId || !projectId) return;
    Promise.all([getRelease(releaseId), getProject(projectId)])
      .then(([r, p]) => {
        setRelease(r);
        setProject(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [releaseId, projectId]);

  // Poll while PENDING
  useEffect(() => {
    if (!releaseId || !isActive) return;
    const interval = setInterval(async () => {
      try {
        const detail = await getRelease(releaseId);
        setRelease(detail);
        if (detail.verdict !== "PENDING") clearInterval(interval);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [releaseId, isActive]);

  const handleRetest = async (flowId: string) => {
    if (!projectId) return;
    setRetesting(flowId);
    try {
      const result = await runSingleFlow(projectId, flowId);
      toast({ title: "Test relancé", description: result.message });
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setRetesting(null);
    }
  };

  const toggleRun = (runId: string) => {
    setExpandedRuns((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) next.delete(runId);
      else next.add(runId);
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

  if (!release) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        Release introuvable.
      </div>
    );
  }

  const mainRun = release.runs.find((r) =>
    release.mainFlowId ? r.flowId === release.mainFlowId : false
  );
  const otherRuns = release.runs.filter((r) => r !== mainRun);
  const allIssues = release.runs.flatMap((r) => [
    ...(r.findings?.consoleErrors?.map((e) => ({ type: "console" as const, consoleError: e })) ?? []),
    ...(r.findings?.failedRequests?.map((f) => ({ type: "network" as const, failedRequest: f })) ?? []),
  ]);

  return (
    <div className="container max-w-3xl py-10 space-y-8">
      <Link
        to={`/project/${projectId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Retour au projet
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        <div className="flex items-center gap-3">
          <VerdictBadge verdict={release.verdict} />
          {isActive && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <h1 className="text-xl font-bold">
          Publication détectée à{" "}
          {new Date(release.detectedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </h1>
        <p className="text-xs text-muted-foreground">
          {new Date(release.detectedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          {" · "}
          {release.runs.length} parcours testé{release.runs.length > 1 ? "s" : ""}
        </p>
      </motion.div>

      {/* Main flow section */}
      {mainRun && (
        <Card className="border-border bg-surface">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neon bg-neon/10 rounded px-2 py-0.5">
                  Parcours principal
                </span>
                <span className="text-sm font-medium">{mainRun.flowLabel}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => mainRun.flowId && handleRetest(mainRun.flowId)}
                disabled={retesting === mainRun.flowId}
              >
                {retesting === mainRun.flowId ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RotateCcw className="h-3 w-3 mr-1" />
                )}
                Relancer
              </Button>
            </div>
            <MainFlowSteps steps={mainRun.steps || []} />
            {mainRun.assets?.screenshots && mainRun.assets.screenshots.length > 0 && (
              <EvidenceViewer screenshots={mainRun.assets.screenshots} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Other runs */}
      {otherRuns.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Autres parcours</h2>
          {otherRuns.map((run) => {
            const isExpanded = expandedRuns.has(run.id);
            return (
              <Card key={run.id} className="border-border bg-surface">
                <CardContent className="p-0">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => toggleRun(run.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">{run.flowLabel || "Parcours"}</span>
                    </div>
                    <VerdictBadge
                      verdict={
                        run.status === "passed" ? "OK"
                        : run.status === "failed" || run.status === "error" ? "ERREUR"
                        : run.status === "running" || run.status === "queued" ? "PENDING"
                        : "PENDING"
                      }
                    />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
                      <MainFlowSteps steps={run.steps || []} />
                      {run.assets?.screenshots && run.assets.screenshots.length > 0 && (
                        <EvidenceViewer screenshots={run.assets.screenshots} />
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => run.flowId && handleRetest(run.flowId)}
                          disabled={retesting === run.flowId}
                        >
                          {retesting === run.flowId ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <RotateCcw className="h-3 w-3 mr-1" />
                          )}
                          Relancer
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Issues */}
      {allIssues.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Problèmes détectés ({allIssues.length})
          </h2>
          {allIssues.map((issue, i) => (
            <IssueCard key={i} {...issue} />
          ))}
        </div>
      )}

      {/* Trace download */}
      {release.runs.some((r) => r.assets?.tracePath) && project && (
        <div className="space-y-2">
          {release.runs
            .filter((r) => r.assets?.tracePath)
            .map((r) => (
              <a
                key={r.id}
                href={getTraceUrl(project, r.assets!.tracePath!)}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="text-xs w-full mb-2">
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Trace Playwright — {r.flowLabel}
                </Button>
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
