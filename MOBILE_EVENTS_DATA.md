# Mobile event registration — front#212

Source protocol: `mojisejr/jaothui-event@914da59ff9cbf287da8a5fb00276bef59f7604af`. Event/dashboard code stays unchanged. The adapter lives in `server/mobile/events/`; native clients consume only curated `/api/mobile/v2` routes and the existing `{ok,data|error,requestId}` envelope.

## API contract

| Method | Route suffix | Data |
|---|---|---|
| GET | `/events` | `items,totalOpen,nextCursor,observedAt`; q/from/to/limit/cursor; only open registration, stable startDay/id ordering |
| GET | `/events/[eventId]` | summary + description/metadata/ageCutoffDay/policy/catalogs/formKind; published closed history readable |
| GET, POST | `/event-member` | own member/capability; enrollment firstName,lastName,tel,email?, no caller identity or role |
| GET | `/event-registrations` | own history including ended legacy events; limit/cursor; never sends notifications |
| GET | `/event-registrations/[id]` | own detail/images/address/status; guessed foreign ID404 |
| POST | `/events/[eventId]/images` | raw valid JPEG/PNG/WebP <=4MiB; returns assetId |
| POST | `/events/[eventId]/registrations` | normal/Royal exact source-shaped fields + agreements; returns registration,replayed;201 first persistence/200 replay |
| POST, DELETE | `/auth/line-link/start` | start returnIntent `{kind:profile-link}` or `{kind:event-apply,eventId}`; returns authorizeUrl,intentId,returnTo; DELETE cancels intentId |
| POST | `/auth/line-link/redeem` | intentId + opaque handoff; returns sessionToken,expiresAt,identity,returnIntent,replayed |

Normal request fields: operationId UUID, type, level จังหวัด/ประเทศ, name, sex male/female, color black/albino, birthdate YYYY-MM-DD, microchip, ownerName, ownerTel, fatherName, motherName, farmName, province, buffaloAge compatibility number, agreements.accept1..accept4=true. Royal adds address,district,amphoe,zipcode,imageIds[5 distinct] and agreements.d1Accept..d3Accept plus accept1..accept9=true (12 total including the three declarations). Exact Thai consent text comes from the pinned source forms. Enrollment source user schema does not persist first/last name; do not claim otherwise.

Source request hashing preserves raw strings, omits BFF-only agreements, retains original request buffaloAge for compatibility only, and keeps Royal birthdate+normalized birthday. Persisted age/class always come from fresh authoritative policy and strong catalogs. Keep the exact original payload and UUID on retry. Already-successful matching replay precedes mutable event policy. Event revision/fence/count and full Royal graph commit atomically; no global microchip uniqueness or new message sender is introduced.

## Identity and replay

Customer Account must be active on every private call; reviewer and legacy wallet sessions are refused. Resolve current AccountIdentity(provider=line), not a JWT snapshot. Production app/event identity namespace is verified channel2003013735/provider2001989427. Local protected event config is a different dev channel and is not production mapping authority.

Link start/callback/redemption bind purpose, Account, random nonce hash, audience/issuer and10min TTL in MobileLineLinkIntent. Callback claims the code once. No provider access/ID token is stored. Redeem serializes on Account and atomically attaches into the SAME Account; primary Apple identity and wallet survive. A successful same-account exact-handoff retry can recover the receipt after response loss without reattaching. Wrong account, cancelled/expired intent, wrong purpose and other-account identity conflict cannot switch/merge Accounts. Intent failures are409, not customer401; transient upstream/DB failures preserve the session. Native dual callbacks still need client deduplication and installed-device proof.

Verified profile is temporary: cleared on redeem/cancel/soft-delete; successful receipt retains only a hashed subject. Existing link-start lifecycle prunes at most100 expired auth rows. No daemon or application/customer-data cleanup is added.

