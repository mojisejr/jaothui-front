import { approvedPhotoResponseUrl, validPhotoToken, type PhotoResult, type PhotoSelector } from "./photo-contract";

export const PHOTO_STALE_MS = 30000;
export const PHOTO_MANUAL_COOLDOWN_MS = 2000;
export interface PhotoIdentity { photoTokenId?: string; microchip?: string }
export function photoIdentityKey(identity: PhotoIdentity) {
  if (identity.microchip && /^[0-9]{1,32}$/.test(identity.microchip)) return `m:${identity.microchip}`;
  if (validPhotoToken(identity.photoTokenId)) return `t:${identity.photoTokenId}`;
  return "";
}
export interface PhotoEntry { imageUrl?: string; expectedToken?: string; seenSources: Set<string>; generation: number; attempt: number; checkedAt: number; failedAt: number; visible: number; listeners: Set<() => void> }
type Transport = (selector: PhotoSelector) => Promise<PhotoResult[]>;
export class PhotoCoordinator {
  private entries = new Map<string, PhotoEntry>();
  private pending?: Promise<void>;
  private lastManual = -Infinity;
  private listeners = new Set<() => void>();
  status: "idle" | "refreshing" | "success" | "unavailable" = "idle";
  constructor(private transport: Transport, private now = Date.now, private available = () => true) {}
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private emit() { this.listeners.forEach((fn) => fn()); }
  get(key: string) { return this.entries.get(key); }
  register(key: string, imageUrl: string | undefined, stale: boolean, listener: () => void, expectedToken?: string) {
    if (!key) return () => {};
    let entry = this.entries.get(key);
    if (!entry) {
      if (this.entries.size >= 128) {
        const unused = [...this.entries].find(([, value]) => !value.visible);
        if (unused) this.entries.delete(unused[0]);
        else return () => {};
      }
      entry = { imageUrl, expectedToken, seenSources: new Set(imageUrl ? [imageUrl] : []), generation: 0, checkedAt: stale ? -Infinity : this.now(), failedAt: -Infinity, attempt: 0, visible: 0, listeners: new Set() };
      this.entries.set(key, entry);
    } else if (!stale && imageUrl && imageUrl !== entry.imageUrl && !entry.seenSources.has(imageUrl)) {
      // A newly received normal metadata source is authoritative. Previously seen
      // props must not roll back a newer photo-only response on a cached rerender.
      entry.imageUrl = imageUrl; entry.checkedAt = this.now(); entry.failedAt = -Infinity; entry.attempt++; entry.generation++;
      if (entry.seenSources.size >= 8) entry.seenSources.delete(entry.seenSources.values().next().value!);
      entry.seenSources.add(imageUrl); entry.listeners.forEach((fn) => fn());
    }
    if (validPhotoToken(expectedToken)) entry.expectedToken = expectedToken;
    entry.visible++; entry.listeners.add(listener);
    // Coalesce all photos mounted in this turn. No periodic/background timer.
    Promise.resolve().then(() => this.refresh(false));
    return () => {
      entry!.visible--; entry!.listeners.delete(listener);
      if (!entry!.visible) entry!.generation++;
    };
  }
  refresh(manual = false): Promise<void> {
    if (!this.available()) return Promise.resolve();
    if (this.pending) return this.pending;
    const time = this.now();
    if (manual && time - this.lastManual < PHOTO_MANUAL_COOLDOWN_MS) return Promise.resolve();
    if (manual) this.lastManual = time;
    const targets = [...this.entries].filter(([, entry]) => entry.visible > 0 &&
      time - entry.failedAt >= 5000 && (manual || time - entry.checkedAt >= PHOTO_STALE_MS));
    if (!targets.length) return Promise.resolve();
    this.status = "refreshing"; this.emit();
    this.pending = (async () => {
      let unavailable = false;
      for (const prefix of ["t:", "m:"]) {
        const group = targets.filter(([key]) => key.startsWith(prefix));
        for (let offset = 0; offset < group.length; offset += 40) {
          if (!this.available()) break;
          const batch = group.slice(offset, offset + 40);
          const generations = new Map(batch.map(([key, entry]) => [key, entry.generation]));
          const ids = batch.map(([key]) => key.slice(2));
          try {
            const results = await this.transport(prefix === "t:" ? { tokenIds: ids } : { microchips: ids });
            for (const [key, entry] of batch) {
              if (this.entries.get(key) !== entry || !entry.visible || entry.generation !== generations.get(key)) continue;
              const matches = results.filter((result) => prefix === "t:" ? result.tokenId === key.slice(2) : result.microchip === key.slice(2));
              const result = matches.length === 1 ? matches[0] : undefined;
              if (!result || !["ready", "fallback"].includes(result.status) || !validPhotoToken(result.tokenId) ||
                (entry.expectedToken && result.tokenId !== entry.expectedToken) || !approvedPhotoResponseUrl(result.imageUrl) ||
                (result.status === "fallback" && entry.imageUrl && entry.imageUrl !== result.imageUrl)) {
                entry.failedAt = this.now(); unavailable = true; continue;
              }
              entry.imageUrl = result.imageUrl; entry.checkedAt = this.now(); entry.failedAt = -Infinity; entry.attempt++;
              if (entry.seenSources.size >= 8) entry.seenSources.delete(entry.seenSources.values().next().value!);
              entry.seenSources.add(result.imageUrl);
              entry.listeners.forEach((fn) => fn());
            }
          } catch {
            unavailable = true;
            batch.forEach(([key, entry]) => {
              if (this.entries.get(key) === entry && entry.visible && entry.generation === generations.get(key)) entry.failedAt = this.now();
            });
          }
        }
      }
      this.status = unavailable ? "unavailable" : "success";
    })().finally(() => { this.pending = undefined; this.emit(); });
    return this.pending;
  }
}

async function fetchPhotos(selector: PhotoSelector): Promise<PhotoResult[]> {
  const abort = new AbortController(), timer = setTimeout(() => abort.abort(), 5000);
  try {
    const response = await fetch("/api/mobile/v1/buffalos/photos", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(selector),
      cache: "no-store", signal: abort.signal,
    });
    if (!response.ok) throw new Error("PHOTO_UNAVAILABLE");
    const text = await response.text();
    if (text.length > 140000) throw new Error("PHOTO_RESPONSE_TOO_LARGE");
    const payload = JSON.parse(text);
    if (!payload.ok || !Array.isArray(payload.data?.photos) || payload.data.photos.length > 40) throw new Error("PHOTO_INVALID_RESPONSE");
    return payload.data.photos;
  } finally { clearTimeout(timer); }
}
export const photoCoordinator = new PhotoCoordinator(fetchPhotos, Date.now, () =>
  typeof document !== "undefined" && document.visibilityState === "visible" && navigator.onLine !== false);
