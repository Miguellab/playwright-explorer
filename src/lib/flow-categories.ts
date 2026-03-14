import type { SuggestedFlow, FlowCategory } from "@/lib/sentinelle-types";
import type { RunStatus } from "@/lib/sentinelle-types";

export type CheckType = "user-flow" | "page-check" | "ui-element";

const CATEGORY_TO_CHECK: Record<string, CheckType> = {
  auth: "user-flow",
  transactional: "user-flow",
  core: "page-check",
  content: "page-check",
  settings: "page-check",
  infra: "ui-element",
};

const USER_FLOW_GOALS = ["LOGIN", "SIGNUP", "BOOK", "BUY", "CONTACT"];

export function getCheckType(flow: SuggestedFlow): CheckType {
  // Prefer API category field
  if (flow.category && CATEGORY_TO_CHECK[flow.category]) {
    return CATEGORY_TO_CHECK[flow.category];
  }
  // Fallback to goal/source heuristics
  if (USER_FLOW_GOALS.includes(flow.goal)) return "user-flow";
  const source = flow.source as string | undefined;
  if (source === "detected") return "user-flow";
  if (source === "nav-link" || source === "cta-link" || source === "page-link") return "page-check";
  if (source === "button") return "ui-element";
  return "user-flow";
}

export const CHECK_TYPE_META: Record<CheckType, {
  title: string;
  description: string;
  badgeLabel: string;
  badgeClass: string;
  sectionClass: string;
}> = {
  "user-flow": {
    title: "Parcours utilisateur",
    description: "Sentinelle exécute une action utilisateur réelle sur votre application.",
    badgeLabel: "Parcours utilisateur",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    sectionClass: "border-emerald-500/20",
  },
  "page-check": {
    title: "Pages critiques",
    description: "Sentinelle vérifie que ces pages restent accessibles et stables après publication.",
    badgeLabel: "Page critique",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    sectionClass: "border-blue-500/20",
  },
  "ui-element": {
    title: "Éléments d'interface",
    description: "Sentinelle vérifie que les éléments essentiels de l'interface sont présents et utilisables.",
    badgeLabel: "Élément interface",
    badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    sectionClass: "border-purple-500/20",
  },
};

export function getStatusMessage(
  checkType: CheckType,
  status: RunStatus | string,
  errorSummary?: string | null
): string {
  if (checkType === "user-flow") {
    if (status === "passed") return "Parcours validé";
    if (status === "failed") return errorSummary ? `Parcours échoué — ${errorSummary}` : "Parcours échoué";
    if (status === "error") return "Erreur d'exécution";
    return "En cours…";
  }
  if (checkType === "page-check") {
    if (status === "passed") return "Page accessible — Aucune erreur détectée";
    if (status === "failed") return errorSummary ? `Page inaccessible — ${errorSummary}` : "Page inaccessible";
    if (status === "error") return "Erreur lors de la vérification";
    return "En cours…";
  }
  // ui-element
  if (status === "passed") return "Élément présent — Aucune erreur détectée";
  if (status === "failed") return errorSummary ? `Élément absent ou non fonctionnel — ${errorSummary}` : "Élément absent ou non fonctionnel";
  if (status === "error") return "Erreur lors de la vérification";
  return "En cours…";
}

export function groupFlowsByType(flows: SuggestedFlow[]): Record<CheckType, SuggestedFlow[]> {
  const groups: Record<CheckType, SuggestedFlow[]> = {
    "user-flow": [],
    "page-check": [],
    "ui-element": [],
  };
  for (const flow of flows) {
    groups[getCheckType(flow)].push(flow);
  }
  return groups;
}

/** Check if a flow is eligible for main flow selection */
export function isMainFlowEligible(flow: SuggestedFlow): boolean {
  if (flow.category) {
    return ["auth", "transactional", "core"].includes(flow.category);
  }
  // Fallback
  const type = getCheckType(flow);
  return type === "user-flow" || type === "page-check";
}
