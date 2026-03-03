import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { getSettings, updateSetting } from "@/lib/api";
import type { AppSettings } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Info, Save } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await Promise.all([
        updateSetting("external_runner_url", settings.external_runner_url),
        updateSetting("external_runner_api_key", settings.external_runner_api_key),
        updateSetting("allow_localhost", settings.allow_localhost),
        updateSetting("max_runs_per_day", settings.max_runs_per_day),
      ]);
      toast({ title: "Settings saved" });
    } catch (e: unknown) {
      toast({ title: "Error saving", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  );

  if (!settings) return (
    <div className="container py-10 text-center font-mono text-muted-foreground">Failed to load settings.</div>
  );

  return (
    <div className="container max-w-2xl py-10">
        <h1 className="font-mono text-2xl font-bold">Settings</h1>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider">External Runner Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="font-mono text-xs">Runner Base URL <span className="text-destructive">*</span></Label>
              <Input
                value={settings.external_runner_url}
                onChange={(e) => setSettings({ ...settings, external_runner_url: e.target.value })}
                placeholder="https://my-runner.onrender.com"
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">The base URL of your deployed Playwright runner service.</p>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs">Runner API Key <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                value={settings.external_runner_api_key}
                onChange={(e) => setSettings({ ...settings, external_runner_api_key: e.target.value })}
                placeholder="Your runner API key"
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">Stored securely — never sent to the browser. Only used server-side.</p>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={settings.allow_localhost}
                onCheckedChange={(v) => setSettings({ ...settings, allow_localhost: v })}
              />
              <Label className="font-mono text-xs">Allow localhost URLs</Label>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs">Max runs per day</Label>
              <Input
                type="number"
                value={settings.max_runs_per_day}
                onChange={(e) => setSettings({ ...settings, max_runs_per_day: Number(e.target.value) })}
                className="font-mono text-xs w-24"
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="font-mono">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-start gap-3 rounded-lg border border-status-running/30 bg-status-running/5 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-status-running" />
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Deploy your Playwright runner externally (e.g. Render, Railway, Fly.io) and paste its URL above.
              The runner must expose:
            </p>
            <ul className="list-disc pl-4 space-y-1 font-mono text-xs">
              <li>POST /v1/runs — create a test run</li>
              <li>GET /v1/runs/:id — get run status & results</li>
            </ul>
            <p>Configure CORS on the runner to allow requests from your Supabase project domain.</p>
          </div>
        </div>
    </div>
  );
}
