import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { listReleases, getProject } from "@/lib/sentinelle-api";
import type { Release, Project } from "@/lib/sentinelle-types";
import { VerdictBadge } from "@/components/VerdictBadge";
import { ArrowLeft, Loader2, Clock } from "lucide-react";

function formatTime(date: string): string {
  return new Date(date).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReleasesTimeline() {
  const { id } = useParams<{ id: string }>();
  const [releases, setReleases] = useState<Release[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([listReleases(id, 50), getProject(id)])
      .then(([r, p]) => {
        setReleases(r);
        setProject(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10 space-y-8">
      <Link
        to={`/project/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Retour au projet
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historique des publications</h1>
        {project && (
          <p className="mt-1 text-sm text-muted-foreground">{project.name}</p>
        )}
      </div>

      {releases.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucune publication détectée.
        </p>
      ) : (
        <div className="space-y-2">
          {releases.map((release) => (
            <Link
              key={release.id}
              to={`/project/${id}/release/${release.id}`}
              className="block"
            >
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <VerdictBadge verdict={release.verdict} />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(release.detectedAt)}
                    </div>
                    {release.mainFlowLabel && (
                      <p className="text-xs text-foreground/80">
                        {release.mainFlowLabel}
                        {release.mainFlowStatus && (
                          <span className={
                            release.mainFlowStatus === "passed" ? " text-status-safe" :
                            release.mainFlowStatus === "failed" ? " text-status-erreur" :
                            " text-muted-foreground"
                          }>
                            {" · "}
                            {release.mainFlowStatus === "passed" ? "OK" :
                             release.mainFlowStatus === "failed" ? "Échec" :
                             release.mainFlowStatus}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {release.runCount} test{release.runCount > 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
