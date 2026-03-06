import type { SiteAnalysis } from "@/lib/sentinelle-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Globe,
  Users,
  Zap,
  Route,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { useState } from "react";

const SITE_TYPE_LABELS: Record<string, string> = {
  saas: "SaaS",
  ecommerce: "E-commerce",
  vitrine: "Vitrine",
  blog: "Blog",
  marketplace: "Marketplace",
  webapp: "Web App",
  landing: "Landing Page",
  other: "Autre",
};

interface Props {
  analysis: SiteAnalysis;
}

export function SiteAnalysisSection({ analysis }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="font-mono text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Analyse du site
            </CardTitle>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-5 pt-0">
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="font-mono text-xs">
                  {SITE_TYPE_LABELS[analysis.siteType] || analysis.siteType}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{analysis.sitePurpose}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{analysis.targetAudience}</span>
              </div>
            </div>

            {/* Key features */}
            {analysis.keyFeatures?.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-mono text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Fonctionnalités clés
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.keyFeatures.map((f, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-[10px]">
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Cross-page analysis */}
            {analysis.crossPageAnalysis && (
              <div className="space-y-3">
                <p className="font-mono text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Analyse cross-page
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded border bg-secondary/20 p-3 space-y-1">
                    <p className="font-mono text-[10px] text-muted-foreground">Cohérence navigation</p>
                    <p className="text-xs">{analysis.crossPageAnalysis.navigationConsistency}</p>
                  </div>
                  <div className="rounded border bg-secondary/20 p-3 space-y-1">
                    <p className="font-mono text-[10px] text-muted-foreground">Cohérence design</p>
                    <p className="text-xs">{analysis.crossPageAnalysis.designConsistency}</p>
                  </div>
                </div>

                {analysis.crossPageAnalysis.criticalPaths?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                      <Route className="h-3 w-3" /> Parcours critiques
                    </p>
                    <ul className="space-y-1">
                      {analysis.crossPageAnalysis.criticalPaths.map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs">
                          <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-status-pass" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.crossPageAnalysis.missingPages?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Pages manquantes suggérées
                    </p>
                    <ul className="space-y-1">
                      {analysis.crossPageAnalysis.missingPages.map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-status-pending" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Pages */}
            {analysis.pages?.length > 0 && (
              <div className="space-y-2">
                <p className="font-mono text-xs font-semibold text-muted-foreground">
                  Pages analysées ({analysis.pages.length})
                </p>
                <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                  {analysis.pages.map((page, i) => (
                    <div key={i} className="rounded border bg-secondary/20 px-3 py-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold">{page.label}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {page.role}
                        </Badge>
                      </div>
                      {page.interactiveElements && page.interactiveElements.length > 0 && (
                        <p className="font-mono text-[10px] text-muted-foreground">
                          Éléments : {page.interactiveElements.join(", ")}
                        </p>
                      )}
                      {page.uxIssues && page.uxIssues.length > 0 && (
                        <div className="space-y-0.5">
                          {page.uxIssues.map((issue, j) => (
                            <p key={j} className="font-mono text-[10px] text-status-pending flex items-center gap-1">
                              <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                              {issue}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
