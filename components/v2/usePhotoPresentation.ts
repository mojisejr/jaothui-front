import { useEffect, useRef, useState } from "react";
import { acquirePhotoCandidate } from "../../utils/photo-candidates";

type Request = { url?: string; generation: number; attempt: number; retryCount: number; status: "missing" | "queued" | "loading" | "ready" | "failed" };
export const PHOTO_LOAD_TIMEOUT_MS = 15_000;

/** Component-local bitmap lifecycle only: no metadata/auth/cache mutation. */
export function usePhotoPresentation(src: string | null | undefined, attempt: number, visible: boolean) {
  const target = src || undefined;
  const [good, setGood] = useState<string>();
  const goodRef = useRef<string>();
  const goodKey = useRef<string>();
  const [retryCount, setRetryCount] = useState(0);
  const generation = useRef(0);
  const latest = useRef({ target, attempt, retryCount });
  latest.current = { target, attempt, retryCount };
  const release = useRef<() => void>();
  const [request, setRequest] = useState<Request>({ url: target, generation: 0, attempt, retryCount, status: target ? "loading" : "missing" });
  const active = useRef<Request>(request);

  useEffect(() => {
    const currentGeneration = ++generation.current;
    const update = (status: Request["status"]) => {
      const next = { url: target, generation: currentGeneration, attempt, retryCount, status };
      active.current = next; setRequest(next);
    };
    if (!target) update("missing");
    else if (goodRef.current === target) update("ready");
    else if (!goodRef.current) {
      const previous = active.current;
      const sameLoad = previous.url === target && previous.attempt === attempt && previous.retryCount === retryCount;
      // A cached ref/decode callback can settle this load during commit, before
      // passive activation. Do not erase that outcome with a new loading object.
      update(sameLoad && previous.status === "failed" ? "failed" : "loading");
    }
    else {
      update("queued");
      if (visible) release.current = acquirePhotoCandidate(() => update("loading"));
    }
    return () => { generation.current = currentGeneration + 1; release.current?.(); release.current = undefined; };
  }, [target, attempt, retryCount, visible]);

  const finish = (work: Request, success: boolean) => {
    // Render-time source check closes the gap before effect cleanup.
    if (generation.current !== work.generation || active.current !== work || work.status !== "loading" ||
      latest.current.target !== work.url || latest.current.attempt !== work.attempt || latest.current.retryCount !== work.retryCount || !work.url) return;
    if (success) { goodRef.current = work.url; goodKey.current = `${work.url}:${work.attempt}:${work.retryCount}`; setGood(work.url); }
    const next = { ...work, status: success ? "ready" as const : "failed" as const };
    active.current = next; setRequest(next); release.current?.(); release.current = undefined;
  };

  const initial = { url: target, attempt, retryCount };
  const finishInitial = (work: typeof initial, success: boolean) => {
    if (!work.url || latest.current.target !== work.url || latest.current.attempt !== work.attempt ||
      latest.current.retryCount !== work.retryCount) return;
    const previous = active.current;
    const sameLoad = previous.url === work.url && previous.attempt === work.attempt && previous.retryCount === work.retryCount;
    // Terminal callbacks from this same attempt (including a late success after
    // deadline) cannot settle it again. A new retry is a different logical load.
    if (sameLoad && (previous.status === "failed" || previous.status === "ready")) return;
    if (success) { goodRef.current = work.url; goodKey.current = `${work.url}:${work.attempt}:${work.retryCount}`; setGood(work.url); }
    const next: Request = { ...work, generation: generation.current, status: success ? "ready" : "failed" };
    active.current = next; setRequest(next); release.current?.(); release.current = undefined;
  };

  const failDisplayed = (url: string, imageKey: string | undefined) => {
    // A responsive srcset can fail after this node previously decoded. Only the
    // still-displayed node may invalidate good pixels, never an old node's event.
    if (goodRef.current !== url || goodKey.current !== imageKey) return;
    goodRef.current = undefined; goodKey.current = undefined; setGood(undefined);
    const next: Request = { url: latest.current.target, generation: ++generation.current,
      attempt: latest.current.attempt, retryCount: latest.current.retryCount, status: "failed" };
    active.current = next; setRequest(next); release.current?.(); release.current = undefined;
  };

  const settlePrimary = (url: string | undefined, imageKey: string | undefined, work: typeof initial, success: boolean) => {
    // Next may retain a completion handler from before this node became good.
    // Route outcomes by current decoded-node refs, not that render's good state.
    if (goodRef.current) {
      if (!success && url === goodRef.current && imageKey === goodKey.current) failDisplayed(url, imageKey);
      return;
    }
    // An old good node may still dispatch while a different target is becoming
    // initial. Its pixels must never be accepted as that target's completion.
    if (url !== work.url || imageKey !== `${work.url}:${work.attempt}:${work.retryCount}`) return;
    finishInitial(work, success);
  };

  useEffect(() => {
    if (!visible || request.status !== "loading") return;
    const timeout = setTimeout(() => finish(request, false), PHOTO_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeout);
    // finish reads current refs, not stale state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, visible]);

  return { good, request, initial, imageKey: good ? goodKey.current : `${target}:${attempt}:${retryCount}`, finish, settlePrimary,
    retry: () => setRetryCount((value) => value + 1) };
}
