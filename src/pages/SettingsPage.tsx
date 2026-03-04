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

  useEffect(() => {
    const init = async () => {
      // Health check
      healthCheck()
        .then(() => setApiStatus("ok"))
        .catch(() => setApiStatus("error"));

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
              <Input
                id="runner-key"
                type="password"
                value={runnerKey}
                onChange={(e) => setRunnerKey(e.target.value)}
                className="font-mono text-sm"
                placeholder="Clé API du runner"
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="mt-2">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Enregistrer
            </Button>
          </CardContent>
        </Card>
    </div>
  );
}
