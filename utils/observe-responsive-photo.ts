/** Browsers can change a srcset selection after viewport changes without
 * emitting load/error. Validate only the already-selected resource, in a
 * bounded resize window; never fetch, rewrite src, or poll while idle. */
export function observeResponsivePhoto(img: HTMLImageElement, onBroken: () => void) {
  let alive = true, generation = 0, reported = false;
  let frame: number | undefined;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const cancelScheduled = () => {
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    frame = undefined;
    timers.forEach(clearTimeout); timers.clear();
  };
  const inspect = (token: number) => {
    if (!alive || reported || token !== generation || !img.isConnected) return;
    const source = img.currentSrc, fallback = img.src;
    if (!source && !fallback) return;
    const settle = () => {
      if (!alive || reported || token !== generation || !img.isConnected) return;
      // During a pending environment selection currentSrc may be empty. Its
      // later selected URL is not a source change: the same node/fallback/key
      // still owns those terminal pixels. Do not compare it with img.src.
      if (source ? source !== img.currentSrc : fallback !== img.src) return;
      if (img.complete && img.naturalWidth === 0) {
        reported = true; cancelScheduled(); onBroken();
      }
    };
    settle();
    if (!reported && typeof img.decode === "function") {
      // decode waits for this selected resource, including slow requests beyond
      // the bounded checkpoints. Rejections are actionable only for a current,
      // complete broken bitmap, not AbortError from a newer selection.
      try { void img.decode().then(settle, settle); } catch { settle(); }
    }
  };
  const resized = () => {
    const token = ++generation;
    cancelScheduled();
    frame = window.requestAnimationFrame(() => { frame = undefined; inspect(token); });
    // A resize callback (even its first frame) can still expose the old ready
    // candidate. Later bounded checkpoints also cover engines without decode.
    for (const delay of [100, 500, 1500]) {
      const timer = setTimeout(() => { timers.delete(timer); inspect(token); }, delay);
      timers.add(timer);
    }
  };
  window.addEventListener("resize", resized);
  // On visibility return it may be broken OR still pending without pixels.
  // Await the latter's decode; terminal classification still requires complete.
  if (img.naturalWidth === 0) resized();
  return () => { alive = false; generation++; cancelScheduled(); window.removeEventListener("resize", resized); };
}
