import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { StatusBadge } from "@/components/StatusBadge";
import { listTestRuns } from "@/lib/api";
import type { TestRun } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExternalLink, Loader2 } from "lucide-react";

export default function Runs() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTestRuns(20).then(setRuns).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="container max-w-4xl py-10">
        <h1 className="font-mono text-2xl font-bold">Run History</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last 20 test runs.</p>

        {loading ? (
          <div className="mt-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : runs.length === 0 ? (
          <div className="mt-16 text-center font-mono text-sm text-muted-foreground">No runs yet. <Link to="/runner" className="text-primary hover:underline">Run your first test.</Link></div>
        ) : (
          <div className="mt-6 rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-xs">Site URL</TableHead>
                  <TableHead className="font-mono text-xs">Date</TableHead>
                  <TableHead className="font-mono text-xs">Status</TableHead>
                  <TableHead className="font-mono text-xs">Duration</TableHead>
                  <TableHead className="font-mono text-xs" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="max-w-[200px] truncate font-mono text-xs">{run.site_url}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{new Date(run.created_at).toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={run.status} /></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild className="font-mono text-xs">
                        <Link to={`/runs/${run.id}`}><ExternalLink className="h-3 w-3" /> View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
