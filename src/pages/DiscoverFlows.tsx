import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { discoverFlows, updateProject } from "@/lib/sentinelle-api";
import type { SuggestedFlow } from "@/lib/sentinelle-types";
import { Loader2, Search, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PROGRESS_MESSAGES = [
  "Chargement de la page d'accueil…",
  "Détection des liens et boutons…",
  "Analyse des formulaires…",
  "Exploration des parcours utilisateur…",
  "Évaluation des objectifs business…",
  "Finalisation de l'analyse…",
];

export default function DiscoverFlows() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [phase, setPhase] = useState<"loading" | "results" | "error">("loading");
  const [flows, setFlows] = useState<SuggestedFlow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [visionError, setVisionError] = useState<string | undefined>();
  const startedRef = useRef(false);

  // Simulated progress
  useEffect(() => {
    if (phase !== "loading") return;
    const interval = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 8 + 2));
    }, 800);
    return () => clearInterval(interval);
  }, [phase]);

  // Cycle messages
  useEffect(() => {
    if (phase !== "loading") return;
    const interval = setInterval(() => {
      setMessageIdx((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [phase]);

  const startDiscovery = () => {
    if (!id) return;
    startedRef.current = true;
    setPhase("loading");
    setProgress(0);
    setMessageIdx(0);

    discoverFlows(id)
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

  // Initial API call
  useEffect(() => {
    if (!id || startedRef.current) return;
    startDiscovery();
  }, [id]);

  const toggleFlow = (flowId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(flowId)) next.delete(flowId);
      else next.add(flowId);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!id || selected.size === 0) return;
    setSubmitting(true);
    try {
      const selectedFlows = flows.filter((f) => selected.has(f.id));
      const primaryGoal = selectedFlows[0]?.goal;
      await updateProject(id, {
        goal: primaryGoal || undefined,
        suggestedFlows: flows,
        monitoredFlows: selectedFlows,
      });
      toast({ title: "Parcours confirmés", description: "La surveillance est configurée." });
      navigate(`/project/${id}`);
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
          {/* Loading */}
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

          {/* Error */}
          {phase === "error" && (
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
                <div>
                  <p className="font-mono text-sm font-semibold">Analyse impossible</p>
                  <p className="mt-1 text-xs text-muted-foreground">{errorMsg}</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" className="font-mono" onClick={() => navigate(-1)}>
                    Retour
                  </Button>
                  <Button className="font-mono" onClick={startDiscovery}>
                    Réessayer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {phase === "results" && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-status-pass" />
                  <h2 className="font-mono text-xl font-bold">
                    {flows.length} parcours détecté{flows.length > 1 ? "s" : ""}
                  </h2>
                </div>
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
                    <Button className="font-mono" onClick={() => navigate(`/project/${id}`)}>
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
                      onClick={startDiscovery}
                      className="font-mono"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Relancer la découverte
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={selected.size === 0 || submitting}
                      className="flex-1 font-mono"
                      size="lg"
                    >
                      {submitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Surveiller {selected.size} parcours sélectionné{selected.size > 1 ? "s" : ""}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
