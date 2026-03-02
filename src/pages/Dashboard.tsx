import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppNav } from "@/components/AppNav";
import { VerdictBadge } from "@/components/VerdictBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listProjects } from "@/lib/sentinelle-api";
import type { Project } from "@/lib/sentinelle-types";
import { Plus, Loader2, ExternalLink, Clock } from "lucide-react";

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "a l'instant";
  if (min < 60) return `il y a ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProjects()
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
        else setProjects([]);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  // Redirect to onboarding if no projects
  useEffect(() => {
    if (!loading && projects.length === 0) {
      navigate("/onboarding");
    }
  }, [loading, projects.length, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="container max-w-4xl py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-mono text-2xl font-bold">Mes projets</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sentinelle surveille vos applications en continu.
            </p>
          </div>
          <Button asChild className="font-mono">
            <Link to="/onboarding">
              <Plus className="mr-2 h-4 w-4" /> Nouveau projet
            </Link>
          </Button>
        </div>

        <div className="mt-8 space-y-4">
          {projects.map((project) => (
            <Link key={project.id} to={`/project/${project.id}`} className="block">
              <Card className="transition-colors hover:bg-secondary/30">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-semibold truncate">{project.name}</p>
                      <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                        {project.goal}
                      </Badge>
                      {!project.enabled && (
                        <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
                          Pause
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                      <a
                        href={project.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-foreground truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        {project.siteUrl}
                      </a>
                      {project.lastCheckedAt && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {timeAgo(project.lastCheckedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Placeholder for last verdict - will be filled by runs */}
                  <div className="shrink-0">
                    {project.lastSeenSignature ? (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Derniere verification {project.lastCheckedAt ? timeAgo(project.lastCheckedAt) : "—"}
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        En attente...
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
