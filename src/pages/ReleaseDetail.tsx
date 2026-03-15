import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getRelease, getProject, runSingleFlow, getTraceUrl } from "@/lib/sentinelle-api";
import type { ReleaseDetail as ReleaseDetailType, Project, Run } from "@/lib/sentinelle-types";
import { VerdictBadge } from "@/components/VerdictBadge";
import { RunCard } from "@/components/RunCard";
import { ArrowLeft, Loader2, Download, Rocket, FlaskConical, Webhook, RotateCcw, ChevronDown, CheckCircle, AlertTriangle, XCircle, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { getCheckType, CHECK_TYPE_META, getStatusMessage, type CheckType } from "@/lib/flow-categories";
import type { SuggestedFlow } from "@/lib/sentinelle-types";

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

const SECTION_ORDER: CheckType[] = ["user-flow", "page-check", "ui-element"];

function getRunCheckType(run: Run, monitoredFlows?: SuggestedFlow[]): CheckType {
  if (monitoredFlows && run.flowId) {
    const flow = monitoredFlows.find((f) => f.id === run.flowId);
    if (flow) return getCheckType(flow);
  }
  return "user-flow";
}

function buildStatusSummary(runs: Run[]) {
  let ok = 0, alerte = 0, erreur = 0, pending = 0;
  for (const r of runs) {
    if (r.status === "passed") ok++;
    else if (r.status === "failed" || r.status === "error") erreur++;
    else pending++;
  }
  // For now treat alerts as errors since API doesn't distinguish at run level
  return { ok, alerte, erreur, pending };
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
  const [sectionOpen, setSectionOpen] = useState<Record<CheckType, boolean>>({
    "user-flow": true,
    "page-check": false,
    "ui-element": false,
  });
  const [tracesOpen, setTracesOpen] = useState(false);

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

  // Group runs by category
  const runsByCategory = useMemo(() => {
    if (!release) return {} as Record<CheckType, Run[]>;
    const groups: Record<CheckType, Run[]> = {
      "user-flow": [],
      "page-check": [],
      "ui-element": [],
    };
    for (const run of release.runs) {
      const type = getRunCheckType(run, project?.monitoredFlows);
      groups[type].push(run);
    }
    return groups;
  }, [release, project]);

  // Auto-expand sections with failures
  useEffect(() => {
    if (!release) return;
    setSectionOpen((prev) => {
      const next = { ...prev };
      for (const type of SECTION_ORDER) {
        const runs = runsByCategory[type] || [];
        if (runs.some((r) => isErrorStatus(r.status))) {
          next[type] = true;
        }
      }
      return next;
    });
  }, [release, runsByCategory]);

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

  const scrollToFirstFailure = () => {
    if (!release) return;
    const firstFailed = release.runs.find((r) => isErrorStatus(r.status));
    if (firstFailed) {
      document.getElementById(firstFailed.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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

  const totalDuration = release.runs.reduce((sum, r) => sum + (r.durationMs ?? 0), 0);
  const trigger = triggerInfo(release.trigger);
  const TriggerIcon = trigger.Icon;
  const vr = release.verdictResult;
  const failedCount = release.runs.filter((r) => isErrorStatus(r.status)).length;
  const tracesRuns = release.runs.filter((r) => r.assets?.tracePath);

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

      {/* Anomaly banner */}
      {vr && release.verdict !== "PENDING" && (
        <div className="space-y-3">
          <div className={cn(
            "rounded-lg border p-4 space-y-2",
            release.verdict === "OK" && "border-status-safe/20 bg-status-safe/5",
            release.verdict === "ALERTE" && "border-status-alerte/20 bg-status-alerte/5",
            release.verdict === "ERREUR" && "border-status-erreur/20 bg-status-erreur/5",
          )}>
            <p className="text-sm text-foreground whitespace-pre-line">
              {vr.forUser}
            </p>
            {failedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs mt-1"
                onClick={scrollToFirstFailure}
              >
                <ArrowDown className="h-3 w-3 mr-1" />
                Voir les anomalies
              </Button>
            )}
          </div>

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

      {/* Category sections */}
      {SECTION_ORDER.map((type) => {
        const runs = runsByCategory[type] || [];
        if (runs.length === 0) return null;

        const meta = CHECK_TYPE_META[type];
        const summary = buildStatusSummary(runs);
        const isOpen = sectionOpen[type];

        return (
          <Collapsible
            key={type}
            open={isOpen}
            onOpenChange={(open) => setSectionOpen((prev) => ({ ...prev, [type]: open }))}
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-muted/20",
                  meta.sectionClass,
                  "bg-surface"
                )}
              >
                <div className="flex items-center gap-3">
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", !isOpen && "-rotate-90")} />
                  <span className="text-sm font-semibold">{meta.title}</span>
                  <span className="text-xs text-muted-foreground">({runs.length})</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {summary.ok > 0 && (
                    <span className="inline-flex items-center gap-1 text-status-safe">
                      <CheckCircle className="h-3 w-3" /> {summary.ok} OK
                    </span>
                  )}
                  {summary.erreur > 0 && (
                    <span className="inline-flex items-center gap-1 text-status-erreur">
                      <XCircle className="h-3 w-3" /> {summary.erreur} erreur{summary.erreur > 1 ? "s" : ""}
                    </span>
                  )}
                  {summary.pending > 0 && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> {summary.pending}
                    </span>
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2">
                <p className="text-xs text-muted-foreground px-1 mb-3">{meta.description}</p>
                {runs.map((run) => {
                  const checkType = getRunCheckType(run, project?.monitoredFlows);
                  const badgeMeta = CHECK_TYPE_META[checkType];
                  return (
                    <RunCard
                      key={run.id}
                      run={run}
                      isMainFlow={release.mainFlowId ? run.flowId === release.mainFlowId : false}
                      isExpanded={expandedRuns.has(run.id)}
                      onToggle={() => toggleRun(run.id)}
                      onRetest={handleRetest}
                      retesting={retesting.has(run.flowId)}
                      compact={run.status === "passed"}
                      typeBadge={{ label: badgeMeta.badgeLabel, className: badgeMeta.badgeClass }}
                      statusMessage={getStatusMessage(checkType, run.status, run.errorSummary)}
                    />
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      {/* Diagnostics techniques */}
      {tracesRuns.length > 0 && project && (
        <Collapsible open={tracesOpen} onOpenChange={setTracesOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-surface transition-colors hover:bg-muted/20"
            >
              <div className="flex items-center gap-3">
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", !tracesOpen && "-rotate-90")} />
                <span className="text-sm font-semibold">Diagnostics techniques</span>
                <span className="text-xs text-muted-foreground">({tracesRuns.length})</span>
              </div>
              <Download className="h-4 w-4 text-muted-foreground" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-1">
              {tracesRuns.map((r) => (
                <a
                  key={r.id}
                  href={getTraceUrl(project, r.assets!.tracePath!)}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-muted/20 transition-colors text-sm"
                >
                  <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>Trace — {r.flowLabel}</span>
                </a>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
