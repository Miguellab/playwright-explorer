import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  createProject,
  healthCheck,
  DEFAULT_RUNNER_URL,
  DEFAULT_RUNNER_KEY,
} from "@/lib/sentinelle-api";
import { Shield, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    healthCheck()
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false));
  }, []);

  const canSubmit = siteUrl.startsWith("https://") && projectName.trim().length > 0 && apiConnected;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const project = await createProject({
        name: projectName.trim(),
        siteUrl: siteUrl.trim(),
        runnerBaseUrl: DEFAULT_RUNNER_URL,
        runnerApiKey: DEFAULT_RUNNER_KEY,
      });
      navigate(`/project/${project.id}/discover`);
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-neon/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-7 w-7 text-neon" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Ajouter un projet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez votre application Lovable pour commencer la surveillance.
          </p>
        </div>

        <Card className="border-border bg-surface">
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Nom du projet</Label>
              <Input
                placeholder="Mon application"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">URL de l'application</Label>
              <Input
                placeholder="https://mon-app.lovable.app"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                className="bg-background border-border"
              />
              {siteUrl && !siteUrl.startsWith("https://") && (
                <p className="text-xs text-status-erreur">L'URL doit commencer par https://</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              {apiConnected === null ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : apiConnected ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-status-safe" />
                  <span className="text-status-safe">Service connecté</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 text-status-erreur" />
                  <span className="text-status-erreur">Service inaccessible</span>
                </>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full bg-neon text-background hover:bg-neon/90 font-semibold"
              size="lg"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyser mon application
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Sentinelle analysera votre application et identifiera les parcours clés à surveiller après chaque publication.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
