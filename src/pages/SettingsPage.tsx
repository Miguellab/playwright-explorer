import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { healthCheck, DEFAULT_RUNNER_URL, DEFAULT_RUNNER_KEY, getSettings, updateSettings } from "@/lib/sentinelle-api";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Save, Eye, EyeOff, AlertTriangle } from "lucide-react";

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
          if (s.useVisionAnalysis !== undefined) setUseVisionAnalysis(s.useVisionAnalysis);
        })
        .catch(() => {});

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
    <div className="container max-w-2xl py-10 space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">État du service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {apiStatus === "ok" ? (
              <CheckCircle className="h-5 w-5 text-status-safe" />
            ) : (
              <XCircle className="h-5 w-5 text-status-erreur" />
            )}
            <div>
              <p className="text-sm font-semibold">
                API Sentinelle {apiStatus === "ok" ? "connectée" : "inaccessible"}
              </p>
              <p className="text-xs text-muted-foreground">
                {apiStatus === "ok" ? "Le backend répond correctement." : "Vérifiez la configuration."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Configuration du Runner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Runner URL</Label>
            <Input value={runnerUrl} onChange={(e) => setRunnerUrl(e.target.value)} className="bg-background border-border text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Runner API Key</Label>
            <div className="relative">
              <Input
                type={showRunnerKey ? "text" : "password"}
                value={runnerKey}
                onChange={(e) => setRunnerKey(e.target.value)}
                className="bg-background border-border text-sm pr-10"
              />
              <button type="button" onClick={() => setShowRunnerKey((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showRunnerKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Intelligence Artificielle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs">Analyse IA pour la découverte</Label>
              <p className="text-xs text-muted-foreground">Claude analyse visuellement les pages pour des scores plus précis.</p>
            </div>
            <Switch
              checked={useVisionAnalysis}
              onCheckedChange={async (checked) => {
                setUseVisionAnalysis(checked);
                try {
                  await updateSettings({ useVisionAnalysis: checked });
                  toast({ title: checked ? "Analyse IA activée" : "Analyse IA désactivée" });
                } catch {
                  setUseVisionAnalysis(!checked);
                  toast({ title: "Erreur", variant: "destructive" });
                }
              }}
            />
          </div>
          {useVisionAnalysis && !hasAnthropicKey && (
            <div className="flex items-center gap-2 rounded-md bg-status-alerte/10 border border-status-alerte/20 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-status-alerte shrink-0" />
              <p className="text-xs text-status-alerte">Clé API Anthropic requise</p>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs">Clé API Anthropic</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="bg-background border-border text-sm pr-10"
              />
              <button type="button" onClick={() => setShowKey((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
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
                toast({ title: "Erreur", variant: "destructive" });
              } finally {
                setSavingKey(false);
              }
            }}
            disabled={savingKey || !anthropicKey.trim()}
            variant="secondary"
          >
            {savingKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Sauvegarder la clé
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
