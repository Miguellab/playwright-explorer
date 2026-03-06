import { useState } from "react";
import { AuthImage } from "@/components/AuthImage";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getScreenshotUrl } from "@/lib/sentinelle-api";
import { Camera } from "lucide-react";

interface Screenshot {
  label: string;
  filename: string;
  path: string;
}

interface EvidenceViewerProps {
  screenshots: Screenshot[];
  className?: string;
}

export function EvidenceViewer({ screenshots, className }: EvidenceViewerProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  if (!screenshots || screenshots.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <Camera className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Captures d'écran</h3>
        <span className="text-xs text-muted-foreground">({screenshots.length})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {screenshots.map((shot, i) => (
          <button
            key={i}
            type="button"
            className="rounded-lg border border-border bg-surface overflow-hidden hover:border-primary/30 transition-colors text-left"
            onClick={() => setLightboxSrc(getScreenshotUrl(shot.path))}
          >
            <AuthImage url={getScreenshotUrl(shot.path)} alt={shot.label} />
            <p className="px-3 py-2 text-xs text-muted-foreground">{shot.label}</p>
          </button>
        ))}
      </div>

      <Dialog open={!!lightboxSrc} onOpenChange={() => setLightboxSrc(null)}>
        <DialogContent className="max-w-4xl p-2 bg-background">
          {lightboxSrc && <AuthImage url={lightboxSrc} alt="Screenshot" className="rounded" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
