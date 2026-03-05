import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listProjects, listRuns } from "@/lib/sentinelle-api";
import type { Project, Run } from "@/lib/sentinelle-types";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RunWithProject extends Run {
  projectName: string;
}

function formatDuration(ms: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function Logs() {
  const [rows, setRows] = useState<RunWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const projects = await listProjects();
        const all: RunWithProject[] = [];
        await Promise.all(
          projects.map(async (p: Project) => {
            try {
              const runs = await listRuns(p.id, 10);
              runs.forEach((r) => all.push({ ...r, projectName: p.name }));
            } catch {}
          })
        );
        all.sort((a, b) => {
          const da = a.startedAt || a.finishedAt || "";
          const db = b.startedAt || b.finishedAt || "";
          return db.localeCompare(da);
        });
        setRows(all);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="font-mono text-2xl font-bold">Logs</h1>
      <p className="mt-1 text-sm text-muted-foreground">Derniers runs sur tous les projets.</p>

      {rows.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground font-mono">Aucun run pour le moment.</p>
      ) : (
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono">Date</TableHead>
                <TableHead className="font-mono">Projet</TableHead>
                <TableHead className="font-mono">Parcours</TableHead>
                <TableHead className="font-mono">Statut</TableHead>
                <TableHead className="font-mono text-right">Durée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((run) => (
                <TableRow
                  key={run.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/project/${run.projectId}/run/${run.id}`)}
                >
                  <TableCell className="font-mono text-xs text-primary font-medium">
                    {run.startedAt
                      ? new Date(run.startedAt).toLocaleString("fr-FR")
                      : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {run.projectName}
                  </TableCell>
                  <TableCell>
                    {run.flowLabel ? (
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {run.flowLabel}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={run.status} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-right">
                    {formatDuration(run.durationMs)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

        </div>
      )}
    </div>
  );
}
