# Web → Event SSO v1 (#217)

Feature flags remain OFF by default. This source change does not authorize production migration, secret provisioning, provider changes or deployment. Existing LINE/mobile/Bitkub auth does not access new tables while OFF.

## Operator order (after owner release approval)

1. Apply only `prisma/migrations/20261102140000_web_event_sso/migration.sql` using the existing authorized PostgreSQL migration procedure; regenerate Prisma client in the build. The migration adds four tables, indexes, restricted foreign keys and RLS. It never resets, truncates, backfills or deletes account/member data. BFF must connect as the table owner; no client role policies are granted.
2. Configure the following server-only values in both issuer/consumer. Only `JAOTHUI_EVENT_SSO_CLIENT_SECRET` must match across apps; each app generates its own independent `JAOTHUI_EVENT_SSO_STATE_SECRET` (Front attachment signatures and Event transaction cookies use different keys). Deploy both apps with their flags OFF. Keep existing LINE channel and callback configuration; first attachment uses Front's existing web LINE callback.
3. Verify source/migration/config on each app, then enable the issuer and consumer together. The Front public carousel uses the same `JAOTHUI_EVENT_SSO_ENABLED` flag; its existing public service additionally requires `JAOTHUI_MOBILE_EVENTS_ENABLED=true` and valid Event Sanity configuration. An enabled issuer with missing configuration/tables returns 503 without clearing valid Front credentials.
4. Owner accepts real same-browser login, wallet-first LINE attachment, logout and account switch. Deterministic tests do not replace provider/browser acceptance.

| Variable | Value/rule |
| --- | --- |
| `JAOTHUI_EVENT_SSO_ENABLED` | literal `true` enables; absent/other values disable |
| `JAOTHUI_FRONT_ORIGIN` | exact HTTPS origin, no path/query/trailing slash/credentials |
| `JAOTHUI_EVENT_ORIGIN` | exact HTTPS Event origin; callback fixed `/api/auth/front/callback` |
| `JAOTHUI_EVENT_SSO_CLIENT_SECRET` | dedicated random >=32 characters, shared only between Front and Event; no existing admin/mobile/private key reuse |
| `JAOTHUI_EVENT_SSO_STATE_SECRET` | independent random >=32 characters per app; Front signs attachment intents, Event signs its transaction cookie; never browser-exposed |
| `JAOTHUI_LINE_LOGIN_CHANNEL_ID` | verified Event namespace `2003013735`; other channels fail `IDENTITY_MAPPING_UNVERIFIED` |

Development permits explicit HTTP origins only on loopback. Never use `NEXT_PUBLIC_` for secrets. No raw SID, grant, session, LINE token, provider profile or callback query belongs in logs. Front owns host-only HttpOnly SameSite=Lax `jaothui_browser_sid`; Event owns its own opaque cookie. HTTPS production uses Secure. Server responses are no-store with no-referrer.

## Contract

GET `/api/auth/event-sso/authorize?eventId=...&state=...&code_challenge=...&code_challenge_method=S256` redirects only to the fixed Event callback with `code,state`, or resumes `/v2/event-entry` for login/LINE attachment. Event IDs follow existing source/mobile document IDs: first ASCII letter/digit, then letters/digits/dot/underscore/hyphen, max128; reject consecutive dots and draft/version namespaces. State permits base64url32..128; challenge is43 base64url characters. Grants expire within120 seconds.

All three backchannel POSTs require dedicated `Authorization: Bearer <CLIENT_SECRET>` and strict JSON. Exchange body `{code,codeVerifier,redirectUri}` returns `{ok:true,data:{sessionToken,expiresAt,account:{accountId,lineId,displayName,avatarUrl,email},eventId}}`. Introspect body `{sessionToken}` returns `{ok:true,data:{expiresAt,account:{accountId,lineId,displayName,avatarUrl,email}}}`. Dates are ISO8601. Revoke body `{sessionToken}` returns `{ok:true,data:{revoked:true}}` and idempotently revokes this browser's Event family. Errors are `{ok:false,error:{code}}`; 401 invalid/revoked, 403 CSRF, 409 identity conflict/change, 503 unavailable. No input accepts client accountId or grants staff roles.

Code consumption is one atomic DB transaction, locks active Account and browser parent, checks current LINE ownership and parent credential binding/expiry/revocation, then conditionally consumes exactly once. Every introspection rereads current identity/status and wallet linkage. Root login/switch atomically revokes the old browser family and creates a new random family before success. Root logout revokes before clearing cookies; consumer logout revokes only linked Event credentials. Other browsers remain independent, including credentials issued in the same JWT second.

Wallet-first attachment is a typed, signed, short-lived durable intent bound to the current random browser and account. It claims once before provider exchange, verifies LINE ID-token nonce server-side and attaches to that same account under locks. It never performs ordinary LINE login, switches accounts, merges by email, or migrates Sanity data. The receipt stores only a hash of the verified LINE subject and timestamp; no provider tokens/profile are persisted. A failed/claimed provider exchange requires starting a fresh attach attempt. Existing LINE ownership conflicts return409 and preserve the original wallet account.

## Deterministic local proof

Use only the already-owned loopback target after additive migration:

```sh
JAOTHUI_EVENT_SSO_E2E_DATABASE_URL='postgresql://jaothui_e2e@127.0.0.1:55432/jaothui_local_e2e?schema=public' npm run test:web-event-sso
```

The test verifies SQL server identity before work, uses unique synthetic namespaces, retains its additive audit rows, never resets/truncates and never contacts live providers. Eight real Prisma clients race redemption with exactly one winner. Synthetic provider transport is injected for attach security checks. Full type/lint/build and existing auth/mobile contracts remain required.

Rollback: disable both SSO flags and public entry activation, keep existing direct LIFF, retain tables/revocation/audit history. Use an ordinary revert PR if source rollback is needed; never remove accounts, registrations or migrations as rollback cleanup.
