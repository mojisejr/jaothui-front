# LINE reliability — Slice 1 baseline

Test preparation only. No production behavior, schema, environment, or mobile
binary changes belong to this slice. Parent mission: `#jaothui-line-login-reliability`.

> Historical Slice 1 guide. Slice 2 changes application error handling; use
> [Slice 2 verification](slice2-verification.md) and the
> [controlled cutover runbook](production-cutover.md) for the current branch.
> `test:line-reliability` must now be green. Historical `:baseline` mode is
> expected to reject the fixed code; do not run it as a passing CI gate.

## Deterministic reproduction

```sh
bun run test:line-reliability:baseline
bun run test:line-reliability
```

The first command must reproduce **exactly** the recorded baseline (26 cases,
15 desired controls pass, 11 known status defects). The second is the desired
contract and is **expected RED before Slice 2**. Never label baseline success as
the fix passing. After the fix, strict mode must be green and the old baseline
mode will intentionally reject the changed results.

The real profile/me handlers, auth verifier, active-account guard and profile
loader run with synthetic JWTs. Only the Prisma infrastructure module is
replaced with a constrained in-memory seam; unexpected database methods and
network access throw. No real LINE codes, credentials, accounts or provider
requests are used. The matrix covers valid LINE-only/no-wallet access;
missing, malformed, expired and bad-signature JWTs; missing/deleted accounts;
capacity, connectivity and timeout failures; signing-config and unknown errors.
It cannot prove actual LINE consent, database contention or installed-app return.

## Disposable local target

This lane uses **127.0.0.1:55433** and is separate from the existing 55432 local
E2E lane. Never fall back to `.env`, `DATABASE_URL` or `DIRECT_URL`.

```sh
node scripts/line-reliability-local-target.mjs --self-test
JAOTHUI_LINE_E2E_DATABASE_URL='postgresql://jaothui_line_e2e@127.0.0.1:55433/jaothui_line_reliability_e2e' node scripts/line-reliability-local-target.mjs --probe
```

The guard pins host, port, role and database, rejects passwords/query overrides,
and gives psql a clean child environment. The probe runs a read-only transaction
and checks actual database identity. It does not migrate, seed or load test.
Local PostgreSQL binaries are required at `/opt/homebrew/bin`; this is an
explicit Mac-only probe, not a portable deployment script.

To provision a new **empty disposable** cluster, choose a fresh `mktemp -d`
directory, run Homebrew `initdb --username=jaothui_line_e2e --auth=trust
--no-locale -E UTF8`, and start it with `pg_ctl` listening only on `127.0.0.1`,
port `55433`, with the socket inside that directory. Create only the pinned
database as the pinned test role. Stop if the port is already in use; never stop
an existing service to make room. Trust auth here is for synthetic local data
only. Stop this exact cluster with `pg_ctl -D <validated-data-dir> -m fast -w stop`
after use. Do not copy production data or run an application server against it
until the next slice's schema/seed isolation checks pass.

Recorded Slice 1 target: `/tmp/jaothui-line-slice1.AWChWf/data`, PostgreSQL
14.19, empty database, no application schema/fixtures. It is stopped after proof
and temporary storage may disappear. Slice 2 must recheck identity/readiness.
It does **not** emulate Supavisor, transaction pooling, or prove parity with the
production database version. Docker fallback was unavailable (daemon stopped).

## Frozen Slice 2 integration contract (not run in Slice 1)

Before any writes/load: prove isolation; create synthetic schema/fixtures only
on the dedicated target; validate the candidate transaction-pooling behavior
with the actual installed Prisma version. A direct local PostgreSQL pass alone
does not close pooler compatibility. No production/production-backed Preview
fallback is permitted. Missing isolation or pooler proof is a waiting gate.

- New/existing/concurrent LINE identity creation stays unique; no wallet or web
  priming requirement; account deletion and inactive-account denial preserved.
- 50 simulated account/profile sequences, concurrency 10, zero capacity/wrong
  401 failures and p95 <= 5 seconds, excluding human/provider waits.
- Freeze target, fixture, pool topology, Prisma version, connection budget and
  measurement boundaries before measuring; retain sanitized results.
- Regression: web LINE, mobile LINE/Apple, legacy wallet, profile/me, reviewer
  sandbox, account deletion and wallet linking; lint, tsc and build.
- Installed Android and iOS/provider proof remains a later operator gate.

## Rollback readiness / stop line

Baseline source: `f17e1b0b2216d2227362201aa1698a182a170fdc`.
Production deployment: `dpl_7ZABQjZ3gi2W5uiPpP6AMfYAs2Y1`.
These identify code, not a verified good connection configuration. Separate
code rollback from environment rollback: immutable deployments may embed the
old session-mode configuration. Prefer prior-good code freshly deployed with
the validated runtime configuration if needed. Only the owner may back up and
change Production secrets during the explicit Slice 3 gate. Do not touch
operator/migration configuration (`DIRECT_URL`) or other environments.

No PR, push, production deploy/env write, migration, native build or release in
Slice 1. Do not bypass active-account checks during outages. See
[config inventory](config-inventory.md) for evidence boundaries.
