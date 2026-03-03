import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProject, updateProject, listGoals, deleteProject } from "@/lib/sentinelle-api";
import type { Project, Goal } from "@/lib/sentinelle-types";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [goal, setGoal] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [checkFrequencyMin, setCheckFrequencyMin] = useState(5);
  const [maxRunsPerDay, setMaxRunsPerDay] = useState(10);

  useEffect(() => {
    if (!id) return;
    Promise.all([getProject(id), listGoals().catch(() => [])])
      .then(([p, g]) => {
        setProject(p);
        setName(p.name);
        setSiteUrl(p.siteUrl);
        setGoal(p.goal);
        setEnabled(p.enabled);
        setCheckFrequencyMin(p.checkFrequencyMin);
        setMaxRunsPerDay(p.maxRunsPerDay);
        setGoals(
          g.length > 0
            ? g
            : [
                { id: "SIGNUP", label: "Sign Up" },
                { id: "BOOK", label: "Book / Schedule" },
                { id: "BUY", label: "Buy / Checkout" },
                { id: "CONTACT", label: "Contact" },
              ],
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateProject(id, {
        name: name.trim(),
        siteUrl: siteUrl.trim(),
        goal,
        enabled,
        checkFrequencyMin,
        maxRunsPerDay,
      });
      setProject(updated);
      toast({ title: "Sauvegarde", description: "Parametres mis a jour." });
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      toast({ title: "Projet supprime", description: "Le projet et toutes ses donnees ont ete supprimes." });
      navigate("/");
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
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
      <div className="container py-10 text-center font-mono text-muted-foreground">
        Projet introuvable.
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-10">
        <Link
          to={`/project/${project.id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Retour au projet
        </Link>

        <h1 className="font-mono text-2xl font-bold">Parametres</h1>
        <p className="mt-1 text-sm text-muted-foreground">{project.name}</p>

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

            <div className="space-y-2">
              <Label className="font-mono text-xs">Objectif</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger className="font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="font-mono text-sm">
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs">Frequence de verification</Label>
              <Select
                value={String(checkFrequencyMin)}
                onValueChange={(v) => setCheckFrequencyMin(Number(v))}
              >
                <SelectTrigger className="font-mono text-sm w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5" className="font-mono">Toutes les 5 min</SelectItem>
                  <SelectItem value="15" className="font-mono">Toutes les 15 min</SelectItem>
                </SelectContent>
              </Select>
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
                    : "Surveillance en pause. Aucun test automatique ne sera lance."}
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

        {/* Danger zone */}
        <Separator className="my-8" />
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-destructive">
              Zone de danger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm font-semibold">Supprimer le projet</p>
                <p className="text-xs text-muted-foreground">
                  Supprime definitivement le projet et tous ses runs.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="font-mono">
                    <Trash2 className="mr-2 h-3 w-3" /> Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-mono">Supprimer « {project.name} » ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irreversible. Tous les runs et donnees seront supprimes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="font-mono">Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono"
                    >
                      {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Supprimer definitivement
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
