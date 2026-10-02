/** Home-only decorative interpolation. Authoritative values remain the targets. */
export const HOME_COUNT_UP_DURATION_MS = 1_200;

export function validCount(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

export function countAt(target: number, elapsedMs: number): number {
  const t = Math.min(1, Math.max(0, elapsedMs / HOME_COUNT_UP_DURATION_MS));
  return t === 1 ? target : Math.floor(target * (1 - (1 - t) ** 3));
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

/** Proportional fonts can ignore tabular-nums. Reserve every digit-width case
 * with the final comma positions, not merely the potentially narrow final text. */
export function countWidthRulers(target: number): string[] {
  const template = formatCount(target);
  return Array.from({ length: 10 }, (_, digit) => template.replace(/\d/g, String(digit)));
}

export interface CountTarget { id: string; count?: number | null }
export interface CountSnapshot { target: number | null; current: number | null }
export interface CountFrameClock {
  request: (callback: (timestamp: number) => void) => number;
  cancel: (handle: number) => void;
  now: () => number;
}

/** One controller per mounted Home presentation, not per potentially remounted card. */
export class HomeCountUp {
  private snapshots = new Map<string, CountSnapshot>();
  private listeners = new Map<string, Set<() => void>>();
  private phase: "idle" | "armed" | "running" | "consumed" = "idle";
  private frame: number | null = null;
  private startedAt = 0;

  constructor(targets: readonly CountTarget[], private clock: CountFrameClock) {
    for (const item of targets) {
      const target = validCount(item.count);
      this.snapshots.set(item.id, { target, current: target });
    }
  }

  snapshot = (id: string): CountSnapshot | undefined => this.snapshots.get(id);

  subscribe = (id: string, callback: () => void): (() => void) => {
    const listeners = this.listeners.get(id) ?? new Set();
    this.listeners.set(id, listeners);
    listeners.add(callback);
    return () => { listeners.delete(callback); };
  };

  private write(id: string, target: number | null, current: number | null) {
    const previous = this.snapshots.get(id);
    if (previous?.target === target && previous.current === current) return;
    this.snapshots.set(id, { target, current });
    this.listeners.get(id)?.forEach((notify) => notify());
  }

  /** Refetches never imply growth, reset to zero, or replay the presentation. */
  replaceTargets(targets: readonly CountTarget[]) {
    const changed = targets.length !== this.snapshots.size || targets.some(
      (item) => this.snapshots.get(item.id)?.target !== validCount(item.count)
    );
    if (!changed) return;
    this.settle();
    const ids = new Set(targets.map((item) => item.id));
    for (const id of this.snapshots.keys()) {
      if (!ids.has(id)) this.snapshots.delete(id);
    }
    for (const item of targets) {
      const target = validCount(item.count);
      this.write(item.id, target, target);
    }
  }

  /** Only prepare while offscreen; already exposed final values remain static. */
  prepare(offscreen: boolean, reduceMotion: boolean, hidden: boolean) {
    if (this.phase !== "idle") return;
    if (!offscreen || reduceMotion || hidden || ![...this.snapshots.values()].some(
      ({ target }) => target !== null && target > 0
    )) {
      this.settle();
      return;
    }
    this.phase = "armed";
    for (const [id, { target }] of this.snapshots) {
      this.write(id, target, target === null ? null : 0);
    }
  }

  reveal() {
    if (this.phase !== "armed") return;
    this.phase = "running";
    this.startedAt = this.clock.now();
    const tick = (timestamp: number) => {
      this.frame = null;
      if (this.phase !== "running") return;
      const elapsed = Math.max(0, timestamp - this.startedAt);
      if (elapsed >= HOME_COUNT_UP_DURATION_MS) {
        this.settle();
        return;
      }
      for (const [id, { target }] of this.snapshots) {
        this.write(id, target, target === null ? null : countAt(target, elapsed));
      }
      this.frame = this.clock.request(tick);
    };
    this.frame = this.clock.request(tick);
  }

  /** Reduced motion, hidden tabs, pagehide, route changes and target updates finish immediately. */
  settle = () => {
    if (this.frame !== null) this.clock.cancel(this.frame);
    this.frame = null;
    this.phase = "consumed";
    for (const [id, { target }] of this.snapshots) this.write(id, target, target);
  };

  /** StrictMode's effect cleanup may reprepare only an unexposed/offscreen grid. */
  detach() {
    const wasUnexposed = this.phase === "armed" || this.phase === "idle";
    this.settle();
    if (wasUnexposed) this.phase = "idle";
  }
}
