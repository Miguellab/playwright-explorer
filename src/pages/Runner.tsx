import { useState, useEffect, useCallback } from "react";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTestRun, getTestRun, getSettings } from "@/lib/api";
import type { TestRun, RunOptions, AppSettings, CustomStep, FormField } from "@/lib/types";
import { Play, ChevronDown, ChevronRight, ExternalLink, Loader2, AlertTriangle, Settings, Plus, Trash2, Bug, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

// ── Scenario definitions ──

const SCENARIOS = [
  { id: "smoke_v1", name: "Smoke Test", description: "Homepage → CTA → key page" },
  { id: "login_flow", name: "Login Flow", description: "Navigate to login, fill credentials, verify success" },
  { id: "navigation_check", name: "Navigation Check", description: "Visit multiple paths, assert elements" },
  { id: "form_submission", name: "Form Submission", description: "Fill and submit a form" },
  { id: "responsive_check", name: "Responsive Check", description: "Check pages across viewports" },
  { id: "performance_audit", name: "Performance Audit", description: "Measure load time and FCP" },
  { id: "custom", name: "Custom Scenario", description: "Build your own with block actions" },
] as const;

const BLOCK_ACTIONS = [
  "navigate", "click", "fill", "screenshot", "assert_visible", "assert_text",
  "assert_url", "wait", "set_viewport", "hover", "press", "select",
  "check", "check_console", "check_network", "measure_performance",
] as const;

const BLOCK_PARAM_HINTS: Record<string, string[]> = {
  navigate: ["url"],
  click: ["selector"],
  fill: ["selector", "value"],
  screenshot: ["label"],
  assert_visible: ["selector"],
  assert_text: ["selector", "text"],
  assert_url: ["pattern"],
  wait: ["ms"],
  set_viewport: ["width", "height"],
  hover: ["selector"],
  press: ["key"],
  select: ["selector", "value"],
  check: ["selector"],
  check_console: [],
  check_network: [],
  measure_performance: [],
};

// ── Component ──

export default function Runner() {
  const { toast } = useToast();

  // URL & scenario
  const [siteUrl, setSiteUrl] = useState("");
  const [scenarioId, setScenarioId] = useState("smoke_v1");

  // Runtime options
  const [headless, setHeadless] = useState(true);
  const [maxRuntime, setMaxRuntime] = useState(60);
  const [runtimeOpen, setRuntimeOpen] = useState(false);

  // smoke_v1 options
  const [ctaSelector, setCtaSelector] = useState("");
  const [successSelector, setSuccessSelector] = useState("");
  const [fallbackPath, setFallbackPath] = useState("");

  // login_flow options
  const [loginPath, setLoginPath] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successUrl, setSuccessUrl] = useState("");

  // navigation_check / responsive_check / performance_audit
  const [paths, setPaths] = useState("");
  const [assertSelector, setAssertSelector] = useState("");

  // form_submission
  const [formPath, setFormPath] = useState("");
  const [formFields, setFormFields] = useState<FormField[]>([{ selector: "", value: "" }]);
  const [formSubmitSelector, setFormSubmitSelector] = useState("");
  const [formSuccessSelector, setFormSuccessSelector] = useState("");

  // performance_audit thresholds
  const [maxLoadTime, setMaxLoadTime] = useState(5000);
  const [maxFCP, setMaxFCP] = useState(2000);

  // custom steps
  const [customSteps, setCustomSteps] = useState<CustomStep[]>([]);

  // Run state
  const [activeRun, setActiveRun] = useState<TestRun | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runnerConfigured, setRunnerConfigured] = useState<boolean | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const isRunActive = activeRun && (activeRun.status === "queued" || activeRun.status === "running");

  const toggleStep = (index: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

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

  // ── Build options from state ──

  const buildOptions = useCallback((): RunOptions => {
    const base: RunOptions = { headless, maxRuntimeSec: maxRuntime };

    switch (scenarioId) {
      case "smoke_v1":
        return { ...base, ctaSelector: ctaSelector || null, successSelector: successSelector || null, fallbackPath: fallbackPath || null };
      case "login_flow":
        return { ...base, loginPath: loginPath || undefined, email, password, successUrl: successUrl || undefined };
      case "navigation_check":
        return { ...base, paths: paths.split("\n").map(p => p.trim()).filter(Boolean), assertSelector: assertSelector || undefined };
      case "form_submission":
        return { ...base, formPath, fields: formFields.filter(f => f.selector), submitSelector: formSubmitSelector || undefined, successSelector: formSuccessSelector || null };
      case "responsive_check":
        return { ...base, paths: paths.split("\n").map(p => p.trim()).filter(Boolean) };
      case "performance_audit":
        return { ...base, paths: paths.split("\n").map(p => p.trim()).filter(Boolean), thresholds: { maxLoadTime, maxFCP } };
      default:
        return base;
    }
  }, [scenarioId, headless, maxRuntime, ctaSelector, successSelector, fallbackPath, loginPath, email, password, successUrl, paths, assertSelector, formPath, formFields, formSubmitSelector, formSuccessSelector, maxLoadTime, maxFCP]);

  // ── Submit ──

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
    if (scenarioId === "custom" && customSteps.length === 0) {
      toast({ title: "No steps", description: "Add at least one block to your custom scenario.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const options = buildOptions();
      const steps = scenarioId === "custom" ? customSteps : undefined;
      const { testRunId } = await createTestRun(url, scenarioId, options, steps);
      const run = await getTestRun(testRunId);
      setExpandedSteps(new Set());
      setActiveRun(run);
    } catch (e: unknown) {
      const err = e as Error & { status?: number };
      const msg = err.message || "Unknown error";

      if (msg.includes("Runner busy") || msg.includes("already in progress")) {
        toast({ title: "Runner busy", description: "Try again in a minute.", variant: "destructive" });
      } else if (msg.includes("unreachable") || msg.includes("Runner not configured")) {
        toast({ title: "Runner unavailable", description: "Check your Runner URL in Settings.", variant: "destructive" });
      } else if (msg.includes("Invalid Runner API key") || msg.includes("Authentication")) {
        toast({ title: "Auth failed", description: "Invalid Runner API key — update it in Settings.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [siteUrl, scenarioId, customSteps, buildOptions, toast]);

  // ── Custom step helpers ──

  const addCustomStep = (action: string) => {
    const params: Record<string, unknown> = {};
    for (const p of BLOCK_PARAM_HINTS[action] || []) {
      params[p] = "";
    }
    setCustomSteps(prev => [...prev, { action, params }]);
  };

  const removeCustomStep = (index: number) => {
    setCustomSteps(prev => prev.filter((_, i) => i !== index));
  };

  const updateStepParam = (index: number, key: string, value: unknown) => {
    setCustomSteps(prev => prev.map((s, i) => i === index ? { ...s, params: { ...s.params, [key]: value } } : s));
  };

  // ── Form field helpers ──

  const addFormField = () => setFormFields(prev => [...prev, { selector: "", value: "" }]);
  const removeFormField = (index: number) => setFormFields(prev => prev.filter((_, i) => i !== index));
  const updateFormField = (index: number, key: keyof FormField, value: string) => {
    setFormFields(prev => prev.map((f, i) => i === index ? { ...f, [key]: value } : f));
  };

  // ── Scenario options panel ──

  const renderScenarioOptions = () => {
    switch (scenarioId) {
      case "smoke_v1":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="font-mono text-xs">CTA Selector</Label>
              <Input placeholder='e.g. button:has-text("Get Started")' value={ctaSelector} onChange={(e) => setCtaSelector(e.target.value)} className="font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-xs">Success Selector</Label>
              <Input placeholder="e.g. h1" value={successSelector} onChange={(e) => setSuccessSelector(e.target.value)} className="font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-xs">Fallback Path</Label>
              <Input placeholder="/about" value={fallbackPath} onChange={(e) => setFallbackPath(e.target.value)} className="font-mono text-xs" />
            </div>
          </div>
        );

      case "login_flow":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="font-mono text-xs">Login Path (optional)</Label>
              <Input placeholder="/login (leave empty for site URL)" value={loginPath} onChange={(e) => setLoginPath(e.target.value)} className="font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-xs">Email</Label>
              <Input placeholder="test@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-xs">Password</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-xs">Success URL (contains)</Label>
              <Input placeholder="/dashboard" value={successUrl} onChange={(e) => setSuccessUrl(e.target.value)} className="font-mono text-xs" />
            </div>
          </div>
        );

      case "navigation_check":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="font-mono text-xs">Paths (one per line)</Label>
              <Textarea placeholder={"/about\n/pricing\n/docs"} value={paths} onChange={(e) => setPaths(e.target.value)} className="font-mono text-xs" rows={4} />
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-xs">Assert Selector</Label>
              <Input placeholder="e.g. main, h1" value={assertSelector} onChange={(e) => setAssertSelector(e.target.value)} className="font-mono text-xs" />
            </div>
          </div>
        );

      case "form_submission":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="font-mono text-xs">Form Path</Label>
              <Input placeholder="/contact" value={formPath} onChange={(e) => setFormPath(e.target.value)} className="font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-xs">Fields</Label>
              <div className="space-y-2">
                {formFields.map((field, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input placeholder="selector" value={field.selector} onChange={(e) => updateFormField(i, "selector", e.target.value)} className="font-mono text-xs flex-1" />
                    <Input placeholder="value" value={field.value} onChange={(e) => updateFormField(i, "value", e.target.value)} className="font-mono text-xs flex-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeFormField(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="font-mono text-xs" onClick={addFormField}>
                  <Plus className="h-3 w-3" /> Add Field
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-xs">Submit Selector</Label>
              <Input placeholder='button[type="submit"]' value={formSubmitSelector} onChange={(e) => setFormSubmitSelector(e.target.value)} className="font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-xs">Success Selector</Label>
              <Input placeholder=".success-message" value={formSuccessSelector} onChange={(e) => setFormSuccessSelector(e.target.value)} className="font-mono text-xs" />
            </div>
          </div>
        );

      case "responsive_check":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="font-mono text-xs">Paths (one per line)</Label>
              <Textarea placeholder={"/\n/about\n/pricing"} value={paths} onChange={(e) => setPaths(e.target.value)} className="font-mono text-xs" rows={4} />
            </div>
          </div>
        );

      case "performance_audit":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="font-mono text-xs">Paths (one per line)</Label>
              <Textarea placeholder={"/\n/about"} value={paths} onChange={(e) => setPaths(e.target.value)} className="font-mono text-xs" rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-mono text-xs">Max Load Time (ms)</Label>
                <Input type="number" value={maxLoadTime} onChange={(e) => setMaxLoadTime(Number(e.target.value))} className="font-mono text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="font-mono text-xs">Max FCP (ms)</Label>
                <Input type="number" value={maxFCP} onChange={(e) => setMaxFCP(Number(e.target.value))} className="font-mono text-xs" />
              </div>
            </div>
          </div>
        );

      case "custom":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="font-mono text-xs">Steps</Label>
              {customSteps.length === 0 && (
                <p className="text-xs text-muted-foreground">No steps yet. Add a block below.</p>
              )}
              <div className="space-y-2">
                {customSteps.map((step, i) => (
                  <div key={i} className="rounded border bg-secondary/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold">{i + 1}. {step.action}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCustomStep(i)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {Object.keys(step.params).map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="font-mono text-[10px] w-16 shrink-0 text-muted-foreground">{key}</Label>
                        <Input
                          value={String(step.params[key] ?? "")}
                          onChange={(e) => updateStepParam(i, key, e.target.value)}
                          className="font-mono text-xs h-7"
                          placeholder={key}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-xs">Add Block</Label>
              <Select onValueChange={(v) => addCustomStep(v)}>
                <SelectTrigger className="font-mono text-xs">
                  <SelectValue placeholder="Choose an action..." />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_ACTIONS.map((action) => (
                    <SelectItem key={action} value={action} className="font-mono text-xs">
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentScenario = SCENARIOS.find(s => s.id === scenarioId);
  const reportUrl = activeRun?.assets?.reportUrl || activeRun?.report_path;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="container max-w-4xl py-10">
        <h1 className="font-mono text-2xl font-bold">Test Runner</h1>
        <p className="mt-1 text-sm text-muted-foreground">Run Playwright tests against any URL.</p>

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
            {/* Site URL */}
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

            {/* Scenario selector */}
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Scenario</Label>
              <Select value={scenarioId} onValueChange={setScenarioId}>
                <SelectTrigger className="font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCENARIOS.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="font-mono text-sm">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentScenario && (
                <p className="text-xs text-muted-foreground">{currentScenario.description}</p>
              )}
            </div>

            {/* Dynamic scenario options */}
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Scenario Options</Label>
              {renderScenarioOptions()}
            </div>

            {/* Runtime options (collapsible) */}
            <Collapsible open={runtimeOpen} onOpenChange={setRuntimeOpen}>
              <CollapsibleTrigger className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className={`h-4 w-4 transition-transform ${runtimeOpen ? "rotate-180" : ""}`} />
                Runtime options
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
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
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Scenario: {SCENARIOS.find(s => s.id === activeRun.scenario_id)?.name || activeRun.scenario_id}
                  </p>
                  {activeRun.duration_ms && (
                    <p className="font-mono text-xs text-muted-foreground">{(activeRun.duration_ms / 1000).toFixed(1)}s</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Error banner */}
                  {activeRun.status === "failed" && activeRun.error && (
                    <div className="flex items-start gap-2 rounded-lg border border-status-fail/30 bg-status-fail/5 p-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-fail" />
                      <p className="font-mono text-xs text-status-fail whitespace-pre-wrap">{activeRun.error}</p>
                    </div>
                  )}

                  {/* Steps (expandable) */}
                  {activeRun.steps && activeRun.steps.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">Steps</p>
                      <div className="space-y-1.5">
                        {activeRun.steps.map((step, i) => {
                          const isExpanded = expandedSteps.has(i);
                          const hasDetail = !!step.detail;
                          return (
                            <div key={i} className="rounded border bg-secondary/30 overflow-hidden">
                              <button
                                type="button"
                                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-secondary/50 transition-colors"
                                onClick={() => hasDetail && toggleStep(i)}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {hasDetail ? (
                                    isExpanded ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  ) : (
                                    <span className="w-3 shrink-0" />
                                  )}
                                  <span className="font-mono text-xs truncate">{step.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  {step.durationMs > 0 && (
                                    <span className="font-mono text-[10px] text-muted-foreground">{step.durationMs}ms</span>
                                  )}
                                  <StatusBadge status={step.status} />
                                </div>
                              </button>
                              {isExpanded && step.detail && (
                                <div className="border-t bg-secondary/10 px-3 py-2">
                                  <pre className="font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-words">{step.detail}</pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Findings counters */}
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

                  {/* Diagnostics */}
                  {activeRun.findings?.diagnostics && activeRun.findings.diagnostics.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Search className="h-3 w-3" /> Diagnostics
                      </p>
                      <div className="space-y-2">
                        {activeRun.findings.diagnostics.map((diag, i) => (
                          <div key={i} className="rounded border bg-secondary/20 p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              {diag.error ? <Bug className="h-3 w-3 shrink-0 text-status-fail" /> : <Search className="h-3 w-3 shrink-0 text-muted-foreground" />}
                              <span className="font-mono text-xs font-semibold">{diag.step}</span>
                              {diag.type && <span className="font-mono text-[10px] text-muted-foreground">({diag.type})</span>}
                            </div>
                            {diag.error && (
                              <pre className="font-mono text-[11px] text-status-fail whitespace-pre-wrap break-words rounded bg-status-fail/5 border border-status-fail/20 p-2">{diag.error}</pre>
                            )}
                            {diag.type === "page_audit" && (
                              <div className="space-y-1">
                                {diag.url && <p className="font-mono text-[10px] text-muted-foreground truncate">URL: {diag.url}</p>}
                                {diag.title && <p className="font-mono text-[10px] text-muted-foreground">Title: {diag.title}</p>}
                                {diag.frames && diag.frames.map((frame, fi) => (
                                  <div key={fi} className="rounded border bg-secondary/30 p-2 space-y-1">
                                    <p className="font-mono text-[10px] text-muted-foreground truncate">Frame: {frame.url}</p>
                                    {frame.inputs.length > 0 && (
                                      <div>
                                        <p className="font-mono text-[10px] font-semibold text-muted-foreground">Inputs ({frame.inputCount}):</p>
                                        {frame.inputs.map((inp, ii) => (
                                          <code key={ii} className="block font-mono text-[10px] text-muted-foreground truncate pl-2">{inp}</code>
                                        ))}
                                      </div>
                                    )}
                                    {frame.buttons.length > 0 && (
                                      <div>
                                        <p className="font-mono text-[10px] font-semibold text-muted-foreground">Buttons ({frame.buttonCount}):</p>
                                        {frame.buttons.map((btn, bi) => (
                                          <code key={bi} className="block font-mono text-[10px] text-muted-foreground truncate pl-2">{btn}</code>
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
