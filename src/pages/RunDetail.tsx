import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppNav } from "@/components/AppNav";
import { StatusBadge } from "@/components/StatusBadge";
import { getTestRun } from "@/lib/api";
import type { TestRun } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Loader2, ChevronDown, ChevronRight, AlertTriangle, Bug, Search } from "lucide-react";

export default function RunDetail() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<TestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const isRunActive = run && (run.status === "queued" || run.status === "running");

  const toggleStep = (index: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  useEffect(() => {
    if (!id) return;
    getTestRun(id).then(setRun).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  // Poll while active
  useEffect(() => {
    if (!id || !isRunActive) return;
    const interval = setInterval(async () => {
      try {
        const updated = await getTestRun(id);
        setRun(updated);
        if (updated.status === "passed" || updated.status === "failed") {
          clearInterval(interval);
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [id, isRunActive]);

  const reportUrl = run?.assets?.reportUrl || run?.report_url || null;

  if (loading) return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    </div>
  );

  if (!run) return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="container py-10 text-center font-mono text-muted-foreground">Run not found.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="container max-w-4xl py-10">
        <Link to="/runs" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to runs
        </Link>

        <div className="flex items-center gap-4">
          <h1 className="font-mono text-2xl font-bold">Run Detail</h1>
          <StatusBadge status={run.status} />
        </div>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{run.site_url}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {new Date(run.created_at).toLocaleString()}
          {run.duration_ms && ` • ${(run.duration_ms / 1000).toFixed(1)}s`}
        </p>

        {reportUrl && (
          <Button variant="outline" size="sm" className="mt-4 font-mono text-xs" asChild>
            <a href={reportUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" /> Open HTML Report
            </a>
          </Button>
        )}

        {/* Error banner */}
        {run.status === "failed" && run.error && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-status-fail/30 bg-status-fail/5 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-fail" />
            <pre className="font-mono text-xs text-status-fail whitespace-pre-wrap break-words">{run.error}</pre>
          </div>
        )}

        {/* Steps */}
        <Card className="mt-8">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-sm uppercase tracking-wider">Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {run.steps && run.steps.map((step, i) => {
              const isExpanded = expandedSteps.has(i);
              const hasDetail = !!step.detail;
              return (
                <div key={i} className="rounded border bg-secondary/30 overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                    onClick={() => hasDetail && toggleStep(i)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {hasDetail ? (
                        isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <span className="w-3.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-mono text-sm truncate">{step.name}</p>
                        {step.note && <p className="font-mono text-xs text-muted-foreground">{step.note}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="font-mono text-xs text-muted-foreground">{step.durationMs}ms</span>
                      <StatusBadge status={step.status} />
                    </div>
                  </button>
                  {isExpanded && step.detail && (
                    <div className="border-t bg-secondary/10 px-4 py-3">
                      <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap break-words">{step.detail}</pre>
                    </div>
                  )}
                </div>
              );
            })}
            {(!run.steps || run.steps.length === 0) && isRunActive && (
              <div className="flex items-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-mono text-sm">Waiting for results…</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Screenshots */}
        {run.assets?.screenshots && run.assets.screenshots.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-sm uppercase tracking-wider">Screenshots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {run.assets.screenshots.map((ss, i) => (
                  <a key={i} href={ss.url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded border bg-secondary/30">
                    <img src={ss.url} alt={ss.label} className="aspect-video w-full object-cover transition-opacity group-hover:opacity-80" />
                    <p className="p-2 font-mono text-xs text-muted-foreground">{ss.label}</p>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Findings */}
        {run.findings && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-sm uppercase tracking-wider">Findings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {run.findings.consoleErrors && run.findings.consoleErrors.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-xs font-semibold text-status-fail">Console Errors ({run.findings.consoleErrors.length})</p>
                  {run.findings.consoleErrors.slice(0, 5).map((err, i) => (
                    <div key={i} className="mb-1 rounded border border-status-fail/20 bg-status-fail/5 px-3 py-2">
                      <p className="font-mono text-xs">{err.text}</p>
                      {err.url && <p className="font-mono text-[10px] text-muted-foreground">{err.url}</p>}
                    </div>
                  ))}
                </div>
              )}
              {run.findings.failedRequests && run.findings.failedRequests.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-xs font-semibold text-status-skipped">Failed Requests ({run.findings.failedRequests.length})</p>
                  {run.findings.failedRequests.slice(0, 5).map((req, i) => (
                    <div key={i} className="mb-1 rounded border border-status-skipped/20 bg-status-skipped/5 px-3 py-2">
                      <p className="font-mono text-xs">{req.url}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">Status: {req.status}</p>
                    </div>
                  ))}
                </div>
              )}
              {(!run.findings.consoleErrors || run.findings.consoleErrors.length === 0) &&
               (!run.findings.failedRequests || run.findings.failedRequests.length === 0) &&
               (!run.findings.diagnostics || run.findings.diagnostics.length === 0) && (
                <p className="font-mono text-sm text-muted-foreground">No issues found.</p>
              )}

              {/* Diagnostics */}
              {run.findings.diagnostics && run.findings.diagnostics.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Search className="h-3 w-3" /> Diagnostics ({run.findings.diagnostics.length})
                  </p>
                  <div className="space-y-2">
                    {run.findings.diagnostics.map((diag, i) => (
                      <div key={i} className="rounded border bg-secondary/20 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          {diag.error ? <Bug className="h-3.5 w-3.5 shrink-0 text-status-fail" /> : <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                          <span className="font-mono text-xs font-semibold">{diag.step}</span>
                          {diag.type && <span className="font-mono text-[10px] text-muted-foreground">({diag.type})</span>}
                        </div>
                        {diag.error && (
                          <pre className="font-mono text-xs text-status-fail whitespace-pre-wrap break-words rounded bg-status-fail/5 border border-status-fail/20 p-2">{diag.error}</pre>
                        )}
                        {diag.type === "page_audit" && (
                          <div className="space-y-1.5">
                            {diag.url && <p className="font-mono text-[10px] text-muted-foreground truncate">URL: {diag.url}</p>}
                            {diag.title && <p className="font-mono text-[10px] text-muted-foreground">Title: {diag.title}</p>}
                            {diag.frameCount != null && <p className="font-mono text-[10px] text-muted-foreground">Frames: {diag.frameCount}</p>}
                            {diag.frames && diag.frames.map((frame, fi) => (
                              <div key={fi} className="rounded border bg-secondary/30 p-2 space-y-1">
                                <p className="font-mono text-[10px] text-muted-foreground truncate">Frame: {frame.url}</p>
                                {frame.inputs.length > 0 && (
                                  <div>
                                    <p className="font-mono text-[10px] font-semibold text-muted-foreground">Inputs ({frame.inputCount}):</p>
                                    {frame.inputs.map((inp, ii) => (
                                      <code key={ii} className="block font-mono text-[10px] text-muted-foreground pl-2 break-all">{inp}</code>
                                    ))}
                                  </div>
                                )}
                                {frame.buttons.length > 0 && (
                                  <div>
                                    <p className="font-mono text-[10px] font-semibold text-muted-foreground">Buttons ({frame.buttonCount}):</p>
                                    {frame.buttons.map((btn, bi) => (
                                      <code key={bi} className="block font-mono text-[10px] text-muted-foreground pl-2 break-all">{btn}</code>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
