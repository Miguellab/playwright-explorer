import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import { getProject, updateProject, getSettings, updateSettings } from "@/lib/sentinelle-api";
import type { Project, SuggestedFlow } from "@/lib/sentinelle-types";
import { ArrowLeft, Loader2, Save, ShieldAlert, Sparkles, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [checkFrequencyMin, setCheckFrequencyMin] = useState(5);
  const [maxRunsPerDay, setMaxRunsPerDay] = useState(10);
  const [selectedFlowIds, setSelectedFlowIds] = useState<Set<string>>(new Set());

  // AI settings state
  const [anthropicKey, setAnthropicKey] = useState("");
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getProject(id),
      getSettings().catch(() => null),
    ])
      .then(([p, settings]) => {
        setProject(p);
        setName(p.name);
        setSiteUrl(p.siteUrl);
        setEnabled(p.enabled);
        setCheckFrequencyMin(p.checkFrequencyMin);
        setMaxRunsPerDay(p.maxRunsPerDay);
        const monitoredIds = new Set((p.monitoredFlows ?? []).map((f) => f.id));
        setSelectedFlowIds(monitoredIds);

        if (settings) {
          setHasAnthropicKey(settings.hasAnthropicApiKey);
          if (settings.hasAnthropicApiKey && settings.anthropicApiKey) {
            setAnthropicKey(settings.anthropicApiKey);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const toggleFlow = useCallback((flowId: string, checked: boolean) => {
    setSelectedFlowIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(flowId);
      else next.delete(flowId);
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (!id || !project) return;
    setSaving(true);
    try {
      const monitoredFlows = (project.suggestedFlows ?? []).filter((f) =>
        selectedFlowIds.has(f.id),
      );
      const updated = await updateProject(id, {
        name: name.trim(),
        siteUrl: siteUrl.trim(),
        enabled,
        checkFrequencyMin,
        maxRunsPerDay,
        monitoredFlows,
      });
      setProject(updated);
      toast({ title: "Sauvegarde", description: "Paramètres mis à jour." });
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveKey = async () => {
    if (!anthropicKey.trim()) return;
    setSavingKey(true);
    try {
      const result = await updateSettings({ anthropicApiKey: anthropicKey.trim() });
      setHasAnthropicKey(result.hasAnthropicApiKey);
      if (result.anthropicApiKey) setAnthropicKey(result.anthropicApiKey);
      setShowKey(false);
      toast({ title: "Clé sauvegardée", description: "La clé API Anthropic a été mise à jour." });
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSavingKey(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-10 text-center font-mono text-muted-foreground">
        Projet introuvable.
      </div>
    );
  }

  const suggestedFlows: SuggestedFlow[] = project.suggestedFlows ?? [];
  const analysisMode = project.discoveryMeta?.analysisMode;

  return (
    <div className="container max-w-2xl py-10">
      <Link
        to={`/project/${project.id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Retour au projet
      </Link>

      <h1 className="font-mono text-2xl font-bold">Paramètres</h1>
      <p className="mt-1 text-sm text-muted-foreground">{project.name}</p>

      {/* Project config card */}
      <Card className="mt-8">
        <CardHeader className="pb-3">
          <CardTitle className="font-mono text-sm uppercase tracking-wider">
            Configuration du projet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="font-mono text-xs">Nom du projet</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-xs">URL du site</Label>
            <Input
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {/* Parcours surveillés */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="font-mono text-xs">Parcours surveillés</Label>
              {analysisMode === "dom+vision" && (
                <Badge variant="outline" className="gap-1 border-purple-500/50 text-purple-600 dark:text-purple-400 text-[10px]">
                  <Sparkles className="h-3 w-3" />
                  Analyse par IA
                </Badge>
              )}
              {analysisMode === "dom-only" && (
                <Badge variant="secondary" className="text-[10px]">
                  Analyse basique
                </Badge>
              )}
            </div>
            {suggestedFlows.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Aucun parcours découvert. Lancez une découverte depuis le tableau de bord.
              </p>
            ) : (
              <div className="space-y-2">
                {suggestedFlows.map((flow) => (
                  <label
                    key={flow.id}
                    className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedFlowIds.has(flow.id)}
                      onCheckedChange={(checked) => toggleFlow(flow.id, !!checked)}
                    />
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <span className="font-mono text-sm truncate">{flow.labelFr}</span>
                      <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                        {flow.confidence}%
                      </Badge>
                      {flow.requiresCredentials && (
                        <Badge variant="outline" className="shrink-0 gap-1 border-orange-500/50 text-orange-600 dark:text-orange-400">
                          <ShieldAlert className="h-3 w-3" />
                          Identifiants requis
                        </Badge>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-xs">Fréquence de vérification</Label>
            <select
              value={String(checkFrequencyMin)}
              onChange={(e) => setCheckFrequencyMin(Number(e.target.value))}
              className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="5">Toutes les 5 min</option>
              <option value="15">Toutes les 15 min</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-xs">Maximum de tests par jour</Label>
            <Input
              type="number"
              value={maxRunsPerDay}
              onChange={(e) => setMaxRunsPerDay(Number(e.target.value))}
              className="font-mono text-sm w-24"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-mono text-sm font-semibold">Surveillance active</p>
              <p className="text-xs text-muted-foreground">
                {enabled
                  ? "Sentinelle surveille votre application en continu."
                  : "Surveillance en pause. Aucun test automatique ne sera lancé."}
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="font-mono">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Sauvegarder
          </Button>
        </CardContent>
      </Card>

      {/* AI Settings card */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <CardTitle className="font-mono text-sm uppercase tracking-wider">
              Intelligence Artificielle
            </CardTitle>
            {hasAnthropicKey ? (
              <Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-400 text-[10px]">
                Configurée
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                Non configurée
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="font-mono text-xs">Clé API Anthropic</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Nécessaire pour l'analyse visuelle des pages lors de la découverte. Utilise Claude Haiku
              pour des scores de confiance plus précis.{" "}
              <a
                href="https://console.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Obtenez votre clé sur console.anthropic.com
              </a>
            </p>
          </div>

          <Button
            onClick={handleSaveKey}
            disabled={savingKey || !anthropicKey.trim()}
            variant="secondary"
            className="font-mono"
          >
            {savingKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Sauvegarder la clé
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
