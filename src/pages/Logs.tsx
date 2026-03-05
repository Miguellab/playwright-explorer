import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listProjects, listRuns } from "@/lib/sentinelle-api";
import type { Project, Run } from "@/lib/sentinelle-types";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
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

  const projectNames = useMemo(
    () => [...new Set(rows.map((r) => r.projectName))].sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((run) => {
      if (q && !run.projectName.toLowerCase().includes(q) && !(run.flowLabel || "").toLowerCase().includes(q) && !run.status.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && run.status !== statusFilter) return false;
      if (projectFilter !== "all" && run.projectName !== projectFilter) return false;
      if (dateStart) {
        const d = run.startedAt || run.finishedAt;
        if (!d || d < dateStart) return false;
      }
      if (dateEnd) {
        const d = run.startedAt || run.finishedAt;
        if (!d || d.slice(0, 10) > dateEnd) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, projectFilter, dateStart, dateEnd]);

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

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-mono text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] font-mono text-sm">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px] font-mono text-sm">
            <SelectValue placeholder="Projet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {projectNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateStart}
          onChange={(e) => setDateStart(e.target.value)}
          className="w-[150px] font-mono text-sm"
          placeholder="Date début"
        />
        <Input
          type="date"
          value={dateEnd}
          onChange={(e) => setDateEnd(e.target.value)}
          className="w-[150px] font-mono text-sm"
          placeholder="Date fin"
        />
      </div>

      {filteredRows.length !== rows.length && (
        <p className="mt-2 text-xs text-muted-foreground font-mono">
          {filteredRows.length} résultat{filteredRows.length !== 1 ? "s" : ""} sur {rows.length}
        </p>
      )}

      {filteredRows.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground font-mono">Aucun run correspondant.</p>
      ) : (
        <div className="mt-4">
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
              {filteredRows.map((run) => (
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
