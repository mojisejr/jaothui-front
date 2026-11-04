# Competition reminders — operating and cost contract (#226)

This feature is delivered with sending **off**. Merging its source does not authorize a migration, a build, Cron activation, a pilot push or public sending. Native and browser delivery acceptance remain pending separately authorized device tests.

## User policy

- One reminder at 09:00 Asia/Bangkok on the day before the competition's canonical start date.
- Normal events: a current registration qualifies. Royal events: only an accepted application qualifies. Unknown event types do not qualify.
- One logical reminder per account/event/schedule/slot, then one delivery per opted-in installation. Multiple buffalo and competition levels do not multiply messages. Enabling native and web on the same phone can produce both channels.
- Catch up only while the same reminder window remains valid; stop new sends at midnight Bangkok when the event day begins. Registration closing alone does not cancel attendance reminders. Event closure/cancellation does.
- Public event name/date only on the lock screen. Taps open authenticated owned registration history, including after signup closes. Provider acceptance does not prove display or reading.

## Components and ownership

Invitation cards appear after confirmed competition signup and on owned registration history. They reuse the existing opt-in/settings flow and never request OS permission on mount. “Later” dismisses the invitation for seven days on this device/account across those placements; profile settings remain available. Native invitations hide when notifications are enabled, denied, unsupported or unavailable. Storage/availability failures must not block signup.

Event links to the fixed `https://www.jaothui.com/v2/profile#competition-notifications` destination. Browser permission belongs to WWW, so Event cannot claim to know its permission state or request it on WWW's behalf. The destination opens the settings panel, then the user explicitly presses the enable control. Event may read only the existing public config via GET CORS for the exact configured Event origin, without credentials; this adds no new identity endpoint or paid service. These config reads consume ordinary hosting requests, not Sanity audience queries. Shared generic success pages must not show competition invitations after unrelated member/vote/admin actions.

Sanity remains the competition/application authority. Existing Front/Postgres owns installation bindings, delivery deduplication, leases/checkpoints and usage counters. Expo Push handles native transport; standard Web Push/VAPID handles browser transport. No new database project, broker, campaign provider, paid Firebase service or runtime AI is required.

The browser origin is `https://www.jaothui.com`. Web subscriptions belong to that origin and are not silently shared with an apex domain or Event. The Service Worker handles push/click events only; it does not introduce offline caching. Supported iPhone/iPad web push requires an installed Home Screen web app and explicit permission; a LINE WebView is not an equivalent installation.

## Configuration inventory

Keep values in existing server secret/configuration storage. Never put private VAPID, Expo access, Cron or Sanity tokens in client-public variables, PRs or logs. Public VAPID and Expo project identifiers are deliberately public.

| Variable | Purpose / safe default |
| --- | --- |
| `JAOTHUI_PUSH_REGISTRATION_ENABLED` | Enables opt-in registration; false when absent. Independent of carousel/registration write switches. |
| `JAOTHUI_PUSH_MODE` | `off`, `dry-run`, `pilot`, `live`; absent means off. |
| `JAOTHUI_PUSH_SENDS_APPROVED` | Explicit second gate for real sending; false when absent. Real transports also require the production environment. |
| `JAOTHUI_PUSH_PILOT_ACCOUNT_IDS` | Explicit small account allowlist for a later authorized pilot. |
| `JAOTHUI_PUSH_DAILY_ATTEMPT_LIMIT` | Explicit work ceiling for real sending, chosen from measured audience and approved operational limits. Not a currency budget. |
| `JAOTHUI_PUSH_DAILY_SOURCE_REQUEST_LIMIT` | Source API request ceiling. Check the actual remaining monthly Sanity allowance before selecting the production value. |
| `JAOTHUI_PUSH_MAX_PER_RUN` | Bounded batch size; remaining work must continue from durable state. |
| `JAOTHUI_PUSH_RUN_BUDGET_MS` | Bounded processing time below the deployed function timeout, with time reserved to checkpoint/exit. |
| `JAOTHUI_PUSH_CRON_SECRET` | Dedicated server authorization for the worker route. Cron is not installed by this PR. |
| `JAOTHUI_EVENT_SANITY_READ_TOKEN` | Dedicated read token when available; validate source/project/LINE namespace. Keep reads authoritative. |
| `JAOTHUI_WEB_PUSH_VAPID_PUBLIC_KEY` / `PRIVATE_KEY` / `SUBJECT` | Browser push credentials/contact. Do not generate or rotate production keys during a code-only review. |
| `JAOTHUI_EXPO_ACCESS_TOKEN` | Expo enhanced push-security token when enabled for the project; never a client credential. |

