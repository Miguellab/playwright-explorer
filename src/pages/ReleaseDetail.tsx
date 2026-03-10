import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getRelease, getProject, runSingleFlow, getTraceUrl } from "@/lib/sentinelle-api";
import type { ReleaseDetail as ReleaseDetailType, Project } from "@/lib/sentinelle-types";
import { VerdictBadge } from "@/components/VerdictBadge";
import { VerdictIssues } from "@/components/VerdictIssues";
import { RunCard } from "@/components/RunCard";
import { ArrowLeft, Loader2, Download, Rocket, FlaskConical, Webhook, RotateCcw, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

function isErrorStatus(status: string) {
  return status === "failed" || status === "error";
}

function triggerInfo(trigger: string) {
  switch (trigger) {
    case "release_detected":
      return { text: "Publication détectée", Icon: Rocket, className: "bg-neon/10 text-neon border-neon/30" };
    case "deploy_webhook":
      return { text: "Déploiement notifié", Icon: Webhook, className: "bg-blue-500/10 text-blue-400 border-blue-500/30" };
    case "manual":
      return { text: "Test manuel", Icon: FlaskConical, className: "bg-purple-500/10 text-purple-400 border-purple-500/30" };
    case "manual_flow_retest":
      return { text: "Retest manuel", Icon: RotateCcw, className: "bg-status-alerte/10 text-status-alerte border-status-alerte/30" };
    default:
      return { text: "Test", Icon: FlaskConical, className: "bg-muted text-muted-foreground border-border" };
  }
}

export default function ReleaseDetail() {
  const { id: projectId, releaseId } = useParams<{ id: string; releaseId: string }>();
  const { toast } = useToast();

  const [release, setRelease] = useState<ReleaseDetailType | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [retesting, setRetesting] = useState<Set<string>>(new Set());
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
  const [ctoOpen, setCtoOpen] = useState(false);

  const isActive = release?.verdict === "PENDING";

  useEffect(() => {
    if (!releaseId || !projectId) return;
    Promise.all([getRelease(releaseId), getProject(projectId)])
      .then(([r, p]) => {
        setRelease(r);
        setProject(p);
        const failedIds = new Set(
          r.runs.filter((run) => isErrorStatus(run.status)).map((run) => run.id)
        );
        setExpandedRuns(failedIds);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [releaseId, projectId]);

  const hasRetesting = retesting.size > 0;
  useEffect(() => {
    if (!releaseId || (!isActive && !hasRetesting)) return;
    const interval = setInterval(async () => {
      try {
        const detail = await getRelease(releaseId);
        setRelease(detail);
        setExpandedRuns((prev) => {
          const next = new Set(prev);
          detail.runs.forEach((run) => {
            if (isErrorStatus(run.status)) next.add(run.id);
          });
          return next;
        });
        setRetesting((prev) => {
          const next = new Set(prev);
          for (const fid of prev) {
            const run = detail.runs.find((r) => r.flowId === fid);
            if (run && !["running", "queued"].includes(run.status)) {
              next.delete(fid);
            }
          }
          return next;
        });
        if (detail.verdict !== "PENDING" && retesting.size === 0) clearInterval(interval);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [releaseId, isActive, hasRetesting]);

  const handleRetest = async (flowId: string) => {
    if (!projectId) return;
    setRetesting((prev) => new Set(prev).add(flowId));
    try {
      const result = await runSingleFlow(projectId, flowId);
      toast({ title: "Test relancé", description: result.message });
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
      setRetesting((prev) => { const next = new Set(prev); next.delete(flowId); return next; });
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
  const totalDuration = release.runs.reduce((sum, r) => sum + (r.durationMs ?? 0), 0);
  const trigger = triggerInfo(release.trigger);
  const TriggerIcon = trigger.Icon;
  const vr = release.verdictResult;

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
        <div className="flex items-center gap-3 flex-wrap">
          <VerdictBadge verdict={release.verdict} />
          <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border", trigger.className)}>
            <TriggerIcon className="h-3 w-3" />
            {trigger.text}
          </span>
          {isActive && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <h1 className="text-xl font-bold">
          {vr?.headline || `Publication détectée à ${new Date(release.detectedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
        </h1>

        <p className="text-xs text-muted-foreground">
          {new Date(release.detectedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          {" · "}
          {release.runs.length} vérification{release.runs.length > 1 ? "s" : ""}
          {totalDuration > 0 && (
            <>
              {" · "}
              <span className="font-mono">{(totalDuration / 1000).toFixed(1)}s</span> au total
            </>
          )}
        </p>
      </motion.div>

      {/* Enriched verdict */}
      {vr && (
        <div className="space-y-3">
          {vr.forUser && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">{vr.forUser}</p>
          )}
          {vr.issues.length > 0 && <VerdictIssues issues={vr.issues} />}
          {vr.forCTO && (
            <Collapsible open={ctoOpen} onOpenChange={setCtoOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className={cn("h-3 w-3 transition-transform", ctoOpen && "rotate-180")} />
                  Détails techniques
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 rounded-lg border border-border bg-background/50 p-3">
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{vr.forCTO}</pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}

      {/* Main flow */}
      {mainRun && (
        <RunCard
          run={mainRun}
          isMainFlow
          isExpanded={expandedRuns.has(mainRun.id)}
          onToggle={() => toggleRun(mainRun.id)}
          onRetest={handleRetest}
          retesting={retesting.has(mainRun.flowId)}
        />
      )}

      {/* Other runs */}
      {otherRuns.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Autres vérifications</h2>
          {otherRuns.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              isMainFlow={false}
              isExpanded={expandedRuns.has(run.id)}
              onToggle={() => toggleRun(run.id)}
              onRetest={handleRetest}
              retesting={retesting.has(run.flowId)}
            />
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
