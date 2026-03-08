import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  discoverAuthenticatedFlows,
  updateProject,
  setMainFlow as apiSetMainFlow,
} from "@/lib/sentinelle-api";
import type { SuggestedFlow, Project } from "@/lib/sentinelle-types";
import {
  Lock,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type AuthPhase = "idle" | "discovering" | "results" | "error";

const DISCOVERY_MESSAGES = [
  "Connexion en cours…",
  "Navigation dans l'application…",
  "Analyse des pages internes…",
  "Identification des parcours clés…",
];

interface AuthenticatedZoneProps {
  projectId: string;
  project: Project;
  onProjectUpdated: () => void;
}

export function AuthenticatedZone({ projectId, project, onProjectUpdated }: AuthenticatedZoneProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [hasAuthCredentials, setHasAuthCredentials] = useState(false);
  const [checkingCredentials, setCheckingCredentials] = useState(true);
  const [authPhase, setAuthPhase] = useState<AuthPhase>("idle");
  const [authFlows, setAuthFlows] = useState<SuggestedFlow[]>([]);
  const [enabledAuthFlows, setEnabledAuthFlows] = useState<Set<string>>(new Set());
  const [authMainFlowId, setAuthMainFlowId] = useState<string | null>(null);
  const [discoveryMsgIndex, setDiscoveryMsgIndex] = useState(0);
  const [authError, setAuthError] = useState("");

  // Check if LOGIN flow has credentials from project data
  useEffect(() => {
    const allFlows = [
      ...(project.monitoredFlows ?? []),
      ...(project.suggestedFlows ?? []),
    ];
    const hasLogin = allFlows.some(
      (f) => f.goal === "LOGIN" && f.hasCredentials
    );
    setHasAuthCredentials(hasLogin);
    setCheckingCredentials(false);
  }, [project]);

  // Rotate discovery messages
  useEffect(() => {
    if (authPhase !== "discovering") return;
    setDiscoveryMsgIndex(0);
    const interval = setInterval(() => {
      setDiscoveryMsgIndex((i) => (i + 1) % DISCOVERY_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [authPhase]);

  const startAuthDiscovery = useCallback(async () => {
    setAuthPhase("discovering");
    setAuthError("");
    try {
      const res = await discoverAuthenticatedFlows(projectId);
      if (!res.loginSuccess) {
        setAuthPhase("error");
        setAuthError("La connexion a échoué. Vérifiez les identifiants configurés.");
        return;
      }
      setAuthFlows(res.flows);
      const allIds = new Set(res.flows.map((f) => f.id));
      setEnabledAuthFlows(allIds);
      setAuthMainFlowId(res.flows[0]?.id ?? null);
      setAuthPhase("results");
      toast({
        title: "Parcours internes détectés",
        description: `${res.flows.length} parcours identifiés avec succès.`,
      });
    } catch (e: unknown) {
      const err = e as Error & { status?: number };
      setAuthPhase("error");
      setAuthError(err.message || "Une erreur est survenue.");
    }
  }, [projectId, toast]);

  const toggleFlow = (flowId: string) => {
    setEnabledAuthFlows((prev) => {
      const next = new Set(prev);
      if (next.has(flowId)) {
        next.delete(flowId);
        if (authMainFlowId === flowId) {
          setAuthMainFlowId(null);
        }
      } else {
        next.add(flowId);
      }
      return next;
    });
  };

  const handleSaveAuthFlows = useCallback(async () => {
    const selectedFlows = authFlows.filter((f) => enabledAuthFlows.has(f.id));
    if (selectedFlows.length === 0) {
      toast({ title: "Aucun parcours sélectionné", variant: "destructive" });
      return;
    }

    try {
      const existingFlows = project.monitoredFlows ?? [];
      const existingIds = new Set(existingFlows.map((f) => f.id));
      const newFlows = selectedFlows.filter((f) => !existingIds.has(f.id));
      const merged = [...existingFlows, ...newFlows];

      await updateProject(projectId, { monitoredFlows: merged });

      if (authMainFlowId) {
        await apiSetMainFlow(projectId, authMainFlowId);
      }

      toast({
        title: "Surveillance activée",
        description: `${selectedFlows.length} parcours ajoutés à la surveillance.`,
      });
      onProjectUpdated();
      setAuthPhase("idle");
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    }
  }, [authFlows, enabledAuthFlows, authMainFlowId, project, projectId, toast, onProjectUpdated]);

  if (checkingCredentials || !hasAuthCredentials) return null;

  return (
    <AnimatePresence mode="wait">
      {/* Idle — CTA card */}
      {authPhase === "idle" && (
        <motion.div
          key="auth-idle"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Card className="border-primary/20 bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Zone authentifiée</h3>
                  <p className="text-xs text-muted-foreground">
                    Sentinelle peut se connecter à votre application et explorer les pages internes.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={startAuthDiscovery}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Découvrir les parcours internes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/project/${projectId}/settings`)}
                >
                  Voir les parcours surveillés
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Discovering — progress card */}
      {authPhase === "discovering" && (
        <motion.div
          key="auth-discovering"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Card className="border-primary/20 bg-card">
            <CardContent className="p-8 text-center space-y-4">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">Exploration de votre application</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sentinelle se connecte et analyse les pages internes pour identifier les parcours clés.
                </p>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={discoveryMsgIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs text-muted-foreground italic"
                >
                  {DISCOVERY_MESSAGES[discoveryMsgIndex]}
                </motion.p>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results — flow cards */}
      {authPhase === "results" && (
        <motion.div
          key="auth-results"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">
              {authFlows.length} nouveau{authFlows.length > 1 ? "x" : ""} parcours détecté{authFlows.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="space-y-2">
            {authFlows.map((flow, i) => (
              <motion.div
                key={flow.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{flow.labelFr}</span>
                          {authMainFlowId === flow.id && (
                            <span className="text-[10px] font-semibold text-primary-foreground bg-primary rounded px-1.5 py-0.5">
                              Principal
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                            {Math.round(flow.confidence)}%
                          </span>
                        </div>
                        {flow.descriptionFr && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{flow.descriptionFr}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {enabledAuthFlows.has(flow.id) && authMainFlowId !== flow.id && (
                          <button
                            onClick={() => setAuthMainFlowId(flow.id)}
                            className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <Switch
                          checked={enabledAuthFlows.has(flow.id)}
                          onCheckedChange={() => toggleFlow(flow.id)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Button
            onClick={handleSaveAuthFlows}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            size="lg"
          >
            Commencer la surveillance
          </Button>
        </motion.div>
      )}

      {/* Error */}
      {authPhase === "error" && (
        <motion.div
          key="auth-error"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Card className="border-destructive/30 bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Échec de la découverte</p>
                  <p className="text-xs text-muted-foreground">{authError}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={startAuthDiscovery} variant="outline" size="sm">
                  Réessayer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/project/${projectId}/settings`)}
                >
                  <Settings className="mr-1 h-3 w-3" />
                  Vérifier les identifiants
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
