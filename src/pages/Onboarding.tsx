import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createProject,
  healthCheck,
  DEFAULT_RUNNER_URL,
  DEFAULT_RUNNER_KEY,
} from "@/lib/sentinelle-api";
import type { OnboardingData } from "@/lib/sentinelle-types";
import {
  Globe,
  Eye,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { icon: Globe, label: "Application" },
  { icon: Eye, label: "Surveillance" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [siteUrl, setSiteUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [checkingApi, setCheckingApi] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    siteUrl: "",
    name: "",
    checkFrequencyMin: 5,
    maxRunsPerDay: 10,
    autoTest: true,
  });

  useEffect(() => {
    setCheckingApi(true);
    healthCheck()
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false))
      .finally(() => setCheckingApi(false));
  }, []);

  const canNext = () => {
    if (step === 0) return siteUrl.startsWith("https://") && projectName.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 0) {
      setData(prev => ({ ...prev, siteUrl, name: projectName }));
      setStep(1);
    }
  };

  const handleSubmit = async () => {
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
      toast({ title: "Projet créé", description: "Analyse des parcours en cours…" });
      navigate(`/project/${project.id}/discover`);
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

          {/* Step 1: Connect app */}
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

                <Button onClick={handleNext} disabled={!canNext()} className="w-full font-mono">
                  Continuer <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Surveillance */}
          {step === 1 && (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="font-mono text-xl font-bold">Surveillance</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Après création, Sentinelle analysera automatiquement les parcours possibles de votre site.
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
                  <Button variant="outline" onClick={() => setStep(0)} className="font-mono">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting} className="flex-1 font-mono">
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="mr-2 h-4 w-4" />
                    )}
                    Créer et analyser les parcours
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
