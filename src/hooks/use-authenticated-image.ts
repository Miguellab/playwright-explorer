import { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_SENTINELLE_API_URL || "";
const API_KEY = import.meta.env.VITE_SENTINELLE_API_KEY || "";
const RUNNER_URL = import.meta.env.VITE_DEFAULT_RUNNER_URL || "";
const RUNNER_KEY = import.meta.env.VITE_DEFAULT_RUNNER_KEY || "";

export function useAuthenticatedImage(url: string) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) {
      setError(true);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    fetch(url, {
      headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {},
    })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`${r.status}`))))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return { src, loading: !src && !error, error };
}
