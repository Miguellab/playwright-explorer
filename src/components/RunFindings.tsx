import { Terminal, WifiOff, AlertTriangle, Info } from "lucide-react";
import type { Findings } from "@/lib/sentinelle-types";
import { cn } from "@/lib/utils";

interface RunFindingsProps {
  findings: Findings;
  className?: string;
}

const MAX_SHOWN = 5;

export function RunFindings({ findings, className }: RunFindingsProps) {
  const consoleErrors = findings?.consoleErrors ?? [];
  const failedRequests = (findings?.failedRequests ?? []).filter((r) => r.status >= 400 || r.status === 0);

  const hasFindings = consoleErrors.length > 0 || failedRequests.length > 0;

  if (!hasFindings) {
    return (
      <p className={cn("text-xs text-muted-foreground italic", className)}>
        Aucun détail technique disponible
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Console errors */}
      {consoleErrors.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-status-erreur" />
            <span className="text-xs font-medium text-status-erreur">
              Erreurs console ({consoleErrors.length})
            </span>
          </div>
          {consoleErrors.slice(0, MAX_SHOWN).map((err, i) => (
            <div key={i} className="rounded border border-status-erreur/15 bg-status-erreur/5 px-3 py-2">
              <code className="text-xs text-foreground/80 break-all block">{err.text}</code>
              {err.url && (
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{err.url}</p>
              )}
            </div>
          ))}
          {consoleErrors.length > MAX_SHOWN && (
            <p className="text-xs text-muted-foreground">
              …et {consoleErrors.length - MAX_SHOWN} autre{consoleErrors.length - MAX_SHOWN > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* Failed requests */}
      {failedRequests.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-status-alerte" />
            <span className="text-xs font-medium text-status-alerte">
              Requêtes en échec ({failedRequests.length})
            </span>
          </div>
          {failedRequests.slice(0, MAX_SHOWN).map((req, i) => {
            const isNetworkError = req.status === 0;
            return (
              <div
                key={i}
                className={cn(
                  "rounded border px-3 py-2",
                  isNetworkError
                    ? "border-status-erreur/15 bg-status-erreur/5"
                    : "border-status-alerte/15 bg-status-alerte/5"
                )}
              >
                <span className="text-xs font-mono text-foreground/80 break-all block">
                  {req.method || "GET"} {req.url} —{" "}
                  {isNetworkError ? (
                    <span className="text-status-erreur">Erreur réseau</span>
                  ) : (
                    <span className="text-status-alerte">{req.status}</span>
                  )}
                </span>
              </div>
            );
          })}
          {failedRequests.length > MAX_SHOWN && (
            <p className="text-xs text-muted-foreground">
              …et {failedRequests.length - MAX_SHOWN} autre{failedRequests.length - MAX_SHOWN > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
