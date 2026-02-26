import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppNav } from "@/components/AppNav";
import { Globe, Play, FileText, AlertTriangle } from "lucide-react";

const steps = [
  { icon: Globe, title: "Add URL", desc: "Paste your Lovable site URL" },
  { icon: Play, title: "Run Test", desc: "Execute a smoke journey scenario" },
  { icon: FileText, title: "View Report", desc: "Get an instant HTML test report" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="container py-20">
        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="font-mono text-4xl font-bold tracking-tight md:text-5xl">
            Automated CrowdTesting
            <br />
            <span className="text-primary">with Playwright</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Run a real user journey on your Lovable site and get an instant HTML report.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="font-mono">
              <Link to="/runner">Run your first test</Link>
            </Button>
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto mt-24 grid max-w-3xl gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="rounded-lg border bg-card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-3 font-mono text-sm font-semibold">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </section>

        {/* Demo banner */}
        <div className="mx-auto mt-16 flex max-w-xl items-center gap-3 rounded-lg border border-status-skipped/30 bg-status-skipped/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-status-skipped" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Demo MVP</strong> — do not use with sensitive data.
          </p>
        </div>
      </main>
    </div>
  );
}
