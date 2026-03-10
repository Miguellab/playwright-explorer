import type { SuggestedFlow } from "@/lib/sentinelle-types";

export type CheckType = "user-flow" | "page-check" | "ui-element";

const USER_FLOW_GOALS = ["LOGIN", "SIGNUP", "BOOK", "BUY", "CONTACT"];

export function getCheckType(flow: SuggestedFlow): CheckType {
  if (USER_FLOW_GOALS.includes(flow.goal)) return "user-flow";
  if (flow.source === "detected") return "user-flow";
  if (flow.source === "nav-link" || flow.source === "cta-link" || flow.source === "page-link") return "page-check";
  if (flow.source === "button") return "ui-element";
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
    description: "Sentinelle exécute un parcours utilisateur complet.",
    badgeLabel: "Parcours utilisateur",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    sectionClass: "border-emerald-500/20",
  },
  "page-check": {
    title: "Pages critiques",
    description: "Sentinelle vérifie que ces pages restent accessibles après publication.",
    badgeLabel: "Page critique",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    sectionClass: "border-blue-500/20",
  },
  "ui-element": {
    title: "Éléments d'interface",
    description: "Sentinelle vérifie que les éléments essentiels de l'interface sont présents et fonctionnels.",
    badgeLabel: "Élément interface",
    badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    sectionClass: "border-purple-500/20",
  },
};

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
