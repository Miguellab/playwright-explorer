import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { healthCheck, DEFAULT_RUNNER_URL, DEFAULT_RUNNER_KEY, getSettings, updateSettings } from "@/lib/sentinelle-api";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Save, Sparkles, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<"ok" | "error" | null>(null);
  const [runnerUrl, setRunnerUrl] = useState(DEFAULT_RUNNER_URL);
  const [runnerKey, setRunnerKey] = useState(DEFAULT_RUNNER_KEY);
  const [saving, setSaving] = useState(false);
  const [showRunnerKey, setShowRunnerKey] = useState(false);

  const [anthropicKey, setAnthropicKey] = useState("");
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [useVisionAnalysis, setUseVisionAnalysis] = useState(true);

  useEffect(() => {
    const init = async () => {
      healthCheck()
        .then(() => setApiStatus("ok"))
        .catch(() => setApiStatus("error"));

      getSettings()
        .then((s) => {
          setHasAnthropicKey(s.hasAnthropicApiKey);
          if (s.anthropicApiKey) setAnthropicKey(s.anthropicApiKey);
        })
        .catch(() => {});

      // Load runner settings from DB
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["external_runner_url", "external_runner_api_key"]);

      if (data) {
        for (const row of data) {
          if (row.key === "external_runner_url" && row.value) setRunnerUrl(row.value as string);
          if (row.key === "external_runner_api_key" && row.value) setRunnerKey(row.value as string);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error: e1 } = await supabase.from("app_settings").upsert(
        { key: "external_runner_url", value: JSON.parse(JSON.stringify(runnerUrl)) },
        { onConflict: "key" }
      );
      const { error: e2 } = await supabase.from("app_settings").upsert(
        { key: "external_runner_api_key", value: JSON.parse(JSON.stringify(runnerKey)) },
        { onConflict: "key" }
      );
      if (e1 || e2) throw e1 || e2;
      toast({ title: "Configuration sauvegardée" });
    } catch {
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  );

  return (
    <div className="container max-w-2xl py-10">
        <h1 className="font-mono text-2xl font-bold">Parametres</h1>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider">Etat du service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {apiStatus === "ok" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-mono text-sm font-semibold">
                  API Sentinelle {apiStatus === "ok" ? "connectee" : "inaccessible"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {apiStatus === "ok"
                    ? "Le backend repond correctement."
                    : "Verifiez la configuration de VITE_SENTINELLE_API_URL."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider">Configuration du Runner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="runner-url" className="font-mono text-xs">Runner URL</Label>
              <Input
                id="runner-url"
                value={runnerUrl}
                onChange={(e) => setRunnerUrl(e.target.value)}
                className="font-mono text-sm"
                placeholder={DEFAULT_RUNNER_URL}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="runner-key" className="font-mono text-xs">Runner API Key</Label>
              <div className="relative">
                <Input
                  id="runner-key"
                  type={showRunnerKey ? "text" : "password"}
                  value={runnerKey}
                  onChange={(e) => setRunnerKey(e.target.value)}
                  className="font-mono text-sm pr-10"
                  placeholder="Clé API du runner"
                />
                <button
                  type="button"
                  onClick={() => setShowRunnerKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showRunnerKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="mt-2">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Enregistrer
            </Button>
          </CardContent>
        </Card>
        {/* AI Settings card */}
        <Card className="mt-8">
          <CardHeader>
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
              <Label htmlFor="anthropic-key" className="font-mono text-xs">Clé API Anthropic</Label>
              <div className="relative">
                <Input
                  id="anthropic-key"
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
              onClick={async () => {
                if (!anthropicKey.trim()) return;
                setSavingKey(true);
                try {
                  const result = await updateSettings({ anthropicApiKey: anthropicKey.trim() });
                  setHasAnthropicKey(result.hasAnthropicApiKey);
                  if (result.anthropicApiKey) setAnthropicKey(result.anthropicApiKey);
                  setShowKey(false);
                  toast({ title: "Clé sauvegardée" });
                } catch {
                  toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
                } finally {
                  setSavingKey(false);
                }
              }}
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
