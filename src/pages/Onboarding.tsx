import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createProject,
  healthCheck,
  discoverFlows,
  updateProject,
  DEFAULT_RUNNER_URL,
  DEFAULT_RUNNER_KEY,
} from "@/lib/sentinelle-api";
import type { OnboardingData, SuggestedFlow } from "@/lib/sentinelle-types";
import {
  Globe,
  Target,
  Eye,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Search,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { icon: Globe, label: "Application" },
  { icon: Target, label: "Objectifs" },
  { icon: Eye, label: "Surveillance" },
];

const PROGRESS_MESSAGES = [
  "Chargement de la page d'accueil…",
  "Détection des liens et boutons…",
  "Analyse des formulaires…",
  "Exploration des parcours utilisateur…",
  "Évaluation des objectifs business…",
  "Finalisation de l'analyse…",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 0
  const [siteUrl, setSiteUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [checkingApi, setCheckingApi] = useState(false);

  // Step 1 — Discovery
  const [projectId, setProjectId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "results" | "error">("loading");
  const [flows, setFlows] = useState<SuggestedFlow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [visionError, setVisionError] = useState<string | undefined>();
  const discoveryStarted = useRef(false);

  // Surveillance
  const [data, setData] = useState<OnboardingData>({
    siteUrl: "",
    name: "",
    checkFrequencyMin: 5,
    maxRunsPerDay: 10,
    autoTest: true,
  });

  const selectedFlows = useMemo(() => flows.filter((f) => selected.has(f.id)), [flows, selected]);

  useEffect(() => {
    setCheckingApi(true);
    healthCheck()
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false))
      .finally(() => setCheckingApi(false));
  }, []);

  // Simulated progress for discovery
  useEffect(() => {
    if (step !== 1 || phase !== "loading") return;
    const interval = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 8 + 2));
    }, 800);
    return () => clearInterval(interval);
  }, [step, phase]);

  useEffect(() => {
    if (step !== 1 || phase !== "loading") return;
    const interval = setInterval(() => {
      setMessageIdx((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [step, phase]);

  const canNextStep0 = siteUrl.startsWith("https://") && projectName.trim().length > 0;

  const startDiscovery = (pid: string) => {
    discoveryStarted.current = true;
    setPhase("loading");
    setProgress(0);
    setMessageIdx(0);

    discoverFlows(pid)
      .then((result) => {
        const flowList = result.flows;
        setFlows(flowList);
        setVisionError(result.visionError);
        const preSelected = new Set(
          flowList.filter((f) => f.confidence >= 50).map((f) => f.id)
        );
        setSelected(preSelected);
        setProgress(100);
        setTimeout(() => setPhase("results"), 600);
      })
      .catch((err) => {
        setErrorMsg(err?.message || "Impossible d'analyser le site.");
        setPhase("error");
      });
  };

  const handleStep0Next = async () => {
    setSubmitting(true);
    try {
      const project = await createProject({
        name: projectName.trim(),
        siteUrl: siteUrl.trim(),
        checkFrequencyMin: data.checkFrequencyMin,
        maxRunsPerDay: data.maxRunsPerDay,
        runnerBaseUrl: DEFAULT_RUNNER_URL,
        runnerApiKey: DEFAULT_RUNNER_KEY,
      });
      setProjectId(project.id);
      setStep(1);
      startDiscovery(project.id);
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFlow = (flowId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(flowId)) next.delete(flowId);
      else next.add(flowId);
      return next;
    });
  };

  const confidenceColor = (c: number) => {
    if (c >= 70) return "text-status-pass";
    if (c >= 40) return "text-status-skipped";
    return "text-muted-foreground";
  };

  const confidenceLabel = (c: number) => {
    if (c >= 70) return "Confiance élevée";
    if (c >= 40) return "Confiance moyenne";
    return "Confiance faible";
  };

  const handleFinalSubmit = async () => {
    if (!projectId) return;
    setSubmitting(true);
    try {
      const primaryGoal = selectedFlows[0]?.goal;
      await updateProject(projectId, {
        goal: primaryGoal || undefined,
        suggestedFlows: flows,
        monitoredFlows: selectedFlows,
        checkFrequencyMin: data.checkFrequencyMin,
        maxRunsPerDay: data.maxRunsPerDay,
      });
      toast({ title: "Projet configuré", description: "La surveillance est active." });
      navigate(`/project/${projectId}`);
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-8">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step;
              const done = i < step;
              return (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && (
                    <div className={`h-px w-8 ${done ? "bg-primary" : "bg-border"}`} />
                  )}
                  <div
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-mono transition-colors ${
                      active
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : done
                        ? "bg-status-pass/15 text-status-pass border border-status-pass/30"
                        : "bg-secondary text-muted-foreground border border-border"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── Step 0: Application ─── */}
          {step === 0 && (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="font-mono text-xl font-bold">Connectez votre application</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Collez l'URL de votre site pour commencer la surveillance.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-xs">Nom du projet</Label>
                    <Input
                      placeholder="Mon application"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-xs">URL du site</Label>
                    <Input
                      placeholder="https://mon-app.lovable.app"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      className="font-mono text-sm"
                    />
                    {siteUrl && !siteUrl.startsWith("https://") && (
                      <p className="text-xs text-status-fail font-mono">L'URL doit commencer par https://</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    {checkingApi ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground">Connexion au service...</span>
                      </>
                    ) : apiConnected ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-status-pass" />
                        <span className="text-status-pass">Service Sentinelle connecté</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 text-status-fail" />
                        <span className="text-status-fail">Service inaccessible</span>
                      </>
                    )}
                  </div>
                </div>

                <Button onClick={handleStep0Next} disabled={!canNextStep0 || submitting} className="w-full font-mono">
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Continuer <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ─── Step 1: Objectifs (Discovery) ─── */}
          {step === 1 && (
            <div className="space-y-6">
              {phase === "loading" && (
                <div className="space-y-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Search className="h-8 w-8 text-primary animate-pulse" />
                      </div>
                      <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-primary animate-bounce" />
                    </div>
                    <div>
                      <h2 className="font-mono text-xl font-bold">Analyse en cours</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Sentinelle explore votre site pour détecter les parcours utilisateur…
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 max-w-sm mx-auto">
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                    <p className="font-mono text-xs text-muted-foreground animate-pulse">
                      {PROGRESS_MESSAGES[messageIdx]}
                    </p>
                  </div>
                </div>
              )}

              {phase === "error" && (
                <Card>
                  <CardContent className="p-8 text-center space-y-4">
                    <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
                    <div>
                      <p className="font-mono text-sm font-semibold">Analyse impossible</p>
                      <p className="mt-1 text-xs text-muted-foreground">{errorMsg}</p>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" className="font-mono" onClick={() => setStep(0)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                      </Button>
                      <Button className="font-mono" onClick={() => projectId && startDiscovery(projectId)}>
                        Réessayer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {phase === "results" && (
                <>
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-status-pass" />
                      <h2 className="font-mono text-xl font-bold">
                        {flows.length} parcours détecté{flows.length > 1 ? "s" : ""}
                      </h2>
                      {!visionError && flows.length > 0 && (
                        <Badge className="bg-status-pass/15 text-status-pass border-status-pass/30 font-mono text-[10px]">
                          <Sparkles className="mr-1 h-3 w-3" /> Analyse IA
                        </Badge>
                      )}
                    </div>
                    {visionError && (
                      <div className="flex items-center gap-2 rounded-md bg-status-pending/10 border border-status-pending/30 px-3 py-2 mx-auto max-w-md">
                        <AlertTriangle className="h-3.5 w-3.5 text-status-pending shrink-0" />
                        <p className="font-mono text-xs text-status-pending text-left">{visionError}</p>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Sélectionnez les parcours que vous souhaitez surveiller.
                    </p>
                  </div>

                  {flows.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center space-y-3">
                        <p className="font-mono text-sm text-muted-foreground">
                          Aucun parcours détecté. Vous pourrez configurer les objectifs manuellement.
                        </p>
                        <Button className="font-mono" onClick={() => setStep(SURVEILLANCE_STEP)}>
                          Continuer <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {flows.map((flow) => {
                          const isSelected = selected.has(flow.id);
                          return (
                            <Card
                              key={flow.id}
                              className={`cursor-pointer transition-all ${
                                isSelected
                                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                                  : "hover:bg-secondary/30"
                              }`}
                              onClick={() => toggleFlow(flow.id)}
                            >
                              <CardContent className="flex items-start gap-4 p-5">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleFlow(flow.id)}
                                  className="mt-1 shrink-0"
                                />
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm font-semibold">{flow.labelFr}</p>
                                    <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                                      {flow.goal}
                                    </Badge>
                                    {flow.requiresCredentials && (
                                      <Badge variant="outline" className="font-mono text-[10px] shrink-0 border-status-pending/50 text-status-pending">
                                        <Lock className="mr-0.5 h-2.5 w-2.5" /> Auth
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{flow.descriptionFr}</p>
                                  {flow.ctaText && (
                                    <p className="font-mono text-xs bg-secondary/50 rounded px-2 py-1 inline-block">
                                      CTA: {flow.ctaText}
                                    </p>
                                  )}
                                  {flow.evidence?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {flow.evidence.slice(0, 3).map((e, i) => (
                                        <Badge key={i} variant="secondary" className="font-mono text-[10px]">
                                          {e}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  {flow.pagePath && (
                                    <p className="font-mono text-[10px] text-muted-foreground">📄 {flow.pagePath}</p>
                                  )}
                                </div>
                                <div className="shrink-0 text-right space-y-1">
                                  <p className={`font-mono text-sm font-bold ${confidenceColor(flow.confidence)}`}>
                                    {Math.round(flow.confidence)}%
                                  </p>
                                  <p className={`font-mono text-[10px] ${confidenceColor(flow.confidence)}`}>
                                    {confidenceLabel(flow.confidence)}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => projectId && startDiscovery(projectId)}
                          className="font-mono"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Relancer
                        </Button>
                        <Button
                          onClick={() => setStep(hasAuthFlows ? CREDENTIALS_STEP : SURVEILLANCE_STEP)}
                          disabled={selected.size === 0}
                          className="flex-1 font-mono"
                        >
                          Continuer avec {selected.size} parcours
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── Step 2: Identifiants (conditional) ─── */}
          {step === CREDENTIALS_STEP && hasAuthFlows && (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="font-mono text-xl font-bold">Identifiants de test</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Configurez les identifiants nécessaires pour tester vos parcours d'authentification.
                  </p>
                </div>

                <div className="space-y-5">
                  {authFlows.map((flow) => (
                    <div key={flow.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-semibold">{flow.labelFr}</p>
                        <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                          {flow.goal}
                        </Badge>
                      </div>
                      <FlowCredentialsForm
                        flow={flow}
                        onSave={async (flowId, creds) => {
                          await saveFlowCredentials(projectId!, flowId, creds);
                          setFlows((prev) =>
                            prev.map((f) =>
                              f.id === flowId ? { ...f, credentials: creds, hasCredentials: true } : f
                            )
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-dashed p-3">
                  <p className="text-xs text-muted-foreground">
                    Vous pouvez aussi configurer les identifiants plus tard. Sans identifiants, le test vérifiera uniquement que la page de connexion se charge correctement.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="font-mono">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                  </Button>
                  <Button
                    onClick={() => setStep(SURVEILLANCE_STEP)}
                    className="flex-1 font-mono"
                  >
                    Continuer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Step: Surveillance ─── */}
          {step === SURVEILLANCE_STEP && (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="font-mono text-xl font-bold">Surveillance</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Configurez la fréquence de surveillance pour les {selected.size} parcours sélectionnés.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-mono text-sm font-semibold">Test automatique</p>
                      <p className="text-xs text-muted-foreground">
                        Sentinelle détecte les changements automatiquement
                      </p>
                    </div>
                    <Switch
                      checked={data.autoTest}
                      onCheckedChange={(v) => setData(prev => ({ ...prev, autoTest: v }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-xs">Fréquence de vérification</Label>
                    <Select
                      value={String(data.checkFrequencyMin)}
                      onValueChange={(v) => setData(prev => ({ ...prev, checkFrequencyMin: Number(v) }))}
                    >
                      <SelectTrigger className="font-mono text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5" className="font-mono">Toutes les 5 minutes</SelectItem>
                        <SelectItem value="15" className="font-mono">Toutes les 15 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-xs">Maximum de tests par jour</Label>
                    <Input
                      type="number"
                      value={data.maxRunsPerDay}
                      onChange={(e) => setData(prev => ({ ...prev, maxRunsPerDay: Number(e.target.value) }))}
                      className="font-mono text-sm w-24"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-dashed p-3 space-y-1.5">
                  <p className="text-xs text-muted-foreground">• Sentinelle vérifie votre site à la fréquence choisie</p>
                  <p className="text-xs text-muted-foreground">• Un test est lancé automatiquement si un changement est détecté</p>
                  <p className="text-xs text-muted-foreground">• Le maximum de tests par jour évite de surcharger le système</p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(hasAuthFlows ? CREDENTIALS_STEP : 1)} className="font-mono">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                  </Button>
                  <Button onClick={handleFinalSubmit} disabled={submitting} className="flex-1 font-mono">
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="mr-2 h-4 w-4" />
                    )}
                    Lancer la surveillance
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
