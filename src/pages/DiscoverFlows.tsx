import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  discoverFlows,
  discoverAuthenticatedFlows,
  updateProject,
  setMainFlow,
  getFlowCredentialsStatus,
} from "@/lib/sentinelle-api";
import type { SuggestedFlow } from "@/lib/sentinelle-types";
import {
  Loader2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Lock,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import CredentialsModal from "@/components/CredentialsModal";

const PROGRESS_MESSAGES = [
  "Chargement de la page d'accueil…",
  "Détection des liens et boutons…",
  "Analyse des formulaires…",
  "Exploration des parcours utilisateur…",
  "Évaluation des objectifs business…",
  "Finalisation de l'analyse…",
];

const AUTH_PROGRESS_MESSAGES = [
  "Connexion en cours…",
  "Authentification réussie…",
  "Exploration des pages internes…",
  "Détection des parcours post-login…",
  "Analyse des fonctionnalités…",
  "Finalisation de l'analyse…",
];

type Phase = "loading" | "results" | "auth-discovery" | "auth-results" | "error";

export default function DiscoverFlows() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("loading");
  const [flows, setFlows] = useState<SuggestedFlow[]>([]);
  const [authFlows, setAuthFlows] = useState<SuggestedFlow[]>([]);
  const [mainFlowId, setMainFlowIdState] = useState<string | null>(null);
  const [enabledFlows, setEnabledFlows] = useState<Set<string>>(new Set());
  const [enabledAuthFlows, setEnabledAuthFlows] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const startedRef = useRef(false);

  // Credentials state
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [credentialFlowId, setCredentialFlowId] = useState<string>("");
  const [credentialFlowLabel, setCredentialFlowLabel] = useState<string>("");
  const [flowCredentials, setFlowCredentials] = useState<Record<string, boolean>>({});
  const [authLoginFailed, setAuthLoginFailed] = useState(false);

  // Progress animation
  useEffect(() => {
    if (phase !== "loading" && phase !== "auth-discovery") return;
    const interval = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 8 + 2));
    }, 800);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "loading" && phase !== "auth-discovery") return;
    const msgs = phase === "auth-discovery" ? AUTH_PROGRESS_MESSAGES : PROGRESS_MESSAGES;
    const interval = setInterval(() => {
      setMessageIdx((i) => (i + 1) % msgs.length);
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
        const sorted = [...flowList].sort((a, b) => b.confidence - a.confidence);
        if (sorted.length > 0) setMainFlowIdState(sorted[0].id);

        // Build credential status from flows
        const creds: Record<string, boolean> = {};
        flowList.forEach((f) => {
          if (f.hasCredentials) creds[f.id] = true;
        });
        setFlowCredentials(creds);

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
        if (mainFlowId === flowId) {
          const remaining = flows.find((f) => f.id !== flowId && next.has(f.id));
          setMainFlowIdState(remaining?.id ?? null);
        }
      } else {
        next.add(flowId);
        if (!mainFlowId) setMainFlowIdState(flowId);
      }
      return next;
    });
  };

  const toggleAuthFlow = (flowId: string) => {
    setEnabledAuthFlows((prev) => {
      const next = new Set(prev);
      if (next.has(flowId)) next.delete(flowId);
      else next.add(flowId);
      return next;
    });
  };

  const openCredentialModal = (flow: SuggestedFlow) => {
    setCredentialFlowId(flow.id);
    setCredentialFlowLabel(flow.labelFr);
    setCredentialModalOpen(true);
  };

  const handleCredentialSaved = () => {
    setFlowCredentials((prev) => ({ ...prev, [credentialFlowId]: true }));
  };

  // Check if a login flow has credentials configured
  const loginFlow = flows.find(
    (f) => f.goal === "LOGIN" || f.requiresCredentials
  );
  const loginHasCredentials = loginFlow ? !!flowCredentials[loginFlow.id] : false;

  const startAuthDiscovery = async () => {
    if (!id) return;
    setPhase("auth-discovery");
    setProgress(0);
    setMessageIdx(0);
    setAuthLoginFailed(false);

    try {
      const result = await discoverAuthenticatedFlows(id);
      if (!result.loginSuccess) {
        setAuthLoginFailed(true);
        setPhase("results");
        toast({
          title: "Connexion échouée",
          description: "Vérifiez les identifiants configurés.",
          variant: "destructive",
        });
        return;
      }

      const newFlows = result.flows;
      setAuthFlows(newFlows);
      setEnabledAuthFlows(new Set(newFlows.map((f) => f.id)));
      setProgress(100);
      setTimeout(() => setPhase("auth-results"), 600);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Erreur lors de la découverte authentifiée.");
      setPhase("error");
    }
  };

  const handleConfirm = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      const selectedPublic = flows.filter((f) => enabledFlows.has(f.id));
      const selectedAuth = authFlows.filter((f) => enabledAuthFlows.has(f.id));
      const allSelected = [...selectedPublic, ...selectedAuth];

      const effectiveMainFlowId =
        mainFlowId && allSelected.some((f) => f.id === mainFlowId)
          ? mainFlowId
          : allSelected[0]?.id ?? null;

      await updateProject(id, {
        suggestedFlows: [...flows, ...authFlows],
        monitoredFlows: allSelected,
      });
      if (effectiveMainFlowId) {
        await setMainFlow(id, effectiveMainFlowId);
      }
      toast({
        title: "Surveillance configurée",
        description: `${allSelected.length} parcours surveillés.`,
      });
      navigate(`/project/${id}`);
    } catch (e: unknown) {
      toast({
        title: "Erreur",
        description: (e as Error).message,
        variant: "destructive",
      });
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

  const totalEnabled = enabledFlows.size + enabledAuthFlows.size;

  const progressMessages =
    phase === "auth-discovery" ? AUTH_PROGRESS_MESSAGES : PROGRESS_MESSAGES;

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Loading / Auth Discovery Loading */}
        {(phase === "loading" || phase === "auth-discovery") && (
          <motion.div
            key={phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 text-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-neon/10 flex items-center justify-center">
                  {phase === "auth-discovery" ? (
                    <Lock className="h-8 w-8 text-neon animate-pulse" />
                  ) : (
                    <Search className="h-8 w-8 text-neon animate-pulse" />
                  )}
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-neon animate-bounce" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {phase === "auth-discovery"
                    ? "Sentinelle explore votre application après connexion"
                    : "Sentinelle identifie les parcours clés"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {phase === "auth-discovery"
                    ? "Analyse des zones authentifiées…"
                    : "de votre application…"}
                </p>
              </div>
            </div>
            <div className="space-y-3 max-w-sm mx-auto">
              <Progress value={Math.min(progress, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground animate-pulse">
                {progressMessages[messageIdx]}
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
                <Button
                  onClick={startDiscovery}
                  className="bg-neon text-background hover:bg-neon/90"
                >
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
                Choisissez votre{" "}
                <span className="text-neon font-medium">parcours principal</span>{" "}
                et activez ceux à surveiller.
              </p>
            </div>

            {flows.length === 0 ? (
              <Card className="bg-surface border-border">
                <CardContent className="p-8 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Aucun parcours détecté.
                  </p>
                  <Button
                    onClick={() => navigate(`/project/${id}`)}
                    className="bg-neon text-background hover:bg-neon/90"
                  >
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
                    const needsCreds =
                      (flow.goal === "LOGIN" || flow.requiresCredentials) &&
                      !flowCredentials[flow.id];
                    const hasCreds = !!flowCredentials[flow.id];

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
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold truncate">
                                  {flow.labelFr}
                                </p>
                                {isMain && (
                                  <span className="text-[10px] font-medium text-neon bg-neon/10 rounded px-1.5 py-0.5">
                                    Principal
                                  </span>
                                )}
                              </div>
                              {flow.descriptionFr && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {flow.descriptionFr}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-[10px] font-medium ${confidenceColor(
                                    flow.confidence
                                  )}`}
                                >
                                  {Math.round(flow.confidence)}% —{" "}
                                  {confidenceLabel(flow.confidence)}
                                </span>
                              </div>
                            </div>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => toggleFlow(flow.id)}
                              className="shrink-0"
                            />
                          </div>

                          {/* Credential indicator */}
                          {(flow.goal === "LOGIN" || flow.requiresCredentials) && (
                            <div className="flex items-center gap-2 ml-0">
                              {hasCreds ? (
                                <>
                                  <span className="inline-flex items-center gap-1 text-[11px] text-status-safe">
                                    <ShieldCheck className="h-3 w-3" />
                                    Compte test configuré
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-2"
                                    onClick={() => openCredentialModal(flow)}
                                  >
                                    Modifier
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs border-status-alerte/30 text-status-alerte hover:bg-status-alerte/10"
                                  onClick={() => openCredentialModal(flow)}
                                >
                                  <KeyRound className="mr-1 h-3 w-3" />
                                  Configurer les identifiants
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Auth login failed warning */}
                {authLoginFailed && (
                  <Card className="border-status-erreur/30 bg-status-erreur/5">
                    <CardContent className="p-4 flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-status-erreur shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-status-erreur">
                          La connexion a échoué
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Vérifiez les identifiants configurés et réessayez.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Authenticated zone section */}
                {loginFlow && loginHasCredentials && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-neon/20 bg-neon/5">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-neon/10 flex items-center justify-center">
                            <Lock className="h-5 w-5 text-neon" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              Zone authentifiée
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Sentinelle peut maintenant explorer votre
                              application après connexion pour détecter les
                              parcours internes.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={startAuthDiscovery}
                            className="bg-neon text-background hover:bg-neon/90"
                          >
                            <Search className="mr-2 h-4 w-4" />
                            Découvrir les parcours internes
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              /* skip */
                            }}
                            className="text-muted-foreground"
                          >
                            Passer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={startDiscovery}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Relancer
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={
                      totalEnabled === 0 || submitting
                    }
                    className="flex-1 bg-neon text-background hover:bg-neon/90 font-semibold"
                    size="lg"
                  >
                    {submitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Commencer la surveillance
                  </Button>
                </div>

                {totalEnabled === 0 && (
                  <p className="text-xs text-status-alerte text-center">
                    Activez au moins un parcours pour continuer.
                  </p>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Auth Results */}
        {phase === "auth-results" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-status-safe" />
                <h2 className="text-xl font-bold">
                  {authFlows.length} nouveau{authFlows.length > 1 ? "x" : ""}{" "}
                  parcours détecté{authFlows.length > 1 ? "s" : ""}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                dans votre application après connexion.
              </p>
            </div>

            {/* Existing public flows summary */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Parcours publics ({enabledFlows.size} activé
                {enabledFlows.size > 1 ? "s" : ""})
              </p>
              <div className="flex flex-wrap gap-2">
                {flows
                  .filter((f) => enabledFlows.has(f.id))
                  .map((f) => (
                    <span
                      key={f.id}
                      className="text-[11px] bg-secondary text-secondary-foreground rounded px-2 py-1"
                    >
                      {f.labelFr}
                      {mainFlowId === f.id && (
                        <span className="ml-1 text-neon">★</span>
                      )}
                    </span>
                  ))}
              </div>
            </div>

            {/* New auth flows */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Parcours post-login
              </p>
              <div className="max-h-[40vh] overflow-y-auto space-y-3 pr-1">
                {authFlows.map((flow) => {
                  const isEnabled = enabledAuthFlows.has(flow.id);
                  return (
                    <Card
                      key={flow.id}
                      className={`transition-all border ${
                        isEnabled
                          ? "border-border bg-surface"
                          : "border-border bg-surface/50 opacity-60"
                      }`}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate">
                              {flow.labelFr}
                            </p>
                            <span className="text-[10px] font-medium text-status-running bg-status-running/10 rounded px-1.5 py-0.5">
                              Post-login
                            </span>
                          </div>
                          {flow.descriptionFr && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {flow.descriptionFr}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[10px] font-medium ${confidenceColor(
                                flow.confidence
                              )}`}
                            >
                              {Math.round(flow.confidence)}% —{" "}
                              {confidenceLabel(flow.confidence)}
                            </span>
                            {flow.pagePath && (
                              <span className="text-[10px] text-muted-foreground">
                                {flow.pagePath}
                              </span>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => toggleAuthFlow(flow.id)}
                          className="shrink-0"
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setPhase("results")}>
                Retour
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={totalEnabled === 0 || submitting}
                className="flex-1 bg-neon text-background hover:bg-neon/90 font-semibold"
                size="lg"
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Commencer la surveillance
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Credentials Modal */}
      {id && (
        <CredentialsModal
          open={credentialModalOpen}
          onOpenChange={setCredentialModalOpen}
          projectId={id}
          flowId={credentialFlowId}
          flowLabel={credentialFlowLabel}
          onSaved={handleCredentialSaved}
        />
      )}
    </div>
  );
}
