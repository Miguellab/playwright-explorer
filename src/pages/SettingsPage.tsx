import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { healthCheck } from "@/lib/sentinelle-api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Info, CheckCircle, XCircle } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<"ok" | "error" | null>(null);

  useEffect(() => {
    healthCheck()
      .then(() => setApiStatus("ok"))
      .catch(() => setApiStatus("error"))
      .finally(() => setLoading(false));
  }, []);

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
                <CheckCircle className="h-5 w-5 text-primary" />
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
              <Input id="runner-url" value={DEFAULT_RUNNER_URL} readOnly className="font-mono text-sm bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="runner-key" className="font-mono text-xs">Runner API Key</Label>
              <Input id="runner-key" type="password" value={DEFAULT_RUNNER_KEY} readOnly className="font-mono text-sm bg-muted" />
            </div>
            <p className="text-xs text-muted-foreground">
              Ces valeurs par defaut sont utilisees lors de la creation de nouveaux projets.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
