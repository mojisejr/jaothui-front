# Slice 1 verification record

Recorded 2026-10-16 20:22 +0700, branch `codex/line-reliability-slice1`,
baseline source `f17e1b0b2216d2227362201aa1698a182a170fdc`.

| Check | Actual result |
| --- | --- |
| `bun run test:line-reliability:baseline` | Exit 0: 26 cases, 15 desired controls pass, 11 exact known status defects, forbidden I/O 0 |
| `bun run test:line-reliability` | Expected exit 1: the same 11 desired contracts are RED; no fix claimed |
| `node scripts/line-reliability-local-target.mjs --self-test` | Exit 0: 1 allowed target, 10 rejected targets |
| Pinned local `--probe` | Exit 0: actual database/user/listener match, read-only transaction |
| Local application-table inventory | 0 tables; no migrations, fixture insertion or production data copied |
| Disposable PostgreSQL cleanup | Exact newly created cluster stopped; 55433 has no listener |
| Ten related contract suites below | All exit 0 |
| `bunx tsc --noEmit` | Exit 0 |
| `bun run lint` | Exit 0; pre-existing hook/image/alt warnings remain |
| `bun run build` with DB URLs overridden to synthetic 127.0.0.1:1 | Exit 0; compilation/SSG proof, not live-data or login proof |
| `git diff --check` | Exit 0 |
| Diff against baseline under pages/server/prisma/src/components | Empty: production application code unchanged |

Regression scripts: `test:mobile-auth-contract`, `test:mobile-line-auth-contract`,
`test:line-web-auth-contract`, `test:mobile-apple-auth-contract`,
`test:mobile-account-profile-contract`, `test:account-service-contract`,
`test:reviewer-sandbox-contract`, `test:account-deletion-contract`,
`test:mobile-wallet-link-contract`, `test:line-wallet-link-contract`.

These ran with synthetic loopback DB URLs. The legacy mobile-auth script
defines its own signing fallback; inherited `JAOTHUI_MOBILE_AUTH_SECRET` was
cleared for the regression runner so that the script's synthetic key is used.
The new baseline runner independently overrides its signing secret and denies
network access before importing the real handlers.

One local probe implementation check initially failed because PostgreSQL 14's
psql emitted only the final COMMIT result for a multi-statement `-c`. Splitting
BEGIN/SELECT/COMMIT into separate commands made the database identity assertion
visible; no relaxation of target validation or read-only protection was made.

## Remaining gates (not Slice 1 claims)

- Slice 2: actual code fix; strict contracts green; unique synthetic identity
  integration/concurrency and verified transaction-pooler configuration.
- Slice 3: owner secret backup, explicit go-live approval, environment change,
  merge/deploy provenance and actual-traffic observation.
- Actual LINE/web and installed Android/iOS login proof: Pending, platform
  specific. No browser/native eye is required for this test-only slice; no UI
  or mobile source changed. Do not infer those lanes are closed.
- No PR, push, production code/config/schema/data writes, deployment, mobile
  build or Store action performed by this slice.
