import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { listProjects, toggleProject, listRuns, deleteProject } from "@/lib/sentinelle-api";
import type { Project, Run } from "@/lib/sentinelle-types";
import { Plus, Loader2, ExternalLink, Clock, AlertCircle, RefreshCw, ShieldCheck, MoreVertical, Settings, Trash2 } from "lucide-react";

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [lastRuns, setLastRuns] = useState<Record<string, Run>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    setError(null);
    listProjects()
      .then(async (data) => {
        const list = Array.isArray(data) ? data : [];
        setProjects(list);
        // Fetch last run for each project
        const runEntries = await Promise.allSettled(
          list.map(async (p) => {
            const runs = await listRuns(p.id, 1);
            return [p.id, runs[0]] as const;
          })
        );
        const runMap: Record<string, Run> = {};
        for (const entry of runEntries) {
          if (entry.status === "fulfilled" && entry.value[1]) {
            runMap[entry.value[0]] = entry.value[1];
          }
        }
        setLastRuns(runMap);
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
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleToggle = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setTogglingIds((prev) => new Set(prev).add(projectId));
    try {
      const updated = await toggleProject(projectId);
      setProjects((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
    } catch {
      /* ignore */
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasProjects = !error && projects.length > 0;

  return (
    <div className="container max-w-4xl py-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-mono text-2xl font-bold">Mes projets</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sentinelle surveille vos applications en continu.
            </p>
          </div>
          {hasProjects && (
            <Button asChild className="font-mono">
              <Link to="/onboarding">
                <Plus className="mr-2 h-4 w-4" /> Nouveau projet
              </Link>
            </Button>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-mono text-sm font-semibold">Erreur de connexion</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" className="font-mono" onClick={fetchProjects}>
              <RefreshCw className="mr-2 h-3 w-3" /> Réessayer
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!error && projects.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-6 rounded-xl border border-dashed border-muted-foreground/20 p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="font-mono text-base font-semibold">Aucun projet surveillé</p>
              <p className="font-mono text-sm text-muted-foreground max-w-sm">
                Créez votre premier projet pour commencer à surveiller vos applications automatiquement.
              </p>
            </div>
            <Button asChild size="lg" className="font-mono mt-2">
              <Link to="/onboarding">
                <Plus className="mr-2 h-4 w-4" /> Créer un projet
              </Link>
            </Button>
          </div>
        )}

        {/* Project list */}
        {hasProjects && (
          <div className="mt-8 space-y-3">
            {projects.map((project) => (
              <Link key={project.id} to={`/project/${project.id}`} className="block group">
                <Card className={cn(
                  "transition-all duration-150 group-hover:bg-secondary/30 group-hover:border-primary/20",
                  !project.enabled && "opacity-60"
                )}>
                  <CardContent className="flex items-center gap-4 p-5">
                    {/* Status dot */}
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full shrink-0",
                        !project.enabled || !lastRuns[project.id]
                          ? "bg-muted-foreground/40"
                          : lastRuns[project.id].status === "passed"
                            ? "bg-status-pass"
                            : lastRuns[project.id].status === "failed" || lastRuns[project.id].status === "error"
                              ? "bg-status-fail"
                              : "bg-muted-foreground/40"
                      )}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Ligne 1 : Nom + verdict + pause */}
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-semibold truncate">{project.name}</p>
                        {lastRuns[project.id]?.verdict ? (
                          <VerdictBadge verdict={lastRuns[project.id].verdict!} />
                        ) : null}
                        {!project.enabled && (
                          <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
                            En pause
                          </Badge>
                        )}
                      </div>
                      {/* Ligne 2 : URL + dernière surveillance */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                        <span className="flex items-center gap-1 truncate">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          {project.siteUrl.replace(/^https?:\/\//, "")}
                        </span>
                        {project.lastCheckedAt && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Clock className="h-3 w-3" />
                            {timeAgo(project.lastCheckedAt)}
                          </span>
                        )}
                      </div>
                      {/* Ligne 3 : Parcours surveillés */}
                      {project.monitoredFlows && project.monitoredFlows.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {project.monitoredFlows.map((flow) => (
                            <Badge key={flow.id} variant="secondary" className="font-mono text-[10px]">
                              {flow.labelFr}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div onClick={(e) => handleToggle(e, project.id)}>
                        <Switch
                          checked={project.enabled}
                          disabled={togglingIds.has(project.id)}
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <DropdownMenuItem onClick={() => navigate(`/project/${project.id}/settings`)} className="font-mono text-xs">
                            <Settings className="h-3.5 w-3.5 mr-2" /> Paramètres
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteTarget(project)} className="font-mono text-xs text-destructive focus:text-destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-mono">Supprimer {deleteTarget?.name} ?</AlertDialogTitle>
              <AlertDialogDescription className="font-mono text-sm">
                Cette action est irréversible. Tous les runs et données associés seront supprimés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-mono" disabled={deleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
