import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { Verdict } from "@/lib/sentinelle-types";

const config: Record<Verdict, { label: string; icon: typeof CheckCircle; className: string }> = {
  OK: {
    label: "OK",
    icon: CheckCircle,
    className: "bg-status-pass/15 text-status-pass border-status-pass/30",
  },
  ALERTE: {
    label: "ALERTE",
    icon: AlertTriangle,
    className: "bg-status-skipped/15 text-status-skipped border-status-skipped/30",
  },
  ERREUR: {
    label: "ERREUR",
    icon: XCircle,
    className: "bg-status-fail/15 text-status-fail border-status-fail/30",
  },
};

export function VerdictBadge({
  verdict,
  size = "sm",
  explanation,
}: {
  verdict: Verdict;
  size?: "sm" | "lg";
  explanation?: string;
}) {
  const c = config[verdict] || config.OK;
  const Icon = c.icon;
  const isLg = size === "lg";

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border font-mono font-semibold uppercase tracking-wider",
        isLg ? "px-4 py-2 text-base" : "px-2 py-0.5 text-xs",
        c.className,
      )}
    >
      <Icon className={isLg ? "h-5 w-5" : "h-3.5 w-3.5"} />
      {c.label}
    </span>
  );

  if (!explanation) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs font-mono text-xs">{explanation}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function VerdictText({ verdict }: { verdict: Verdict }) {
  const texts: Record<string, string> = {
    OK: "Tout est bon, vous pouvez publier en confiance.",
    ALERTE: "Attention, quelque chose pourrait gêner vos utilisateurs.",
    ERREUR: "Votre application n'a pas pu être validée.",
  };
  const colors: Record<string, string> = {
    OK: "text-status-pass",
    ALERTE: "text-status-skipped",
    ERREUR: "text-status-fail",
  };
  return <p className={cn("font-mono text-sm", colors[verdict] || "text-muted-foreground")}>{texts[verdict] || verdict}</p>;
}
