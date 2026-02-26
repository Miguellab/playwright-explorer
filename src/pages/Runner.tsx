import { useState, useEffect, useCallback } from "react";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/StatusBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTestRun, getTestRun, getSettings } from "@/lib/api";
import type { TestRun, RunOptions, AppSettings } from "@/lib/types";
import { Play, ChevronDown, ExternalLink, Loader2, AlertTriangle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function Runner() {
  const { toast } = useToast();
  const [siteUrl, setSiteUrl] = useState("");
  const [headless, setHeadless] = useState(true);
  const [maxRuntime, setMaxRuntime] = useState(60);
  const [ctaSelector, setCtaSelector] = useState("");
  const [successSelector, setSuccessSelector] = useState("");
  const [fallbackPath, setFallbackPath] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [activeRun, setActiveRun] = useState<TestRun | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runnerConfigured, setRunnerConfigured] = useState<boolean | null>(null);

  const isRunActive = activeRun && (activeRun.status === "queued" || activeRun.status === "running");

  // Check runner config on mount
  useEffect(() => {
    getSettings()
      .then((s: AppSettings) => setRunnerConfigured(!!s.external_runner_url))
      .catch(() => setRunnerConfigured(false));
  }, []);

  // Poll for updates while run is active
  useEffect(() => {
    if (!activeRun || !isRunActive) return;
    const interval = setInterval(async () => {
      try {
        const updated = await getTestRun(activeRun.id);
        setActiveRun(updated);
        if (updated.status === "passed" || updated.status === "failed") {
          clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeRun?.id, isRunActive]);

  const handleRun = useCallback(async () => {
    const url = siteUrl.trim();
    if (!url) {
      toast({ title: "URL required", description: "Enter a site URL to test.", variant: "destructive" });
      return;
    }
    if (!url.startsWith("https://") && !url.startsWith("http://localhost")) {
      toast({ title: "Invalid URL", description: "URL must start with https://", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const options: RunOptions = {
        headless,
        maxRuntimeSec: maxRuntime,
        ctaSelector: ctaSelector || null,
        successSelector: successSelector || null,
        fallbackPath: fallbackPath || null,
      };
      const { testRunId } = await createTestRun(url, "smoke_v1", options);
      const run = await getTestRun(testRunId);
      setActiveRun(run);
    } catch (e: unknown) {
      const err = e as Error & { status?: number };
      const msg = err.message || "Unknown error";

      if (msg.includes("Runner busy") || msg.includes("already in progress")) {
        toast({ title: "Runner busy", description: "Try again in a minute.", variant: "destructive" });
      } else if (msg.includes("unreachable") || msg.includes("Runner not configured")) {
        toast({
          title: "Runner unavailable",
          description: "Check your Runner URL in Settings.",
          variant: "destructive",
        });
      } else if (msg.includes("Invalid Runner API key") || msg.includes("Authentication")) {
        toast({
          title: "Auth failed",
          description: "Invalid Runner API key — update it in Settings.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [siteUrl, headless, maxRuntime, ctaSelector, successSelector, fallbackPath, toast]);

  const reportUrl = activeRun?.assets?.reportUrl || activeRun?.report_path;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="container max-w-4xl py-10">
        <h1 className="font-mono text-2xl font-bold">Test Runner</h1>
        <p className="mt-1 text-sm text-muted-foreground">Run a Playwright smoke test against any URL.</p>

        {runnerConfigured === false && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Runner not configured</p>
              <p>Set your Runner Base URL and API Key in{" "}
                <Link to="/settings" className="inline-flex items-center gap-1 text-primary hover:underline">
                  <Settings className="h-3 w-3" /> Settings
                </Link>{" "}
                before running tests.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Config panel */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="siteUrl" className="font-mono text-xs uppercase tracking-wider">Site URL</Label>
              <Input
                id="siteUrl"
                placeholder="https://your-site.lovable.app"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Scenario</Label>
              <div className="rounded-md border bg-secondary/50 px-3 py-2 font-mono text-sm text-secondary-foreground">
                Smoke journey (homepage → CTA → key page)
              </div>
            </div>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                Advanced options
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs">CTA Selector</Label>
                  <Input placeholder='e.g. button:has-text("Get Started")' value={ctaSelector} onChange={(e) => setCtaSelector(e.target.value)} className="font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs">Success Selector</Label>
                  <Input placeholder="e.g. h1" value={successSelector} onChange={(e) => setSuccessSelector(e.target.value)} className="font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs">Fallback Path</Label>
                  <Input placeholder="/about" value={fallbackPath} onChange={(e) => setFallbackPath(e.target.value)} className="font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs">Max Runtime (seconds)</Label>
                  <Input type="number" value={maxRuntime} onChange={(e) => setMaxRuntime(Number(e.target.value))} className="font-mono text-xs w-24" />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={headless} onCheckedChange={setHeadless} />
                  <Label className="font-mono text-xs">Headless mode</Label>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button onClick={handleRun} disabled={isSubmitting || !!isRunActive || runnerConfigured === false} className="font-mono">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Test
            </Button>
          </div>

          {/* Results panel */}
          <div>
            {!activeRun ? (
              <Card className="border-dashed">
                <CardContent className="flex min-h-[300px] items-center justify-center p-6">
                  <p className="text-center font-mono text-sm text-muted-foreground">
                    Run a test to see results here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-mono text-sm">Run Result</CardTitle>
                    <StatusBadge status={activeRun.status} />
                  </div>
                  <p className="font-mono text-xs text-muted-foreground truncate">{activeRun.site_url}</p>
                  {activeRun.duration_ms && (
                    <p className="font-mono text-xs text-muted-foreground">{(activeRun.duration_ms / 1000).toFixed(1)}s</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Steps */}
                  {activeRun.steps && activeRun.steps.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">Steps</p>
                      <div className="space-y-1.5">
                        {activeRun.steps.map((step, i) => (
                          <div key={i} className="flex items-center justify-between rounded border bg-secondary/30 px-3 py-2">
                            <span className="font-mono text-xs">{step.name}</span>
                            <div className="flex items-center gap-2">
                              {step.durationMs > 0 && (
                                <span className="font-mono text-[10px] text-muted-foreground">{step.durationMs}ms</span>
                              )}
                              <StatusBadge status={step.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Findings */}
                  {activeRun.findings && (
                    <div className="flex gap-4">
                      <div className="rounded border bg-secondary/30 px-3 py-2 text-center">
                        <p className="font-mono text-lg font-bold text-status-fail">{activeRun.findings.consoleErrors?.length || 0}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">Console Errors</p>
                      </div>
                      <div className="rounded border bg-secondary/30 px-3 py-2 text-center">
                        <p className="font-mono text-lg font-bold text-status-skipped">{activeRun.findings.failedRequests?.length || 0}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">Failed Requests</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {(activeRun.status === "passed" || activeRun.status === "failed") && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button variant="outline" size="sm" className="font-mono text-xs" asChild>
                        <Link to={`/runs/${activeRun.id}`}>
                          <ExternalLink className="h-3 w-3" /> View Detail
                        </Link>
                      </Button>
                      {reportUrl && (
                        <Button variant="outline" size="sm" className="font-mono text-xs" asChild>
                          <a href={reportUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" /> HTML Report
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