Guest event login may pass an opaque `clientFlowId` (`[A-Za-z0-9-]{12,96}`) to `/oauth/mobile/line/start`. The value is carried in signed state/handoff, the native callback URL, and the verified `/api/mobile/v2/auth/line/session` response. A correlated handoff requires that same ID in the session POST body; mismatch returns409 `AUTH_FLOW_MISMATCH` without issuing a session. Native clients compare the persisted current flow before redemption and again before saving. Error callbacks echo correlation only from verified state (guest `clientFlowId`, link `intentId`), so an old cancellation cannot cancel a newer pending flow. This prevents a late old cold callback from being accepted as a newer event login; legacy Profile login without the optional field remains unchanged.

## Configuration and deployment prerequisite

Explicit server-only variables: JAOTHUI_EVENT_SANITY_PROJECT_ID, JAOTHUI_EVENT_SANITY_DATASET, JAOTHUI_EVENT_SANITY_WRITE_TOKEN. No editorial/NEXT_PUBLIC credential fallback. All curated reads need upstream auth too: [Sanity dotted IDs are private](https://www.sanity.io/docs/content-lake/ids), including source deterministic registration IDs; guest-facing routes still return public DTOs only. Published/draft/version and ownership guards remain mandatory.

JAOTHUI_MOBILE_EVENTS_ENABLED defaults off; JAOTHUI_MOBILE_EVENT_WRITES_ENABLED defaults off independently. Read credentials do not enable mutation. Existing broader source credential is reused only in local ignored0600 configuration, not a newly scoped token or production provision.

**Apply additive migration `20261028050000_mobile_line_link_intent` and generate the matching Prisma client BEFORE deploying this code.** Existing softDeleteAccount now redacts this table even when event flags are off; deploying to an unmigrated DB would break existing account deletion. Default flags alone are not sufficient deployment isolation. Production rollout evidence is recorded separately; local tests alone do not establish deployment. Rollback code in a normal reviewed commit; retain additive schema and existing applications/history rather than deleting them.

The migration atomically enables RLS and revokes table privileges from PUBLIC and existing Supabase `anon`/`authenticated` roles. There are no Data API policies: temporary verified profiles and return intents are BFF-only. The server connection must remain the table owner (or an explicitly privileged server role), which bypasses ordinary RLS; do not use client credentials or add a permissive policy to make server calls work. This changes only the new table, not default privileges or existing tables. See [Supabase grants and RLS](https://supabase.com/docs/guides/api/securing-your-api). Local proof: `JAOTHUI_E2E_DATABASE_URL=postgresql://jaothui_e2e@127.0.0.1:55432/jaothui_local_e2e?schema=public bun scripts/mobile-line-link-security-contract.mjs` rehearses the exact migration in an owned rollback-only schema, including automatic grants, denied client privileges, RLS row denial and owner access.

## Verification and retained fixtures

`bun run test:mobile-events-contract` exercises domain/routes/hash/privacy/races. `bun run test:mobile-line-link-contract` requires exact owned loopback PG127.0.0.1:55432/jaothui_local_e2e and uses synthetic actors/provider responses. `bun run e2e:local:mobile-events --run --output ABSOLUTE_SCRATCH` hard-allows q38mtihr/dev only before client creation, exact ID ledger and no delete/bulk/replace/foreign mutation. It freezes every existing ID/revision immediately before each run and proves all retained after; optional `--expected-baseline-sha HASH` adds an operator baseline lock. Nonce-unique image bytes are prechecked, owned metadata is revision-fenced, and all synthetic fixtures are retained for later feature proof. No production requests/messages are part of these tests.

Deterministic/local integration confidence does not close real native OAuth, picker/scroll, production cross-channel acceptance or release approval. Legacy lint warnings remain outside this feature.

Native JPEG uploads receive a deterministic, non-visual owner/event comment before content-hash storage. This permits the same chosen photo across events without rewriting another asset owner; identical bytes in the same event/applicant still deduplicate, preserving the five-distinct-asset requirement. PNG/WebP retain the existing ownership checks. Request limit remains4MiB before this small server-generated metadata.
