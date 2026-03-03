import {
  Globe,
  ExternalLink,
  Camera,
  ClipboardCheck,
  MousePointer,
  Terminal,
  Wifi,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  launch_browser: Globe,
  navigate: ExternalLink,
  screenshot: Camera,
  page_audit: ClipboardCheck,
  click_first_match: MousePointer,
  click: MousePointer,
  check_console: Terminal,
  check_network: Wifi,
};

export function StepActionIcon({
  action,
  className,
}: {
  action: string;
  className?: string;
}) {
  const Icon = iconMap[action] || CircleDot;
  return <Icon className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground", className)} />;
}
