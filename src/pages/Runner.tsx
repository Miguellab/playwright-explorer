import { useState, useEffect, useCallback } from "react";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/StatusBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTestRun, getTestRun } from "@/lib/api";
import type { TestRun, RunOptions } from "@/lib/types";
import { Play, ChevronDown, ExternalLink, Download, ImageIcon, Loader2 } from "lucide-react";
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

  const isRunActive = activeRun && (activeRun.status === "queued" || activeRun.status === "running");

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

  const handleRun = useCallback(async (demoMode = false) => {
    const url = demoMode ? "https://lovable.dev" : siteUrl.trim();
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
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [siteUrl, headless, maxRuntime, ctaSelector, successSelector, fallbackPath, toast]);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="container max-w-4xl py-10">
        <h1 className="font-mono text-2xl font-bold">Test Runner</h1>
        <p className="mt-1 text-sm text-muted-foreground">Run a Playwright smoke test against any URL.</p>

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

            <div className="flex gap-3">
              <Button onClick={() => handleRun(false)} disabled={isSubmitting || !!isRunActive} className="font-mono">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run Test
              </Button>
              <Button variant="secondary" onClick={() => handleRun(true)} disabled={isSubmitting || !!isRunActive} className="font-mono">
                Run Demo Test
              </Button>
            </div>
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
                      {activeRun.report_path && (
                        <Button variant="outline" size="sm" className="font-mono text-xs" asChild>
                          <a href={`${supabaseUrl}/storage/v1/object/public/test-assets/${activeRun.report_path}`} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-3 w-3" /> HTML Report
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

function FileText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
    </svg>
  );
}
