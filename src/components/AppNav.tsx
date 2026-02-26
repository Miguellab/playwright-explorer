import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Terminal, Play, List, Settings } from "lucide-react";

const links = [
  { to: "/", label: "Home", icon: Terminal },
  { to: "/runner", label: "Runner", icon: Play },
  { to: "/runs", label: "History", icon: List },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight text-primary">
          <Terminal className="h-4 w-4" />
          CrowdTest
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === to
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
