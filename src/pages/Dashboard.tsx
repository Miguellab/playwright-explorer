import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listProjects, listReleases } from "@/lib/sentinelle-api";
import type { Project, Release } from "@/lib/sentinelle-types";
import { VerdictBadge } from "@/components/VerdictBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteProject } from "@/lib/sentinelle-api";
import { Plus, Loader2, ExternalLink, Shield, AlertCircle, RefreshCw, MoreVertical, Settings, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [latestReleases, setLatestReleases] = useState<Record<string, Release>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    setError(null);
    listProjects()
      .then(async (data) => {
        const list = Array.isArray(data) ? data : [];
        setProjects(list);
        const releaseEntries = await Promise.allSettled(
          list.map(async (p) => {
            const releases = await listReleases(p.id, 1);
            return [p.id, releases[0]] as const;
          })
        );
        const releaseMap: Record<string, Release> = {};
        for (const entry of releaseEntries) {
          if (entry.status === "fulfilled" && entry.value[1]) {
            releaseMap[entry.value[0]] = entry.value[1];
          }
        }
        setLatestReleases(releaseMap);
      })
      .catch((err) => {
        setProjects([]);
        setError(err?.message || "Impossible de charger les projets.");
      })
      .finally(() => setLoading(false));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {} finally {
      setDeleting(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasProjects = !error && projects.length > 0;

  return (
    <div className="container max-w-3xl py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes projets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Surveillez vos applications après chaque publication.
          </p>
        </div>
        {hasProjects && (
          <Button asChild className="bg-neon text-background hover:bg-neon/90 font-semibold">
            <Link to="/onboarding">
              <Plus className="mr-2 h-4 w-4" /> Nouveau projet
            </Link>
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-status-erreur/20 bg-status-erreur/5 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-status-erreur" />
          <p className="text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchProjects}>
            <RefreshCw className="mr-2 h-3 w-3" /> Réessayer
          </Button>
        </div>
      )}

      {/* Empty */}
      {!error && projects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 rounded-xl border border-dashed border-muted-foreground/20 p-16 text-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-neon/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-neon" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold">Aucun projet surveillé</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Ajoutez votre première application pour commencer la surveillance automatique.
            </p>
          </div>
          <Button asChild size="lg" className="bg-neon text-background hover:bg-neon/90 font-semibold">
            <Link to="/onboarding">
              <Plus className="mr-2 h-4 w-4" /> Ajouter un projet
            </Link>
          </Button>
        </motion.div>
      )}

      {/* Project list */}
      {hasProjects && (
        <div className="space-y-3">
          {projects.map((project, i) => {
            const release = latestReleases[project.id];
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/project/${project.id}`} className="block group">
                  <Card className="border-border bg-surface hover:bg-muted/30 transition-colors">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold truncate">{project.name}</p>
                          {release && <VerdictBadge verdict={release.verdict} />}
                          {!project.enabled && (
                            <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                              En pause
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{project.siteUrl.replace(/^https?:\/\//, "")}</span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <DropdownMenuItem onClick={() => navigate(`/project/${project.id}/settings`)} className="text-xs">
                            <Settings className="h-3.5 w-3.5 mr-2" /> Paramètres
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteTarget(project)} className="text-xs text-destructive focus:text-destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-surface border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {deleteTarget?.name} ?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Cette action est irréversible. Toutes les données seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
