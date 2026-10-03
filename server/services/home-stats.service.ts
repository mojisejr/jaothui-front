import { prisma } from "../prisma";

export const HOME_STATS_CACHE_MS = 60_000;
export const HOME_STATS_TIMEOUT_MS = 5_000;
export const HOME_STATS_ACQUIRE_TIMEOUT_MS = 5_000;
export const HOME_STATS_TRANSACTION_TIMEOUT_MS = 6_500;
export const HOME_STATS_RESPONSE_TIMEOUT_MS = 8_000;
// Reviewed 2026-10-03 against JAOTHUI Event's public published source.
export const HOME_STATS_TEST_EVENT_IDS = ["a54fca84-3c46-4156-a0ac-3c2fc61f37c2"];

export type HomeStatId = "farmers" | "buffalos" | "events" | "verified";
export type HomeStat = {
  id: HomeStatId;
  value: string;
  count: number | null;
  unit: string;
  label: string;
  availability: "available" | "unavailable";
  observedAt: string | null;
};

const definitions: { id: HomeStatId; unit: string; label: string }[] = [
  { id: "farmers", unit: "ราย", label: "เกษตรกรในเครือข่าย" },
  { id: "buffalos", unit: "ตัว", label: "กระบือในฐานข้อมูล" },
  { id: "events", unit: "รายการ", label: "กิจกรรมร่วม" },
  { id: "verified", unit: "ตัว", label: "กระบือยืนยันแล้ว" },
];

export function normalizeHomeStatCount(value: unknown): number {
  const count = typeof value === "bigint" ? Number(value) : value;
  if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
    throw new Error("Invalid Home metric count");
  }
  return count;
}

export function formatHomeStatCount(count: number): string {
  return normalizeHomeStatCount(count).toLocaleString("en-US");
}

export const HOME_EVENT_COUNT_QUERY =
  'count(*[_type == "event" && !(_id in path("drafts.**")) && !(_id in $excludedIds)])';

export function getHomeEventSourceConfig(env: NodeJS.ProcessEnv = process.env) {
  const projectId = env.JAOTHUI_EVENT_SANITY_PROJECT_ID ?? "q38mtihr";
  const dataset = env.JAOTHUI_EVENT_SANITY_DATASET ?? "production";
  if (!/^[a-z0-9]+$/.test(projectId) || !/^[a-zA-Z0-9_-]+$/.test(dataset)) {
    throw new Error("Invalid Home event source configuration");
  }
  return { projectId, dataset };
}

export function buildHomeEventCountUrl(config = getHomeEventSourceConfig()) {
  const url = new URL(
    `https://${config.projectId}.api.sanity.io/v2024-06-17/data/query/${config.dataset}`
  );
  url.searchParams.set("perspective", "published");
  url.searchParams.set("query", HOME_EVENT_COUNT_QUERY);
  url.searchParams.set("$excludedIds", JSON.stringify(HOME_STATS_TEST_EVENT_IDS));
  return url;
}

async function countEvents() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HOME_STATS_TIMEOUT_MS);
  try {
    // This public source deliberately uses neither an auth token nor the
    // frontend editorial Sanity client/dataset.
    const response = await fetch(buildHomeEventCountUrl(), {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Home event count request failed");
    const body: { result?: unknown } = await response.json();
    return normalizeHomeStatCount(body.result);
  } finally {
    clearTimeout(timer);
  }
}

export async function countRegistryMetric(
  id: Exclude<HomeStatId, "events">,
  db: Pick<typeof prisma, "$transaction"> = prisma
) {
  // Independent transactions preserve the other metrics on a source failure.
  // Allow bounded contention on existing small pools without changing their
  // size. The response race below is not query cancellation: acquisition and
  // transaction execution can together outlive that response deadline.
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    await tx.$executeRaw`SET LOCAL statement_timeout = '5000ms'`;
    if (id === "farmers") return tx.user.count(); // All legacy User, not active-only.
    if (id === "buffalos") return tx.pedigree.count();
    const rows = await tx.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count FROM "Pedigree" p
      WHERE EXISTS (SELECT 1 FROM "Certificate" c WHERE c.microchip = p.microchip)
    `;
    return normalizeHomeStatCount(rows[0]?.count);
  }, {
    maxWait: HOME_STATS_ACQUIRE_TIMEOUT_MS,
    timeout: HOME_STATS_TRANSACTION_TIMEOUT_MS,
  });
}

type CountLoaders = Record<HomeStatId, () => Promise<unknown>>;

/** Injectable clock/loaders keep cache and failure behavior deterministic in tests. */
export function createHomeStatsService(
  loaders: CountLoaders,
  options: { now?: () => number; cacheMs?: number; timeoutMs?: number } = {}
) {
  const now = options.now ?? Date.now;
  const cacheMs = options.cacheMs ?? HOME_STATS_CACHE_MS;
  const timeoutMs = options.timeoutMs ?? HOME_STATS_RESPONSE_TIMEOUT_MS;
  let cached: { stats: HomeStat[]; expiresAt: number } | undefined;
  let inFlight: Promise<HomeStat[]> | undefined;

  async function loadMetric(definition: typeof definitions[number]): Promise<HomeStat> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const rawCount = await Promise.race([
        Promise.resolve().then(loaders[definition.id]),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("Home metric timeout")), timeoutMs);
        }),
      ]);
      const count = normalizeHomeStatCount(rawCount);
      return { ...definition, count, value: formatHomeStatCount(count),
        availability: "available", observedAt: new Date(now()).toISOString() };
    } catch {
      // Do not leak credentials/connection errors, fabricate zero, or retain
      // expired observations while claiming they are freshly available.
      return { ...definition, count: null, value: "—",
        availability: "unavailable", observedAt: null };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  return async function getStats(): Promise<HomeStat[]> {
    if (cached && now() < cached.expiresAt) return cached.stats;
    if (inFlight) return inFlight;
    inFlight = Promise.all(definitions.map(loadMetric)).then((stats) => {
      cached = { stats, expiresAt: now() + cacheMs };
      return stats;
    }).finally(() => { inFlight = undefined; });
    return inFlight;
  };
}

export const getHomeStats = createHomeStatsService({
  farmers: () => countRegistryMetric("farmers"),
  buffalos: () => countRegistryMetric("buffalos"),
  verified: () => countRegistryMetric("verified"),
  events: countEvents,
});
