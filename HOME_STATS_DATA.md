# Home statistics: source and deployment contract

The shared `server/services/home-stats.service.ts` supplies `/v2` ISR props and
`GET /api/mobile/v1/home`. No new schema, credentials, migration or data writes.

| ID | Definition |
| --- | --- |
| farmers | All legacy `User` rows, including inactive/admin records by product decision; not distinct app Accounts or identities. |
| buffalos | All `Pedigree` rows, one per microchip; identical population to the unfiltered public catalog. |
| verified | `Pedigree` for which a `Certificate` exists with the same microchip. Count once regardless of certificate duplicates; no active/approver/DNA threshold. Orphan certificates do not count. |
| events | JAOTHUI Event Sanity published `_type=event`, excluding the reviewed Royal Event Test ID `a54fca84-3c46-4156-a0ac-3c2fc61f37c2`. Includes past/inactive published events. Not frontend editorial `newsEvent`, Reward rows or Prisma Event. |

## Public event source (no token)

Server-only optional configuration `JAOTHUI_EVENT_SANITY_PROJECT_ID` and
`JAOTHUI_EVENT_SANITY_DATASET` default to the verified public source `q38mtihr` /
`production`. Deploy with defaults or these same values; do not use frontend
editorial Sanity variables or copy event-site write tokens. API version
2024-06-17, `perspective=published`, no CDN; drafts also excluded explicitly.
Changing this source or the reviewed exclusion ID requires a new source audit.
The test ID/title was independently read from that public source on 2026-10-03.

## Availability and backward compatibility

Stats preserve `id`, `value`, `unit`, `label`; add `count:number|null`,
`availability`, `observedAt`. Existing installed clients render final `value`
unchanged. Numeric clients must not parse that string. True zero is `0`; a failed
metric is `count:null`, `value:—`, `availability:unavailable`, `observedAt:null`.
Successful metric timestamps represent when its count was observed, not a fake
single atomic timestamp across independent databases. No plus signs or mock
fallbacks. Do not expose source connection errors or personal records.

Each server process caches a snapshot for 60 seconds and deduplicates in-flight
loads. There is no unbounded stale-on-error fallback. Registry statements use
independent read-only transactions with 5s statement timeout, 5s max connection
acquisition wait and 6.5s transaction execution bound; Sanity fetch aborts at 5s.
The acquisition allowance tolerates brief contention on the existing single-
connection Prisma pool without increasing its size or changing environment
configuration. A final per-metric 8s response race degrades honestly without
discarding other metrics, but does not cancel an underlying Prisma transaction:
that work may continue after the response race until its own bounded acquisition
and transaction deadlines (up to approximately 11.5s combined, plus cleanup).
Late results cannot overwrite the returned/cached unavailable snapshot. `/v2` also uses
60s ISR, so visible web freshness can lag the service cache by another ISR cycle;
on-demand/serverless instances may each populate their own cache. Mobile auth
and no-store response headers are unchanged.

## Verification / rollback

Run `npm run test:home-stats-contract`, `npm run lint`, `npm run build`.
Reconcile live aggregate counts at a named observation time without exporting
users, wallets or other personal rows. Counts are not permanently pinned to the
audit's 1,180 / 1,344 / 15 / 331 observation.
Rollback motion independently while retaining truthful final values; a source
failure must stay unavailable, never restore marketing placeholders.

## Web Home motion (opt-in)

`HomeStatsGrid` owns one `HomeCountUp` controller per mounted presentation.
Only numeric value leaves subscribe to frames; Home/gallery do not rerender each
frame. Offscreen prepared stats share one 1,200ms easeOutCubic loop and finish at
the exact target. No replay on scrolling back, rerenders or retries. Target
updates show the new final number directly, including decreases.

SSR/no-JS and initial hydration render final values. If the grid is already
visible when preparation runs, it stays static rather than flashing final→0.
Reduced motion, unavailable/invalid/old payloads, and zero stay static. Live
reduced-motion changes, hidden tabs, pagehide, route changes and unmount cancel
the loop and settle to final. Visual interpolation is aria-hidden; the stable
accessible label exposes the actual count/unit. Prompt's digit widths are not
guaranteed tabular: invisible same-length digit rulers (0 through 9, preserving
comma positions) reserve the widest number space before hydration; the visual
counter is absolutely overlaid so intermediate digits cannot enlarge that
reservation or move the unit. Generic `StatCard`/showcase is static
by default. No new dependency or motion treatment outside Home is introduced.

Run `npm run test:home-countup` as well as the data contract. Deterministic
controller/SSR tests do not establish real hydration, font geometry or viewport
timing; those remain the web-eye runtime gate.
