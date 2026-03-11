import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { getProject, updateProject, deleteProject, setMainFlow as apiSetMainFlow } from "@/lib/sentinelle-api";
import type { Project, SuggestedFlow } from "@/lib/sentinelle-types";
import { groupFlowsByType, CHECK_TYPE_META, type CheckType } from "@/lib/flow-categories";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, Save, Trash2, Star, KeyRound, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CredentialsModal from "@/components/CredentialsModal";
import { saveFlowCredentials, deleteFlowCredentials } from "@/lib/sentinelle-api";

export default function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [maxRunsPerDay, setMaxRunsPerDay] = useState(10);
  const [selectedFlowIds, setSelectedFlowIds] = useState<Set<string>>(new Set());
  const [mainFlowId, setMainFlowIdState] = useState<string | null>(null);
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [credentialFlowId, setCredentialFlowId] = useState("");
  const [credentialFlowLabel, setCredentialFlowLabel] = useState("");
  const [flowCredentials, setFlowCredentials] = useState<Record<string, boolean>>({});
  const [webhookCopied, setWebhookCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProject(id)
      .then((p) => {
        setProject(p);
        setName(p.name);
        setSiteUrl(p.siteUrl);
        setEnabled(p.enabled);
        setMaxRunsPerDay(p.maxRunsPerDay ?? 10);
        setMainFlowIdState(p.mainFlowId || null);
        setSelectedFlowIds(new Set((p.monitoredFlows ?? []).map((f) => f.id)));
        const creds: Record<string, boolean> = {};
        (p.monitoredFlows ?? []).forEach((f) => { if (f.hasCredentials) creds[f.id] = true; });
        (p.suggestedFlows ?? []).forEach((f) => { if (f.hasCredentials) creds[f.id] = true; });
        setFlowCredentials(creds);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const toggleFlow = useCallback((flowId: string, checked: boolean) => {
    setSelectedFlowIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(flowId);
      else {
        next.delete(flowId);
        if (mainFlowId === flowId) setMainFlowIdState(null);
      }
      return next;
    });
  }, [mainFlowId]);

  const handleSave = async () => {
    if (!id || !project) return;
    setSaving(true);
    try {
      const monitoredFlows = (project.suggestedFlows ?? []).filter((f) => selectedFlowIds.has(f.id));
      const updated = await updateProject(id, {
        name: name.trim(),
        siteUrl: siteUrl.trim(),
        enabled,
        maxRunsPerDay,
        monitoredFlows,
      });
      if (mainFlowId) {
        await apiSetMainFlow(id, mainFlowId);
      }
      setProject(updated);
      toast({ title: "Paramètres sauvegardés" });
    } catch (e: unknown) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      toast({ title: "Projet supprimé" });
      navigate("/");
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setDeleting(false);
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
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        Projet introuvable.
      </div>
    );
  }

  const suggestedFlows: SuggestedFlow[] = project.suggestedFlows ?? [];

  return (
    <div className="container max-w-2xl py-10 space-y-8">
      <Link
        to={`/project/${project.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Retour au projet
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
      <p className="text-sm text-muted-foreground">{project.name}</p>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs">Nom du projet</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background border-border text-sm" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">URL du site</Label>
            <Input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className="bg-background border-border text-sm" />
          </div>

          {/* Flows grouped by type */}
          <div className="space-y-2">
            {suggestedFlows.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Aucun parcours découvert.</p>
            ) : (
              <Accordion type="multiple" defaultValue={[]} className="space-y-2">
                {(["user-flow", "page-check", "ui-element"] as CheckType[]).map((type) => {
                  const flows = groupFlowsByType(suggestedFlows)[type];
                  if (flows.length === 0) return null;
                  const meta = CHECK_TYPE_META[type];
                  const selectedCount = flows.filter((f) => selectedFlowIds.has(f.id)).length;
                  return (
                    <AccordionItem key={type} value={type} className="border rounded-lg overflow-hidden">
                      <AccordionTrigger className={`px-3 py-3 hover:no-underline ${meta.sectionClass}`}>
                        <div className="flex items-center gap-2 flex-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${meta.badgeClass}`}>
                            {meta.title}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto mr-2">
                            {selectedCount}/{flows.length}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 pt-1">
                        <p className="text-xs text-muted-foreground mb-3">{meta.description}</p>
                        <div className="space-y-2">
                          {flows.map((flow) => {
                            const isSelected = selectedFlowIds.has(flow.id);
                            const isMain = mainFlowId === flow.id;
                            return (
                              <div key={flow.id} className="rounded-lg border border-border p-3 space-y-2">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => toggleFlow(flow.id, !!checked)}
                                  />
                                  <span className="text-sm flex-1">{flow.labelFr}</span>
                                  {isSelected && (
                                    <button
                                      type="button"
                                      className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        isMain ? "border-neon bg-neon" : "border-muted-foreground/40 hover:border-neon/60"
                                      }`}
                                      onClick={() => setMainFlowIdState(flow.id)}
                                      title="Définir comme parcours principal"
                                    >
                                      {isMain && <Star className="h-3 w-3 text-background" />}
                                    </button>
                                  )}
                                </div>
                                {flow.descriptionFr && (
                                  <p className="text-xs text-muted-foreground ml-8">{flow.descriptionFr}</p>
                                )}
                                {(flow.goal === "LOGIN" || flow.requiresCredentials) && (
                                  <div className="flex items-center gap-2 ml-8">
                                    {flowCredentials[flow.id] ? (
                                      <>
                                        <span className="inline-flex items-center gap-1 text-[11px] text-status-safe">
                                          <ShieldCheck className="h-3 w-3" />
                                          Compte test configuré
                                        </span>
                                        <button
                                          type="button"
                                          className="text-[11px] text-muted-foreground hover:text-foreground"
                                          onClick={() => {
                                            setCredentialFlowId(flow.id);
                                            setCredentialFlowLabel(flow.labelFr);
                                            setCredentialModalOpen(true);
                                          }}
                                        >
                                          Modifier
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        className="inline-flex items-center gap-1 text-[11px] text-status-alerte hover:text-foreground"
                                        onClick={() => {
                                          setCredentialFlowId(flow.id);
                                          setCredentialFlowLabel(flow.labelFr);
                                          setCredentialModalOpen(true);
                                        }}
                                      >
                                        <KeyRound className="h-3 w-3" />
                                        Configurer les identifiants
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-semibold">Surveillance active</p>
              <p className="text-xs text-muted-foreground">
                {enabled ? "Sentinelle surveille votre application." : "Surveillance en pause."}
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* Limites */}
          <div className="space-y-2">
            <Label className="text-xs">Tests maximum par jour</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={maxRunsPerDay}
              onChange={(e) => setMaxRunsPerDay(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              className="bg-background border-border text-sm w-32"
            />
            <p className="text-xs text-muted-foreground">
              Nombre maximum de tests pouvant être lancés par jour pour ce projet.
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="bg-neon text-background hover:bg-neon/90">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Sauvegarder
          </Button>
        </CardContent>
      </Card>

      {/* Webhook deploy */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhook de déploiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Ajoutez cette URL dans les webhooks de votre plateforme de déploiement pour déclencher automatiquement les tests après chaque publication.
          </p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={`${import.meta.env.VITE_SENTINELLE_API_URL || ""}/projects/${id}/deploy`}
              className="bg-background border-border text-xs font-mono flex-1"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${import.meta.env.VITE_SENTINELLE_API_URL || ""}/projects/${id}/deploy`
                );
                setWebhookCopied(true);
                setTimeout(() => setWebhookCopied(false), 2000);
              }}
            >
              {webhookCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Méthode : <span className="font-mono font-medium text-foreground">POST</span>
          </p>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="bg-surface border-status-erreur/20">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-status-erreur">
            Zone danger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-status-erreur border-status-erreur/30 hover:bg-status-erreur/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer le projet
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-surface border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer {project.name} ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Toutes les données seront supprimées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground">
                  {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Credentials Modal */}
      {id && (
        <CredentialsModal
          open={credentialModalOpen}
          onOpenChange={setCredentialModalOpen}
          projectId={id}
          flowId={credentialFlowId}
          flowLabel={credentialFlowLabel}
          onSaved={() => setFlowCredentials((prev) => ({ ...prev, [credentialFlowId]: true }))}
        />
      )}
    </div>
  );
}
