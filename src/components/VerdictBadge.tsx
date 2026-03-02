import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, XCircle } from "lucide-react";
import type { Verdict } from "@/lib/sentinelle-types";

const config: Record<Verdict, { label: string; icon: typeof Shield; className: string }> = {
  SAFE: {
    label: "SAFE",
    icon: Shield,
    className: "bg-status-pass/15 text-status-pass border-status-pass/30",
  },
  RISKY: {
    label: "RISKY",
    icon: AlertTriangle,
    className: "bg-status-skipped/15 text-status-skipped border-status-skipped/30",
  },
  FAILED: {
    label: "FAILED",
    icon: XCircle,
    className: "bg-status-fail/15 text-status-fail border-status-fail/30",
  },
};

export function VerdictBadge({
  verdict,
  size = "sm",
}: {
  verdict: Verdict;
  size?: "sm" | "lg";
}) {
  const c = config[verdict];
  const Icon = c.icon;
  const isLg = size === "lg";

  return (
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
}

export function VerdictText({ verdict }: { verdict: Verdict }) {
  const texts: Record<Verdict, string> = {
    SAFE: "Tout est bon, vous pouvez publier en confiance.",
    RISKY: "Attention, quelque chose pourrait gêner vos utilisateurs.",
    FAILED: "Votre application n'a pas pu être validée.",
  };
  const colors: Record<Verdict, string> = {
    SAFE: "text-status-pass",
    RISKY: "text-status-skipped",
    FAILED: "text-status-fail",
  };
  return <p className={cn("font-mono text-sm", colors[verdict])}>{texts[verdict]}</p>;
}
