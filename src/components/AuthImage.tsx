import { useAuthenticatedImage } from "@/hooks/use-authenticated-image";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AuthImageProps {
  url: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function AuthImage({ url, alt, className, onClick }: AuthImageProps) {
  const { src, loading, error } = useAuthenticatedImage(url);

  if (loading) {
    return <Skeleton className={cn("w-full h-40", className)} />;
  }

  if (error || !src) {
    return (
      <div className={cn("flex items-center justify-center h-32 text-muted-foreground font-mono text-xs", className)}>
        Image non disponible
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("w-full h-auto object-contain", className)}
      onClick={onClick}
    />
  );
}