The public config endpoint is `/api/notifications/config`. Native bearer and web cookie installation endpoints are `/api/mobile/v1/notifications/installation` and `/api/notifications/installation`. Generation-scoped disable-only handles use `/api/notifications/revoke`; clients must not retain full login credentials merely to retry offline logout.

## Cost evidence and limits

Verified 4 November 2026 around 11:00 Bangkok: EAS account `nonthasak` is Free, with 11 Android and 14 iOS builds remaining in the cycle ending 1 December 07:00 Bangkok. This is a snapshot, not a reservation. Recheck before any later authorized build.

Minimum existing testing flow, if no repairs are needed: Android internal APK plus production AAB = two Android builds; one production iOS IPA can be tested in TestFlight and submitted unchanged to App Store. Adding native notifications needs a new native binary; OTA alone cannot add the module. EAS Update's 1,000 MAU allowance is not a limit on push recipients. No plan upgrade is currently necessary or authorized.

Expo Push and Firebase Cloud Messaging have no per-message fee. Web Push/VAPID adds no separate paid provider subscription. Existing Apple/Google distribution account costs remain existing costs.

Front's configuration at research time was **non-Fluid** (`fluid:false`), standard memory, default 15-second timeout. Illustrative legacy function cost for a five-minute Cron over 30 days:

`8,640 calls × 2 GB × average seconds / 3,600 × $0.18 + 8,640 / 1,000,000 × $0.60`

| Assumed average execution | Function list-cost illustration / 30 days |
| --- | ---: |
| 1 second | $0.87 |
| 5 seconds | $4.33 |
| 15 seconds | $12.97 |

These are scenarios, **not measurements, whole-feature estimates or spending caps**. They exclude extra registration APIs, retries, database usage, traffic, taxes and 31-day months. Verify the actual deployed worker memory/billing configuration. Existing Vercel Pro's $20 monthly usage credit is shared across the team; available credit has not been verified.

One ordinary Sanity metadata request every five minutes is 8,640/month before due-event pages and fresh eligibility checks. Current authoritative reads do not use the API CDN. Published Sanity allowances are not proof of this project's plan or remaining headroom. Actual Supabase plan/headroom is also unverified; earlier authorized metadata access was denied. Do not replace this gap with a promise of no additional bill.

Before activation, record actual plan/headroom, opted-in audience, source calls, function elapsed time/memory, DB ledger size, retry rate and projection for busy event days. A dry-run must never consume live delivery dedup keys or mark a notification delivered.

Check **capacity as well as cost**: the D-1 window contains approximately 180 five-minute ticks. Compare eligible endpoints (including multiple opted-in channels) and retry/receipt work with measured completed deliveries per tick and the time left before expiry. `MAX_PER_RUN` is a ceiling, not promised throughput; per-endpoint provider latency can reduce the number completed inside the runtime budget. Do not activate an audience that cannot drain before cutoff. Adjust batching/schedule only after reviewing the measurements and updated usage forecast.

Work caps pause/defer this feature, not unrelated registration or all Vercel projects. Exceeding a cap must produce a visible budget-exhausted result and retained backlog; never report a partial scan as complete. A currency cap cannot be inferred from message count alone. Do not configure a team-wide hard billing stop without reviewing its effect on existing sites.

## Later release order — requires owner authorization

