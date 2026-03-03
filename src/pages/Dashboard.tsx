import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { listProjects, toggleProject } from "@/lib/sentinelle-api";
import type { Project } from "@/lib/sentinelle-types";
import { Plus, Loader2, ExternalLink, Clock, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const fetchProjects = () => {
    setLoading(true);
    setError(null);
    listProjects()
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
        else setProjects([]);
      })
      .catch((err) => {
        setProjects([]);
        setError(err?.message || "Impossible de charger les projets.");
      })
      .finally(() => setLoading(false));
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
                        "h-2.5 w-2.5 rounded-full shrink-0",
                        project.enabled ? "bg-primary" : "bg-muted-foreground/40"
                      )}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-semibold truncate">{project.name}</p>
                        <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                          {project.goal}
                        </Badge>
                        {!project.enabled && (
                          <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
                            En pause
                          </Badge>
                        )}
                      </div>
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
                    </div>

                    {/* Toggle */}
                    <div onClick={(e) => handleToggle(e, project.id)}>
                      <Switch
                        checked={project.enabled}
                        disabled={togglingIds.has(project.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
