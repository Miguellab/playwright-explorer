import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { listReleases, listRuns, getProject, testNow } from "@/lib/sentinelle-api";
import type { Release, Run, Project } from "@/lib/sentinelle-types";
import { VerdictBadge } from "@/components/VerdictBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Clock, Rocket, FlaskConical, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatTime(date: string): string {
  return new Date(date).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type TimelineEntry =
  | { kind: "release"; data: Release; date: string }
  | { kind: "run"; data: Run; date: string };

function buildTimeline(releases: Release[], runs: Run[]): TimelineEntry[] {
  const releaseIds = new Set(releases.map((r) => r.id));

  const entries: TimelineEntry[] = [];

  for (const rel of releases) {
    entries.push({ kind: "release", data: rel, date: rel.detectedAt });
  }

  // Isolated runs: manual_flow_retest not attached to a loaded release
  for (const run of runs) {
    if (
      run.trigger === "manual_flow_retest" &&
      (!run.releaseId || !releaseIds.has(run.releaseId))
    ) {
      entries.push({ kind: "run", data: run, date: run.startedAt || run.finishedAt || "" });
    }
  }

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return entries;
}

function triggerLabel(trigger: string): { label: string; Icon: typeof Rocket } {
  if (trigger === "release_detected" || trigger === "deploy_webhook") {
    return { label: "Nouvelle publication", Icon: Rocket };
  }
  if (trigger === "manual_flow_retest") {
    return { label: "Retest manuel", Icon: FlaskConical };
  }
  return { label: "Test manuel", Icon: FlaskConical };
}

function runStatusToVerdict(status: string) {
  if (status === "passed") return "OK" as const;
  if (status === "failed") return "ALERTE" as const;
  if (status === "error") return "ERREUR" as const;
  return "PENDING" as const;
}

export default function ReleasesTimeline() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    const [releases, runs, proj] = await Promise.all([
      listReleases(id, 50),
      listRuns(id, 50),
      getProject(id),
    ]);
    setProject(proj);
    setEntries(buildTimeline(releases, runs));
  }, [id]);

  useEffect(() => {
    loadData()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadData]);

  // Polling while testing
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = useCallback(() => {
    if (!id) return;
    pollRef.current = setInterval(async () => {
      try {
        const runs = await listRuns(id, 10);
        const hasActive = runs.some(
          (r) => r.status === "queued" || r.status === "running"
        );
        if (!hasActive) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setTesting(false);
          await loadData();
        }
      } catch {}
    }, 5000);
  }, [id, loadData]);

  const handleTestNow = useCallback(async () => {
    if (!id) return;
    setTesting(true);
    try {
      const res = await testNow(id);
      toast({
        title: "Test lancé",
        description: res.message || `${res.runs.length} test(s) en cours.`,
      });
      startPolling();
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

  return (
    <div className="container max-w-3xl py-10 space-y-8">
      <Link
        to={`/project/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Retour au projet
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historique</h1>
          {project && (
            <p className="mt-1 text-sm text-muted-foreground">{project.name}</p>
          )}
        </div>
        <Button
          onClick={handleTestNow}
          disabled={testing}
          className="bg-neon text-background hover:bg-neon/90"
          size="sm"
        >
          {testing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {testing ? "Test en cours…" : "Lancer un test"}
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucun test enregistré.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            if (entry.kind === "release") {
              const rel = entry.data;
              const trig = triggerLabel(rel.trigger);
              return (
                <Link
                  key={`rel-${rel.id}`}
                  to={`/project/${id}/release/${rel.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <VerdictBadge verdict={rel.verdict} />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                          <trig.Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {trig.label}
                        </div>
                        {rel.mainFlowLabel && (
                          <p className="text-xs text-muted-foreground">
                            Flow principal : {rel.mainFlowLabel}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(rel.detectedAt)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {rel.runCount} test{rel.runCount > 1 ? "s" : ""}
                    </span>
                  </div>
                </Link>
              );
            }

            // Isolated run
            const run = entry.data;
            const trig = triggerLabel(run.trigger);
            return (
              <div
                key={`run-${run.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex items-center gap-4">
                  <VerdictBadge verdict={runStatusToVerdict(run.status)} />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <trig.Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {trig.label}
                    </div>
                    {run.flowLabel && (
                      <p className="text-xs text-muted-foreground">{run.flowLabel}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(entry.date)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
