/** Feature-local geometry in CSS pixels: anchors never move or shrink their 44px hit areas. */
export const LIQUID_STEP = 44;
const Y = 22;
const R = 4;
const CAPSULE = 13;
const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
export function clampLiquidProgress(progress: number, count: number): number {
  return Math.max(0, Math.min(Math.max(0, count - 1), Number.isFinite(progress) ? progress : 0));
}
export function scrollLiquidProgress(left: number, width: number, count: number): number {
  return clampLiquidProgress(width > 0 ? left / width : 0, count);
}
type Lobe = { x: number; rx: number; ry: number };
export type LiquidShape = { path: string; source: Lobe; target: Lobe; neck: { x: number; ry: number }; progress: number };
const number = (value: number) => Number(value.toFixed(3));

/** A reversible, continuous two-lobe metaball. Its narrower waist is concave, not a stretched pill. */
export function liquidShape(progress: number, count: number): LiquidShape {
  const position = clampLiquidProgress(progress, count);
  const anchor = Math.floor(position);
  const t = position - anchor;
  const start = LIQUID_STEP / 2 + LIQUID_STEP * anchor;
  // Leading mass arrives first; the trailing mass follows. Reversing progress retraces the same contour.
  const rawX1 = start + LIQUID_STEP * smooth((t - 0.4) / 0.6);
  const rawX2 = start + LIQUID_STEP * smooth(t / 0.6);
  const distance = rawX2 - rawX1;
  const transfer = smooth(t);
  const sourceRadius = CAPSULE - (CAPSULE - R) * transfer;
  const targetRadius = R + (CAPSULE - R) * transfer;
  const separation = smooth(distance / 12);
  const x1 = rawX1 - (CAPSULE - R) * (1 - separation);
  const x2 = rawX2 + (CAPSULE - R) * (1 - separation);
  const rx1 = R + (sourceRadius - R) * separation;
  const rx2 = R + (targetRadius - R) * separation;
  const span = x2 - x1;
  const neckX = (x1 + x2) / 2;
  const neckRadius = R * (1 - 0.82 * smooth(distance / (LIQUID_STEP * 0.7)));
  const left = x1 - rx1, right = x2 + rx2;
  const n = number;
  const path = [
    `M ${n(left)} ${Y}`,
    `C ${n(left)} ${n(Y - R * 0.56)} ${n(x1 - rx1 * 0.56)} ${Y - R} ${n(x1)} ${Y - R}`,
    `C ${n(x1 + span * 0.25)} ${Y - R} ${n(neckX - span * 0.18)} ${n(Y - neckRadius)} ${n(neckX)} ${n(Y - neckRadius)}`,
    `C ${n(neckX + span * 0.18)} ${n(Y - neckRadius)} ${n(x2 - span * 0.25)} ${Y - R} ${n(x2)} ${Y - R}`,
    `C ${n(x2 + rx2 * 0.56)} ${Y - R} ${n(right)} ${n(Y - R * 0.56)} ${n(right)} ${Y}`,
    `C ${n(right)} ${n(Y + R * 0.56)} ${n(x2 + rx2 * 0.56)} ${Y + R} ${n(x2)} ${Y + R}`,
    `C ${n(x2 - span * 0.25)} ${Y + R} ${n(neckX + span * 0.18)} ${n(Y + neckRadius)} ${n(neckX)} ${n(Y + neckRadius)}`,
    `C ${n(neckX - span * 0.18)} ${n(Y + neckRadius)} ${n(x1 + span * 0.25)} ${Y + R} ${n(x1)} ${Y + R}`,
    `C ${n(x1 - rx1 * 0.56)} ${Y + R} ${n(left)} ${n(Y + R * 0.56)} ${n(left)} ${Y} Z`,
  ].join(" ");
  return { path, source: { x: x1, rx: rx1, ry: R }, target: { x: x2, rx: rx2, ry: R }, neck: { x: neckX, ry: neckRadius }, progress: position };
}
