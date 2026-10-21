/** At most four replacement bitmaps are decoded at once, never the full catalog. */
let active = 0;
const queue: Array<() => void> = [];
export function acquirePhotoCandidate(start: () => void) {
  let cancelled = false, acquired = false, released = false;
  const run = () => {
    if (cancelled) return;
    acquired = true; active++; start();
  };
  const release = () => {
    if (released) return;
    released = true; cancelled = true;
    if (acquired) active--;
    else { const index = queue.indexOf(run); if (index >= 0) queue.splice(index, 1); }
    while (active < 4 && queue.length) queue.shift()!();
  };
  if (active < 4) run(); else queue.push(run);
  return release;
}
