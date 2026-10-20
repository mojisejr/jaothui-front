# Published buffalo photo source — Phase 1 contract

Status: pure resolver and deterministic characterization only, deliberately **unwired**.
No API, UI, native cache/lifecycle or Production behavior changes in this phase.
Run `npm run test:photo-source-contract` (locked Bun toolchain; no network/DB required).

## Source and writer provenance

Reader baseline: main `1dcef131febd568e5718cd09ce0a370c97806f3b`.
Read-only Dashboard dependency: implementation `6f264a5`, tree `0d7595c`,
matching fetched main `588193d`. Synthetic fixtures mirror public projection fields,
not live customer records or private operation journals:

- `src/server/services/buffalo-integrity/field-policy.ts:intentToDatabase` stores
  `intent.image` verbatim and millisecond timestamp strings for create.
- `create/workflow.ts:project` checks immutable source and public alias readback
  before inserting the committed Pedigree row.
- `edit/workflow.ts:rawProjection/project` copies patch.image and publicationTime
  into the public row after existing alias replacement/readback checks. A pending
  draft leaves the old row as the reader authority; it is not a reader input.

These are code/fixture proofs, **not** execution of that writer or hosted canary
acceptance. Mutable aliases can already contain replacement bytes before final DB
projection. This reader contract does not promise atomic alias pixels.
The resolver cannot establish publication by URL shape alone: feeding only committed
rows is the caller's invariant, not proof that an operations URL belongs to a completed draft.

## Pure resolver boundary

Only the exact HTTPS `wtnqjxerhmdnqszkhbvs.supabase.co` origin and public
`slipstorage` bucket are accepted. Identity subtrees: `buffalo/` legacy objects and
writer-owned `operations/<64hex>/<uuid>/source.jpg` (or published-image.jpg).
This is the explicit current Production allowlist; there is no silent localhost,
test-server or env-origin relaxation. Supporting another deployment's storage
origin later requires an explicit reviewed configuration/allowlist contract.
Credentials, explicit ports (including :443), private/signed paths, traversal,
encoded separators, fragments, unknown/duplicate queries and foreign hosts fail
closed to the requested buffalo's canonical alias. No URL fetch/proxy exists.
Only `v`, `version`, `cacheNonce` query keys with bounded safe scalar values are
permitted. Query order and safe percent spelling canonicalize deterministically.

The current writer emits JPEG. Existing safe legacy JPEG/PNG/WebP paths are retained;
extensionless paths gain `.jpg` before query, never `.png.jpg` or `.jpg.jpg`.
Immutable committed pointers themselves are cache keys; raw-row timestamp changes
do not churn them. Legacy URLs use `jaothui-photo-v1` cacheNonce derived from URL
and the exact raw committed updatedAt string. This is a bootstrap display fingerprint,
**not a verified historical photo revision**; no seconds/ms/date guessing.
Unchanged reads are stable. Out-of-band same-key overwrites without a changed
published pointer/marker are outside the freshness guarantee.

## Identity / future bounded read

Positive decimal token IDs stay strings, bounded to PostgreSQL signed BigInt.
Validate a maximum of 40 input identities before dedup, never coerce to JS Number.
Pedigree.tokenId is NOT unique (microchip is the row identity). The future endpoint
must return at most 40 aggregates and count **all** rows for each requested token,
without arbitrary findFirst or limiting a row set before duplicate detection.
Only one-row groups with matching identity resolve; duplicates/mismatches are
unavailable and future clients retain their same-identity last-good image.
Pure group evaluation is bounded, but is not a query implementation/proof. Phase 2
must implement and test one bounded selected-column grouped DB read using the
existing Prisma client/pool, transport limits and timeout/cache controls.

## Known defects intentionally not hidden

Current list/detail ignore image pointers and synthesize token.jpg. Current
batch/search/member append `.jpg` unconditionally, producing `source.jpg.jpg` for
the new writer. The smoke suite explicitly characterizes those baseline defects.
Phase 2 must wire this contract and replace those assertions with integration
expectations. Phase 3 must implement Mobile triggers; native proof and release
remain separate. No HTTP200/parser test proves cache replacement or decoded pixels.
