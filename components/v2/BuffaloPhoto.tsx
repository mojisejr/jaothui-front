import Image from "next/image";
import type { RemoteImageProps } from "./RemoteImage";
import { usePublishedPhoto } from "./PhotoRefresh";
import { usePhotoPresentation } from "./usePhotoPresentation";
import type { PhotoIdentity } from "../../utils/photo-coordinator";
import { cn } from "./cn";
import { Spinner } from "./Spinner";
import { useCallback, useContext, useEffect, useRef } from "react";
import { PhotoFeedback, PhotoFeedbackReport } from "./BuffaloPhotoFeedback";
import { observeResponsivePhoto } from "../../utils/observe-responsive-photo";

export type BuffaloPhotoProps = Pick<RemoteImageProps, "src" | "alt" | "sizes" | "priority" | "fallback"> &
  PhotoIdentity & { stale?: boolean; thumbnail?: boolean };

/** Owns fixed geometry and a quiet external status slot. Good animal pixels are
 * never covered by loading/retry UI; initial native lazy/cache loads are ungated. */
export function BuffaloPhoto(props: BuffaloPhotoProps) {
  const photo = usePublishedPhoto(props, props.src, props.stale);
  return <div className="w-full min-w-0">
    <span ref={photo.ref} hidden />
    <PhotoFrame key={photo.identityKey || props.src || "missing"} {...props}
      src={photo.imageUrl} visible={photo.visible} attempt={photo.attempt} />
  </div>;
}

function PhotoFrame({ src, alt, sizes = "(max-width: 768px) 50vw, 400px", priority,
  fallback = "/images/logo.png", thumbnail, visible, attempt }: BuffaloPhotoProps & { visible: boolean; attempt: number }) {
  const photo = usePhotoPresentation(src, attempt, visible);
  const frameRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!photo.good || !visible) return;
    const img = frameRef.current?.querySelector<HTMLImageElement>("img:not([aria-hidden])");
    if (!img) return;
    return observeResponsivePhoto(img, () => photo.settlePrimary(photo.good, photo.imageKey, photo.initial, false));
    // The mounted node/source key scopes this callback. The presentation hook's
    // current refs reject a superseded source even before effect cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo.good, photo.imageKey, visible]);
  const request = photo.request;
  const busy = request.status === "loading" || request.status === "queued";
  const failed = request.status === "failed";
  const report = useContext(PhotoFeedbackReport);
  const retryRef = useRef(photo.retry);
  retryRef.current = photo.retry;
  const retry = useCallback(() => retryRef.current(), []);
  const hasGood = Boolean(photo.good);
  useEffect(() => { report?.({ busy, failed, hasGood, alt, retry }); }, [report, busy, failed, hasGood, alt, retry]);
  return <>
    <div ref={frameRef} className={cn("relative w-full overflow-hidden rounded-photo bg-surface", thumbnail ? "aspect-square" : "aspect-[3/2]")}
      aria-busy={busy} data-photo-request={request.status} data-photo-visible={visible ? "true" : "false"}
      data-photo-state={photo.good ? (busy ? "updating" : failed ? "update-failed" : "ready") : request.status}>
      <Image key={photo.imageKey} src={photo.good || photo.initial.url || fallback}
        alt={alt} fill sizes={sizes} priority={priority} className="object-contain object-center p-1"
        style={{ opacity: photo.good ? 1 : 0 }} onLoad={(event) => {
          if (!event.currentTarget.isConnected) return;
          // Next14 may synthesize onLoad after a rejected decode on complete
          // broken resources. Only actual decoded pixels qualify as success.
          const decoded = event.currentTarget.naturalWidth > 0;
          photo.settlePrimary(photo.good || photo.initial.url, photo.imageKey, photo.initial, decoded);
        }}
        onError={(event) => {
          if (!event.currentTarget.isConnected) return;
          photo.settlePrimary(photo.good || photo.initial.url, photo.imageKey, photo.initial, false);
        }} />
      {photo.good && request.url && request.url !== photo.good && request.status === "loading" &&
        <Image key={`${request.url}:${request.generation}`} src={request.url} alt="" aria-hidden="true" fill sizes={sizes} loading="eager"
          className="object-contain object-center p-1" style={{ opacity: 0 }}
          onLoad={(event) => photo.finish(request, event.currentTarget.naturalWidth > 0)} onError={() => photo.finish(request, false)} />}
      {!photo.good && <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 p-1 text-center text-xs text-muted">
        {busy && <PhotoSpinner />}
        <span>{thumbnail ? (busy ? "" : failed ? "โหลดไม่ได้" : "ไม่มีภาพ") : busy ? "กำลังโหลดภาพ…" : failed ? "โหลดภาพไม่สำเร็จ" : "ยังไม่มีภาพ"}</span>
      </div>}
    </div>
    {!report && <PhotoFeedback state={{ busy, failed, hasGood, alt, retry }} thumbnail={thumbnail} />}
  </>;
}

/** Spinner shape without a live region: automatic photo work must not announce
 * dozens of transient states. Reduced motion defaults to static. */
function PhotoSpinner() {
  return <Spinner decorative size="sm" className="h-4 w-4 shrink-0 motion-reduce:animate-none" />;
}
