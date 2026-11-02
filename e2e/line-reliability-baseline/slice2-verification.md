# Slice 2 verification — backend error hardening and pool candidate

Recorded 2026-10-17 (Asia/Bangkok), branch `codex/line-reliability-backend`, based
on Slice1 `bbf3dab` / production source `f17e1b0`. No production rollout claimed.

## Deterministic application proof

| Gate | Final result |
| --- | --- |
| Strict LINE real-handler matrix | 28/28 pass; valid LINE-only200, invalid/expired/missing/deactivated401, transient DB503, config/unknown500 |
| Auth-failure suite | 24 classifier cases,26 real-handler checks,5 generated-RSA Apple signature/claims checks;72 allowlisted log entries; forbidden I/O0 |
| Prisma initialization failures | Real Prisma5 errorCodeP1001→503; P1011/P1000→500, never401; wrapped cause handled, cycles bounded |
| Identity race contract | 10 scenarios: matching compoundP2002 retry once, persistent collision stops after2; unrelated target/model/wallet/P1001/unknown not retried |
| Fresh-profile deletion race | Missing/deactivated second lookup→401; no legacy-member lookup; valid active/no-wallet still200 |
| Pool/config/CA contract | Explicit CA path only; endpoint/role/password/budget/TLS preserved; raw engine logging off; pinned CA fingerprint and tracing include |
| Final17 contract suites | All exit0 (list below) |
| tsc / lint / build / diff-check | Exit0; existing hook/img/alt lint warnings and old Browserslist warning remain |
| Local CA trace artifacts | Present in profile,me,mobile-LINE callback and web-LINE callback .nft.json server traces |
| Schema/dependency boundaries | Application schema/migrations/lockfile unchanged; fixture-only Prisma schema is never migrated to any remote DB |

The final17 suites were LINE reliability, auth failure, pool config, mobile auth,
mobile LINE, web LINE, Apple, mobile account-profile, account service, reviewer,
account deletion, mobile wallet linking, web LINE wallet linking, local E2E
contract, local E2E API contract, home-version toggle and image allowlist.
They ran with synthetic loopback DB overrides. Build also used a synthetic
127.0.0.1:1 database URL, not production; compilation is not login/data proof.

Historical `test:line-reliability:baseline` deliberately rejects the fixed tree;
strict `test:line-reliability` is the passing gate now. A legacy web-state test
was made deterministic: replacing the final signature character with a fixed0
occasionally changed nothing. The new tamper always changes that character;
signature validation itself was not weakened.

## Isolated write/concurrency proof

PostgreSQL14.19, direct127.0.0.1:55433, dedicated synthetic database/user from
Slice1. Only the existing Account/AccountIdentity/WalletLink migration SQL was
applied to this previously empty local fixture. No remote schema/data copied or
modified. Checksum-verified official PgBouncer1.24.1 built in a temporary local
directory, transaction mode on127.0.0.1:55434, max_prepared_statements0,
default/max server pool2. Ten separate Prisma5.14 clients, connection_limit1,
connect_timeout5/pool_timeout10. Runtime SHOW POOLS verified10client/2server
connections, not a single serialized Prisma client.

One pre-fix repeat revealed P2002 from concurrent nested first-identity upserts
(49/50 passed). This is why the exact compound-key bounded retry was added.
After that fix, five consecutive frozen50sequence/concurrency10 runs passed:

| Run | Successful sequences | p95ms | maxms |
| --- | --- | --- | --- |
| 1 | 50/50 | 20 | 25 |
| 2 | 50/50 | 17 | 18 |
| 3 | 50/50 | 18 | 19 |
| 4 | 50/50 | 15 | 15 |
| 5 | 50/50 | 17 | 18 |

Each run also proved new/existing/concurrent same-subject identity uniqueness,
LINE-only profile without wallet/web priming, real profile/me200 then401 after
synthetic deletion, clean reprovision, no wallet rows or orphan active accounts.
250/250 sequences passed, zero capacity/wrong401 errors, all p95 below frozen5s.
These local measurements exclude provider/human waits and are not production
latency promises. Dedicated PostgreSQL and PgBouncer were stopped afterward;
synthetic fixture data is retained locally, not deleted. Revalidate before reuse.

## Linux / actual Supavisor read-only TLS proof

Official public Supabase CA SHA256 certificate fingerprint:
`80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`.
OpenSSL hostname/chain verification passed. Actual Prisma5.14.0 engine
`e9771e62de70f79a5e1c604a2d7c8e2a0a874b48` on Linux/x64 Node22.23.3
successfully ran the bounded read-only metadata/constant1 transaction against
the existing Supavisor6543 candidate with pgbouncer=true, limit1, waits5/10,
sslmode=require, sslaccept=strict and sslcert pointing to the bundled CA.
An unrelated synthetic CA was rejected withP1011. No user-table read, account
write, load generation, production secret retrieval/change or deployment.
Earlier Linux/ARM Node20 proof also passed; the Node22/x64 repeat aligns better
with the project's Node22 setting but is still not a Vercel deployment proof.

`pg_stat_ssl` reported the internal Postgres↔pooler leg withoutTLS. It does not
observe this client's TLS leg: require/strict and wrong-CA rejection verify the
client↔pooler connection. We did not modify the provider's internal topology.

The Darwin Prisma/native Security.framework strict-CA connection returned
certificate-not-trusted; this local limitation is not relabeled as a pass.
Do not use sslaccept=accept_invalid_certs or change the system trust store to
hide it. Prisma5 uses sslcert, not sslrootcert; the version-matched parser and
Linux run are the configuration evidence. Containers used read-only host
mounts/rootfs and ephemeral tmpfs; test containers were automatically removed.

## Runtime / operator truth still Pending

- No production env change, merge, deploy, migration, auth-secret rotation or
  mobile build/release in Slice2. Production remained Ready on observed
  `dpl_7ZABQjZ3gi2W5uiPpP6AMfYAs2Y1` at the pre-PR recheck.
- Vercel-deployed certificate packaging, actual Production secret/target scope,
  merged SHA, public aliases and observed real traffic require Slice3 approval.
- Browser/Web Truth Pending; Native Eye Pending separately for Android/iOS.
  Mock providers, local concurrency and Linux connectivity do not prove real
  LINE consent/browser→app return/SecureStore or final deployment readiness.
- No Preview auth/write/load test: its database isolation is not established.
  No public diagnostic endpoint was added. Parent plan's CUA/owner login rules
  remain in force for later actual provider checks.

Next: reviewed backend PR + [owner-controlled cutover](production-cutover.md).
