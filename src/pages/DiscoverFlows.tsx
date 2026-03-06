import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { discoverFlows, updateProject, setMainFlow } from "@/lib/sentinelle-api";
import type { SuggestedFlow } from "@/lib/sentinelle-types";
import { Loader2, Search, CheckCircle2, AlertTriangle, Sparkles, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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
  const [mainFlowId, setMainFlowIdState] = useState<string | null>(null);
  const [enabledFlows, setEnabledFlows] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const startedRef = useRef(false);

  useEffect(() => {
    if (phase !== "loading") return;
    const interval = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 8 + 2));
    }, 800);
    return () => clearInterval(interval);
  }, [phase]);

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
        setEnabledFlows(new Set(flowList.map((f) => f.id)));
        // Auto-select highest confidence as main flow
        const sorted = [...flowList].sort((a, b) => b.confidence - a.confidence);
        if (sorted.length > 0) setMainFlowIdState(sorted[0].id);
        setProgress(100);
        setTimeout(() => setPhase("results"), 600);
      })
      .catch((err) => {
        setErrorMsg(err?.message || "Impossible d'analyser le site.");
        setPhase("error");
      });
  };

  useEffect(() => {
    if (!id || startedRef.current) return;
    startDiscovery();
  }, [id]);

  const toggleFlow = (flowId: string) => {
    setEnabledFlows((prev) => {
      const next = new Set(prev);
      if (next.has(flowId)) {
        next.delete(flowId);
        if (mainFlowId === flowId) setMainFlowIdState(null);
      } else {
        next.add(flowId);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!id || !mainFlowId) return;
    setSubmitting(true);
    try {
      const selectedFlows = flows.filter((f) => enabledFlows.has(f.id));
      await updateProject(id, {
        suggestedFlows: flows,
        monitoredFlows: selectedFlows,
      });
      await setMainFlow(id, mainFlowId);
      toast({
        title: "Surveillance configurée",
        description: `${selectedFlows.length} parcours surveillés.`,
      });
      navigate(`/project/${id}`);
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const confidenceLabel = (c: number) => {
    if (c >= 70) return "Élevée";
    if (c >= 40) return "Moyenne";
    return "Faible";
  };

  const confidenceColor = (c: number) => {
    if (c >= 70) return "text-status-safe";
    if (c >= 40) return "text-status-alerte";
    return "text-muted-foreground";
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Loading */}
        {phase === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 text-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-neon/10 flex items-center justify-center">
                  <Search className="h-8 w-8 text-neon animate-pulse" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-neon animate-bounce" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Sentinelle identifie les parcours clés</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  de votre application…
                </p>
              </div>
            </div>
            <div className="space-y-3 max-w-sm mx-auto">
              <Progress value={Math.min(progress, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground animate-pulse">
                {PROGRESS_MESSAGES[messageIdx]}
              </p>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {phase === "error" && (
          <Card className="bg-surface border-border">
            <CardContent className="p-8 text-center space-y-4">
              <AlertTriangle className="h-10 w-10 text-status-erreur mx-auto" />
              <div>
                <p className="text-sm font-semibold">Analyse impossible</p>
                <p className="mt-1 text-xs text-muted-foreground">{errorMsg}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Retour
                </Button>
                <Button onClick={startDiscovery} className="bg-neon text-background hover:bg-neon/90">
                  Réessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {phase === "results" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-status-safe" />
                <h2 className="text-xl font-bold">
                  {flows.length} parcours détecté{flows.length > 1 ? "s" : ""}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Choisissez votre <span className="text-neon font-medium">parcours principal</span> et activez ceux à surveiller.
              </p>
            </div>

            {flows.length === 0 ? (
              <Card className="bg-surface border-border">
                <CardContent className="p-8 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Aucun parcours détecté.
                  </p>
                  <Button onClick={() => navigate(`/project/${id}`)} className="bg-neon text-background hover:bg-neon/90">
                    Continuer
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                  {flows.map((flow) => {
                    const isEnabled = enabledFlows.has(flow.id);
                    const isMain = mainFlowId === flow.id;
                    return (
                      <Card
                        key={flow.id}
                        className={`transition-all border ${
                          isMain
                            ? "border-neon/40 bg-neon/5"
                            : isEnabled
                            ? "border-border bg-surface"
                            : "border-border bg-surface/50 opacity-60"
                        }`}
                      >
                        <CardContent className="flex items-center gap-4 p-4">
                          {/* Main flow radio */}
                          <button
                            type="button"
                            className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isMain ? "border-neon bg-neon" : "border-muted-foreground/40 hover:border-neon/60"
                            }`}
                            onClick={() => {
                              setMainFlowIdState(flow.id);
                              if (!isEnabled) {
                                setEnabledFlows((prev) => new Set(prev).add(flow.id));
                              }
                            }}
                            title="Définir comme parcours principal"
                          >
                            {isMain && <Star className="h-3 w-3 text-background" />}
                          </button>

                          {/* Flow info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate">{flow.labelFr}</p>
                              {isMain && (
                                <span className="text-[10px] font-medium text-neon bg-neon/10 rounded px-1.5 py-0.5">
                                  Principal
                                </span>
                              )}
                            </div>
                            {flow.descriptionFr && (
                              <p className="text-xs text-muted-foreground mt-0.5">{flow.descriptionFr}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-medium ${confidenceColor(flow.confidence)}`}>
                                {Math.round(flow.confidence)}% — {confidenceLabel(flow.confidence)}
                              </span>
                            </div>
                          </div>

                          {/* Enable/Disable toggle */}
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => toggleFlow(flow.id)}
                            className="shrink-0"
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={startDiscovery}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Relancer
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={!mainFlowId || enabledFlows.size === 0 || submitting}
                    className="flex-1 bg-neon text-background hover:bg-neon/90 font-semibold"
                    size="lg"
                  >
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Commencer la surveillance
                  </Button>
                </div>

                {!mainFlowId && (
                  <p className="text-xs text-status-alerte text-center">
                    Sélectionnez un parcours principal pour continuer.
                  </p>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
