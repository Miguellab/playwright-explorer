import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppNav } from "@/components/AppNav";
import { StatusBadge } from "@/components/StatusBadge";
import { getTestRun } from "@/lib/api";
import type { TestRun } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

export default function RunDetail() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<TestRun | null>(null);
  const [loading, setLoading] = useState(true);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    if (!id) return;
    getTestRun(id).then(setRun).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

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

        {run.report_path && (
          <Button variant="outline" size="sm" className="mt-4 font-mono text-xs" asChild>
            <a href={`${supabaseUrl}/storage/v1/object/public/test-assets/${run.report_path}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" /> Open HTML Report
            </a>
          </Button>
        )}

        {/* Steps */}
        <Card className="mt-8">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-sm uppercase tracking-wider">Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {run.steps.map((step, i) => (
              <div key={i} className="flex items-center justify-between rounded border bg-secondary/30 px-4 py-3">
                <div>
                  <p className="font-mono text-sm">{step.name}</p>
                  {step.note && <p className="font-mono text-xs text-muted-foreground">{step.note}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{step.durationMs}ms</span>
                  <StatusBadge status={step.status} />
                </div>
              </div>
            ))}
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
              {run.findings.consoleErrors.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-xs font-semibold text-status-fail">Console Errors ({run.findings.consoleErrors.length})</p>
                  {run.findings.consoleErrors.slice(0, 5).map((err, i) => (
                    <div key={i} className="mb-1 rounded border border-status-fail/20 bg-status-fail/5 px-3 py-2">
                      <p className="font-mono text-xs">{err.message}</p>
                      {err.location && <p className="font-mono text-[10px] text-muted-foreground">{err.location}</p>}
                    </div>
                  ))}
                </div>
              )}
              {run.findings.failedRequests.length > 0 && (
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
              {run.findings.consoleErrors.length === 0 && run.findings.failedRequests.length === 0 && (
                <p className="font-mono text-sm text-muted-foreground">No issues found.</p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
