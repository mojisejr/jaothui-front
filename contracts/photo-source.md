# Published buffalo photo source — Phase 2 reader contract

Status: wired into Web and existing metadata/member responses; no uploader, native
lifecycle, schema or Production deployment changes. Run `test:photo-source-contract`,
`test:photo-consumers`, `test:photo-freshness` and the guarded `test:photo-query-local`.

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

## Identity / bounded read

Positive decimal token IDs stay strings, bounded to PostgreSQL signed BigInt.
Validate a maximum of 40 input identities before dedup, never coerce to JS Number.
Pedigree.tokenId is NOT unique (microchip is the row identity). The endpoint
returns at most 40 aggregates and counts **all** rows for each requested token,
without arbitrary findFirst or limiting a row set before duplicate detection.
Only one-row groups with matching identity resolve; duplicates/mismatches are
unavailable and clients retain their same-identity last-good image.
`POST /api/mobile/v1/buffalos/photos` accepts exactly one selector: `tokenIds` or
`microchips`. The latter recovers historical recently-viewed entries without token
IDs, using the already-public unique microchip primary key. Both modes validate
1–40 raw string values before dedup; request size is capped at 2KB. The response is
`{ok:true,data:{photos:[...]}}` with exact decimal token strings and no ownership data.
Only one selected-column data query runs inside a read-only transaction using the
existing Prisma pool; statement timeout is 2500ms, transaction 3000ms, acquisition
1000ms. An instance-local 5s/64-key cache, in-flight dedup, four active batch limit
and 20 new batches/second are safety budgets, not distributed rate-limit/load proof.
HTTP responses retain existing no-store/CORS policy; bad input=400, busy/failure=503.

## Web convergence and compatibility

List/detail/batch/search/member now share the resolver, preserve existing image
string fields and add exact `photoTokenId`/`photoSourceKey`. Old mobile clients keep
their existing fetch behavior; new native lifecycle handling still belongs to Phase3.
Visible Web photos register by microchip when known, avoiding duplicate-token state
collisions. Focus/visibility/route/online returns check after a minimum 30s age;
manual refresh bypasses age with 2s tap cooldown and failure backoff. No idle timer,
whole-screen invalidation, Storage HEAD requests, stats refresh or certificate render.
Photo-bearing metadata queries opt out of automatic focus/reconnect refetch so the
photo-only lifecycle does not simultaneously issue heavy business queries.
Same-identity image candidates are bounded to four and swap only after load; a
different identity resets fallback. Request generations reject late pre-navigation
responses; same URL never causes a new replacement decode solely for a refresh.
The map is capped at 128 identities and eight recent source versions per identity.
Initial failures can retry after a successful photo check. Offline/API/candidate
failure retains same-identity last good pixels. Recently viewed history is preserved.
Idle pages do not update without a trigger; unsupported out-of-band same-key
overwrites remain outside the guarantee. Browser proof is isolated fixture evidence,
not hosted writer canary acceptance, native QA or Store release proof.
