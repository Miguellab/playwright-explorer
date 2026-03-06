import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { ReleaseVerdict } from "@/lib/sentinelle-types";

const verdictConfig: Record<ReleaseVerdict, {
  label: string;
  headline: string;
  icon: typeof CheckCircle;
  className: string;
  bgClassName: string;
}> = {
  OK: {
    label: "PRÊT À PUBLIER",
    headline: "Tout fonctionne correctement",
    icon: CheckCircle,
    className: "text-status-safe",
    bgClassName: "bg-status-safe/10 border-status-safe/20",
  },
  ALERTE: {
    label: "ALERTE DÉTECTÉE",
    headline: "Des anomalies ont été détectées",
    icon: AlertTriangle,
    className: "text-status-alerte",
    bgClassName: "bg-status-alerte/10 border-status-alerte/20",
  },
  ERREUR: {
    label: "APPLICATION CASSÉE",
    headline: "Le parcours principal a échoué",
    icon: XCircle,
    className: "text-status-erreur",
    bgClassName: "bg-status-erreur/10 border-status-erreur/20",
  },
  PENDING: {
    label: "EN ATTENTE",
    headline: "Vérification en cours…",
    icon: Clock,
    className: "text-status-pending",
    bgClassName: "bg-status-pending/10 border-status-pending/20",
  },
};

interface VerdictBadgeProps {
  verdict: ReleaseVerdict;
  size?: "sm" | "lg";
  className?: string;
}

export function VerdictBadge({ verdict, size = "sm", className }: VerdictBadgeProps) {
  const config = verdictConfig[verdict];
  const Icon = config.icon;

  if (size === "lg") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "rounded-xl border p-8 text-center",
          config.bgClassName,
          verdict === "PENDING" && "animate-pulse-neon",
          className
        )}
      >
        <Icon className={cn("h-12 w-12 mx-auto mb-4", config.className)} />
        <h2 className={cn("text-2xl font-bold tracking-tight", config.className)}>
          {config.label}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{config.headline}</p>
      </motion.div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold tracking-wide",
        config.bgClassName,
        config.className,
        verdict === "PENDING" && "animate-pulse-neon",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {verdict}
    </span>
  );
}