1. Review linked Front #226, Mobile `mojisejr/jaothui-mobile#35` and Event `mojisejr/jaothui-event#132` changes and automated evidence. Keep send switches off.
2. Apply the reviewed additive Postgres migration through the authorized migration process. Verify notification tables are server-only and not exposed to anonymous/authenticated browser database roles. Do not rewrite Sanity registrations or delete existing records.
3. Merge/deploy compatible backend and Event fixed-history handoff to accepted branches before releasing clients. Verify the API contract belongs to accepted main, rather than an old feature preview. Preserve existing app 1.0.7 and carousel registration callers.
4. Verify required read/push credentials, actual quotas and measured dry-run report. Set explicit work ceilings. Install a five-minute Cron only when separately authorized; no Cron activation is part of this source-only handoff.
5. With separate build approval, produce Android testing binary and iOS TestFlight binary. Record build IDs, version/commit, real device/OS, permission state, token-binding result and redacted failures. No simulator or web rendering closes native delivery proof.
6. With separate pilot-send approval, allowlist the owner's accounts/installations. Test one reminder per supported channel: background display, cold-start/expired-login tap to owned history, account switch/logout, signup closed, event rescheduled/cancelled and expiry. Record provider receipt versus observed display separately.
7. Only after owner acceptance and cost review, enable the approved audience. Expand deliberately, observe usage/lag/errors and keep rollback available.

Code tests and PR readiness do not mean native/web rollout is proven. Actual permission, OS dispatch, browser install state and cross-origin login require the later operator/device gate.

Event intentionally retains its SSO mode marker after session expiry. If SSO is disabled or unavailable, that browser must not silently fall back to a potentially different LIFF account. Legacy LINE browsers can use their existing authentication path; formerly SSO browsers may remain blocked until SSO recovery or explicit account recovery. Do not advertise seamless history access during an SSO outage as a delivery guarantee.

## Operations and rollback

- Monitor last successful reconciliation, oldest pending work, due/eligible/suppressed counts, attempts, provider errors/receipts, source calls, runtime and work-budget exhaustion using existing logs/counters. Redact destination tokens, subscription URLs and applicant details.
- A failed Sanity read is a retryable failure, not an empty audience. Reconcile late opt-in/approvals within the valid window. A poster/title edit is not a new schedule.
- Disable invalid/unregistered destinations. Pause a transport on credential errors. Confirmed transient provider rejections retry with bounded backoff before expiry. Ambiguous network failures are recorded as `unknown` and are not automatically resent, because the provider may already have accepted the first request. Inspect those outcomes before any explicit retry decision; exactly-once delivery is not promised. Collect Expo receipts in later ticks, never hold a function open waiting for them.
- A credential pause persists in `NotificationScanState` under `transport:expo` or `transport:web`. After the owner authorizes credential repair, explicitly clear that state's `cursor.paused` flag and observe the next bounded run. Changing credentials alone does not silently replay queued work.
- Explicit logout/switch revokes that installation; account deletion revokes affected bindings. Cookie/session age alone does not cancel durable consent. Stale offline revocation must not disable a newer owner binding.
- Stop real sending with the server gates; disable Cron separately if stopping ongoing work/cost. Keep opt-out/revocation functional. Roll back clients independently while preserving additive operational tables and dedup evidence. Do not use destructive down-migrations.
- On resume, discard expired work and reconcile current ownership/date/eligibility. Never replay a historical backlog after the event day. Already queued/displayed provider notifications cannot be recalled.
- Bound completed delivery detail retention (proposed 90 days); keep dedup tombstones through the relevant event and retry horizon, including reschedules. This does not authorize deletion of competition data or Oracle memory.

## Official pricing and delivery references

- [Expo Push FAQ](https://docs.expo.dev/push-notifications/faq/)
- [Expo plans](https://expo.dev/pricing)
- [Firebase pricing](https://firebase.google.com/pricing)
- [Vercel legacy function pricing](https://vercel.com/docs/functions/usage-and-pricing/legacy-pricing)
- [Vercel Pro monthly credit](https://vercel.com/docs/plans/pro-plan#monthly-credit)
- [Vercel Cron operations](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Sanity pricing](https://www.sanity.io/pricing)
- [Supabase pricing](https://supabase.com/pricing)
- [Expo delivery and receipts](https://docs.expo.dev/push-notifications/sending-notifications/)
