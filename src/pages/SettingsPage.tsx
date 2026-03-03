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

        <div className="mt-6 flex items-start gap-3 rounded-lg border border-muted p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              La configuration du runner et des cles API se fait desormais au niveau de chaque projet dans ses parametres.
            </p>
          </div>
        </div>
    </div>
  );
}
