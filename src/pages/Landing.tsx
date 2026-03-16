import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Check,
  X,
  ArrowDown,
  Globe,
  MousePointerClick,
  Layout,
  Zap,
  AlertTriangle,
  ChevronRight,
  Terminal,
  Rocket,
  Search,
  ToggleRight,
  CheckCircle,
  XCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  NAVBAR                                                             */
/* ------------------------------------------------------------------ */
function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight text-primary">
          <Shield className="h-4 w-4" />
          Sentinelle
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
          <a href="#how" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How it works</a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
          <a href="#how" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Docs</a>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/login">Connexion</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/signup">Create account</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  HERO                                                               */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section className="py-28 text-center">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
          Deploy with confidence.
          <br />
          <span className="text-primary">Sentinelle checks your app after every publish.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Sentinelle automatically verifies your critical user flows and important pages after each deploy to detect what breaks before your users do.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link to="/signup">
              Start monitoring my app <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/login">Connexion</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Free plan available.</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  PRODUCT PREVIEW                                                    */
/* ------------------------------------------------------------------ */
function ProductPreview() {
  const lines = [
    { text: "Publish detected", status: "info" },
    { text: "Running checks...", status: "info" },
    { text: "Login flow", status: "ok" },
    { text: "Dashboard page", status: "ok" },
    { text: "API requests", status: "ok" },
    { text: "Create project button broken", status: "error" },
    { text: "Alert triggered", status: "alert" },
  ];

  return (
    <section className="pb-16">
      <div className="mx-auto max-w-lg px-4">
        <Card className="overflow-hidden border-border">
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">sentinelle run #342</span>
          </div>
          <CardContent className="p-4 text-left font-mono text-sm space-y-0.5">
            {lines.map((l, i) => (
              <div
                key={i}
                className={
                  l.status === "ok"
                    ? "text-primary"
                    : l.status === "error"
                    ? "text-destructive font-bold"
                    : l.status === "alert"
                    ? "text-destructive font-bold"
                    : "text-muted-foreground"
                }
              >
                {l.status === "ok" && "✓ "}
                {l.status === "error" && "✗ "}
                {l.status === "info" && "→ "}
                {l.status === "alert" && "⚠ "}
                {l.text}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  PROBLEM                                                            */
/* ------------------------------------------------------------------ */
const problemSteps = [
  { label: "Deploy", icon: Rocket },
  { label: "Login works normally", icon: CheckCircle },
  { label: "A new release breaks the login", icon: AlertTriangle },
  { label: "Users report the bug", icon: XCircle },
];

function Problem() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Every deploy can break something.</h2>
        <p className="mt-4 text-muted-foreground">
          Modern web apps evolve fast. A new deploy can silently break a login, a button or a critical page. Most teams discover the problem only when users report it.
        </p>

        <div className="mx-auto mt-12 flex max-w-xs flex-col items-center gap-2">
          {problemSteps.map((s, i) => (
            <div key={i} className="w-full">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <s.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium">{s.label}</span>
              </div>
              {i < problemSteps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  BEFORE / AFTER                                                     */
/* ------------------------------------------------------------------ */
function BeforeAfter() {
  const without = ["Deploy", "Users encounter bugs", "Support tickets", "Hotfix deploys", "Lost trust"];
  const withS = ["Deploy", "Sentinelle detects the publish", "Automated checks run", "Alert if something breaks"];

  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight">With and without Sentinelle</h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Without Sentinelle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {without.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                  {s}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg text-primary">With Sentinelle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {withS.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                  {s}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FEATURES                                                           */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: MousePointerClick,
    title: "User flows",
    desc: "Sentinelle runs real user flows such as login, navigation and key actions. This ensures that critical functionality still works after a deploy.",
    examples: ["Login", "Navigation", "Actions"],
    result: "✓ Flow validated",
    resultAlt: "⚠ Flow interrupted",
  },
  {
    icon: Layout,
    title: "Critical pages",
    desc: "Sentinelle verifies that important pages remain accessible and stable after deploy.",
    examples: ["Dashboard", "Admin pages", "Product pages"],
    checks: ["Page loads correctly", "No console errors", "No failed requests"],
  },
  {
    icon: ToggleRight,
    title: "Interface elements",
    desc: "Sentinelle verifies that important interface elements remain usable.",
    examples: ["Buttons", "Navigation elements", "Key actions"],
  },
];

function Features() {
  return (
    <section id="features" className="border-t border-border py-24">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight">What Sentinelle verifies</h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="text-sm text-muted-foreground">{f.desc}</p>
                <div className="space-y-1">
                  {f.examples.map((e, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <Check className="h-3 w-3 text-primary" /> {e}
                    </div>
                  ))}
                </div>
                {f.checks && (
                  <div className="mt-auto space-y-1 rounded-md bg-muted/50 p-3">
                    {f.checks.map((c, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-primary" /> {c}
                      </div>
                    ))}
                  </div>
                )}
                {f.result && (
                  <div className="mt-auto space-y-1">
                    <Badge className="bg-primary/10 text-primary border-primary/20">{f.result}</Badge>
                    <Badge variant="outline" className="ml-2 border-status-alerte/30 text-status-alerte">{f.resultAlt}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  HOW IT WORKS                                                       */
/* ------------------------------------------------------------------ */
const steps = [
  { icon: Globe, title: "Connect your app", desc: "Add your project URL." },
  { icon: Search, title: "Sentinelle discovers flows", desc: "Login, internal pages and actions." },
  { icon: ToggleRight, title: "Choose what to monitor", desc: "User flows, critical pages and interface elements." },
  { icon: Zap, title: "Publish safely", desc: "Sentinelle verifies your app automatically." },
];

function HowItWorks() {
  return (
    <section id="how" className="border-t border-border py-24">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight">Setup in minutes</h2>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Setup time: about 2 minutes. No test scripts required.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-lg font-bold text-primary">
                {i + 1}
              </div>
              <div className="mt-4 flex justify-center">
                <s.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-2 text-sm font-semibold">{s.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  BUG DETECTION                                                      */
/* ------------------------------------------------------------------ */
function BugDetection() {
  const lines = [
    { text: "Publish detected", status: "info" },
    { text: "Running checks...", status: "info" },
    { text: "Login flow", status: "ok" },
    { text: "Dashboard page", status: "ok" },
    { text: "API requests", status: "ok" },
    { text: "Create project button broken", status: "error" },
    { text: "Alert triggered", status: "alert" },
  ];

  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight">A bug detected in seconds</h2>
        <p className="mt-4 text-muted-foreground">
          Alert detected before users encounter the bug.
        </p>

        <Card className="mx-auto mt-10 max-w-lg overflow-hidden border-border">
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">sentinelle — run #342</span>
          </div>
          <CardContent className="p-4 text-left font-mono text-sm space-y-0.5">
            {lines.map((l, i) => (
              <div
                key={i}
                className={
                  l.status === "ok"
                    ? "text-primary"
                    : l.status === "error"
                    ? "text-destructive font-bold"
                    : l.status === "alert"
                    ? "text-destructive font-bold"
                    : "text-muted-foreground"
                }
              >
                {l.status === "ok" && "✓ "}
                {l.status === "error" && "✗ "}
                {l.status === "info" && "→ "}
                {l.status === "alert" && "⚠ "}
                {l.text}
              </div>
            ))}
          </CardContent>
        </Card>
        <p className="mt-4 text-sm text-muted-foreground">
          Sentinelle detects issues before users encounter them.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  COMPARISON TABLE                                                   */
/* ------------------------------------------------------------------ */
function CellCheck() {
  return <Check className="mx-auto h-4 w-4 text-primary" />;
}
function CellX() {
  return <X className="mx-auto h-4 w-4 text-muted-foreground/40" />;
}
function CellText({ children }: { children: React.ReactNode }) {
  return <span className="text-xs">{children}</span>;
}

const compRows = [
  { label: "Detect deploy automatically", s: true, c: false, m: false, d: false, p: false },
  { label: "Automatic flow discovery", s: true, c: false, m: false, d: false, p: false },
  { label: "Full UI automation", s: "Limited", c: true, m: true, d: false, p: true },
  { label: "Infrastructure monitoring", s: false, c: false, m: false, d: true, p: false },
  { label: "Ease of setup", s: "Very easy", c: "Complex", m: "Medium", d: "Medium", p: "Difficult" },
  { label: "Maintenance required", s: "None", c: "High", m: "Medium", d: "Medium", p: "Very high" },
];

function Comparison() {
  const renderCell = (v: boolean | string) => {
    if (v === true) return <CellCheck />;
    if (v === false) return <CellX />;
    return <CellText>{v}</CellText>;
  };

  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight">How Sentinelle compares</h2>

        <div className="mt-12 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]" />
                <TableHead className="text-center font-bold text-primary">Sentinelle</TableHead>
                <TableHead className="text-center">Cypress</TableHead>
                <TableHead className="text-center">Maestro</TableHead>
                <TableHead className="text-center">Datadog</TableHead>
                <TableHead className="text-center">Custom Playwright</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compRows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{r.label}</TableCell>
                  <TableCell className="text-center">{renderCell(r.s)}</TableCell>
                  <TableCell className="text-center">{renderCell(r.c)}</TableCell>
                  <TableCell className="text-center">{renderCell(r.m)}</TableCell>
                  <TableCell className="text-center">{renderCell(r.d)}</TableCell>
                  <TableCell className="text-center">{renderCell(r.p)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  PRICING                                                            */
/* ------------------------------------------------------------------ */
const plans = [
  {
    name: "Free",
    price: "0€",
    desc: "",
    features: ["1 project", "10 checks per month", "Manual tests", "Basic monitoring"],
    highlight: false,
  },
  {
    name: "Maker",
    price: "12€",
    period: "/month",
    desc: "Perfect for indie makers and side projects.",
    features: ["5 projects", "200 checks per month", "Automatic publish detection", "Alerts", "History"],
    highlight: true,
  },
  {
    name: "Startup",
    price: "39€",
    period: "/month",
    desc: "",
    features: ["20 projects", "1 000 checks per month", "Parallel tests", "Advanced history", "Trace downloads"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "99€",
    period: "/month",
    desc: "",
    features: ["Unlimited projects", "5 000 checks per month", "Priority execution", "Priority support"],
    highlight: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="border-t border-border py-24">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight">Simple pricing</h2>
        <p className="mt-4 text-center text-muted-foreground">
          Pricing depends on number of projects and checks per month.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p, i) => (
            <Card
              key={i}
              className={
                p.highlight
                  ? "relative border-primary shadow-[0_0_30px_-10px_hsl(var(--primary)/0.3)]"
                  : ""
              }
            >
              {p.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{p.name}</CardTitle>
                {p.desc && <p className="text-xs text-muted-foreground">{p.desc}</p>}
                <div className="mt-2">
                  <span className="text-3xl font-extrabold">{p.price}</span>
                  {p.period && <span className="text-sm text-muted-foreground">{p.period}</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {p.features.map((f, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {f}
                  </div>
                ))}
                <Button
                  variant={p.highlight ? "default" : "outline"}
                  size="sm"
                  className="mt-4 w-full"
                  asChild
                >
                  <Link to="/signup">Get started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FINAL CTA                                                          */
/* ------------------------------------------------------------------ */
function FinalCta() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-2xl px-4">
        <Card className="border-primary/30 bg-card p-8 text-center shadow-[0_0_40px_-15px_hsl(var(--primary)/0.2)]">
          <h2 className="text-3xl font-bold tracking-tight">Stop deploying blindly.</h2>
          <p className="mt-4 text-muted-foreground">
            Sentinelle verifies your application after every deploy.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">Start monitoring my app</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">Connexion</Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FOOTER                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
  return (
    <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
      © 2025 Sentinelle
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  LANDING PAGE                                                       */
/* ------------------------------------------------------------------ */
export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <ProductPreview />
      <Problem />
      <BeforeAfter />
      <Features />
      <HowItWorks />
      <BugDetection />
      <Comparison />
      <Pricing />
      <FinalCta />
      <Footer />
    </div>
  );
}
