import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { RemoteImageProps } from "./RemoteImage";
import { usePublishedPhoto } from "./PhotoRefresh";
import { acquirePhotoCandidate } from "../../utils/photo-candidates";
import type { PhotoIdentity } from "../../utils/photo-coordinator";

export type BuffaloPhotoProps = Pick<
  RemoteImageProps,
  "src" | "alt" | "sizes" | "priority" | "fallback"
> & PhotoIdentity & { stale?: boolean };

/** Identity photos show the entire source, unlike decorative covers and avatars.
 * The 4px inset clears a 12px rounded photo clip, even for edge-filled sources.
 * Parent owns the fixed geometry/background; callers cannot add crop or zoom.
 */
export function BuffaloPhoto(props: BuffaloPhotoProps) {
  const photo = usePublishedPhoto(props, props.src, props.stale);
  return <><span ref={photo.ref} hidden /><PhotoFrame key={photo.identityKey || props.src || "missing"} {...props}
    src={photo.imageUrl} visible={photo.visible} attempt={photo.attempt} /></>;
}

function PhotoFrame({ src, alt, sizes = "(max-width: 768px) 50vw, 400px", priority, fallback = "/images/logo.png", visible, attempt }: BuffaloPhotoProps & { visible: boolean; attempt: number }) {
  const [good, setGood] = useState(src || fallback);
  const [failed, setFailed] = useState(false);
  const [candidate, setCandidate] = useState<string>();
  const generation = useRef(0);
  const release = useRef<() => void>();
  const target = src || fallback;
  useEffect(() => {
    const current = ++generation.current;
    if (!visible || (target === good && !failed)) return;
    const done = acquirePhotoCandidate(() => { if (generation.current === current) setCandidate(target); });
    release.current = done;
    return () => { generation.current = current + 1; done(); setCandidate(undefined); };
    // good/failed are replacement outcomes, not new requests; only a source/attempt
    // change or visible return may retry. This avoids a failed-image retry loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, attempt, visible]);
  const currentGeneration = generation.current;
  return <>
    <Image src={failed ? fallback : good} alt={alt} fill sizes={sizes} priority={priority}
      className="object-contain object-center p-1" onError={() => setFailed(true)} />
    {candidate && <Image key={`${candidate}:${attempt}`} src={candidate} alt="" aria-hidden="true" fill sizes={sizes} loading="eager"
      className="object-contain object-center p-1" style={{ opacity: 0 }}
      onLoad={() => {
        if (generation.current !== currentGeneration || candidate !== target) return;
        setGood(candidate); setFailed(false); setCandidate(undefined); release.current?.();
      }} onError={() => {
        if (generation.current !== currentGeneration) return;
        setCandidate(undefined); release.current?.();
      }} />}
  </>;
}
