import Image from "next/image";
import { useState } from "react";

/**
 * RemoteImage — next/image wrapper (fill) with a graceful fallback for missing/404
 * Supabase buffalo photos. Mirrors the legacy `imageUri ?? /images/logo.png` behaviour.
 * The parent must be `relative` (BuffaloCard / hero panels already are).
 */
export interface RemoteImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallback?: string;
}

export function RemoteImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 50vw, 400px",
  priority,
  fallback = "/images/logo.png",
}: RemoteImageProps) {
  const [errored, setErrored] = useState(false);
  const resolved = errored || !src ? fallback : src;
  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}
