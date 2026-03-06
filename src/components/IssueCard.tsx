import { AlertTriangle, WifiOff, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsoleError, FailedRequest } from "@/lib/sentinelle-types";

interface IssueCardProps {
  type: "console" | "network";
  consoleError?: ConsoleError;
  failedRequest?: FailedRequest;
}

export function IssueCard({ type, consoleError, failedRequest }: IssueCardProps) {
  if (type === "console" && consoleError) {
    return (
      <div className="rounded-lg border border-status-erreur/20 bg-status-erreur/5 p-3 space-y-1">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-status-erreur shrink-0" />
          <span className="text-xs font-medium text-status-erreur">Erreur console</span>
        </div>
        <code className="text-xs text-foreground/80 block break-all">{consoleError.text}</code>
        {consoleError.url && (
          <p className="text-[10px] text-muted-foreground truncate">{consoleError.url}</p>
        )}
      </div>
    );
  }

  if (type === "network" && failedRequest) {
    const isNetworkError = failedRequest.status === 0;
    return (
      <div className={cn(
        "rounded-lg border p-3 space-y-1",
        isNetworkError ? "border-status-erreur/20 bg-status-erreur/5" : "border-status-alerte/20 bg-status-alerte/5"
      )}>
        <div className="flex items-center gap-2">
          {isNetworkError ? (
            <WifiOff className="h-3.5 w-3.5 text-status-erreur shrink-0" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-status-alerte shrink-0" />
          )}
          <span className={cn("text-xs font-medium", isNetworkError ? "text-status-erreur" : "text-status-alerte")}>
            {failedRequest.method && `${failedRequest.method} `}
            {isNetworkError ? "Erreur réseau" : `Status ${failedRequest.status}`}
          </span>
          {failedRequest.resourceType && (
            <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">{failedRequest.resourceType}</span>
          )}
        </div>
        <p className="text-xs text-foreground/80 truncate">{failedRequest.url}</p>
        {isNetworkError && failedRequest.errorText && (
          <p className="text-[10px] text-status-erreur">{failedRequest.errorText}</p>
        )}
      </div>
    );
  }

  return null;
}
