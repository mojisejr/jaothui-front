# LINE reliability configuration inventory

Inspected 2026-10-16 (Asia/Bangkok). Values/secrets are deliberately excluded.

## Deployment and source

- Vercel scope: `nons-projects-2ee1d9ee`; project: `jaothui-front`.
- Project ID: `prj_9pGr6bPEKwcwzNE46T7QEyIU8cDX`.
- Current Ready production: `dpl_7ZABQjZ3gi2W5uiPpP6AMfYAs2Y1`.
- Source: `f17e1b0b2216d2227362201aa1698a182a170fdc` on main; build log
  confirms deployment completed 2026-10-15 09:03 UTC.
- Public aliases include `www.jaothui.com` and `jaothui.com`.
- `prisma/schema.prisma` consumes `DATABASE_URL` only. Vercel lists encrypted
  `DATABASE_URL` and `DIRECT_URL` in Development/Preview/Production. No plaintext
  production connection URL was retrieved; names do not prove actual purposes.
- `server/prisma.ts` already reuses a module/global PrismaClient. This does not
  cap total connections across independently scaled Vercel instances.
- Installed Prisma CLI and client are both 5.14.0 (not just the manifest range).

## Observed failure boundary

The prior investigation recorded six unique mobile LINE callback requests
failing at `accountIdentity.upsert` with `EMAXCONNSESSION`, session-mode
`pool_size: 15`, during 2026-10-16 17:31–17:39 Thai time. Twelve matching log
entries are not twelve independent attempts. Later Android successes exist.
This proves a production session-pool capacity failure; it does not prove a
web-login prerequisite, correlate the user's precise latest attempt, or prove
an iOS failure. This slice rechecked deployment identity, not a new log window.

`profile` uses text matching that treats database “session mode” as an auth
failure; `me` maps every caught error to 401. The deterministic matrix
reproduces this independently of the production logs. Config errors must be
500, transient DB failures 503, confirmed auth/inactive denial 401.

## Other consumer inventory — local configuration, not production truth

| Consumer | Local pooler port / flags | Connection-identity comparison |
| --- | --- | --- |
| frontend | 5432; pgbouncer=true; connection_limit=1 | Matches dashboard locally |
| dashboard | 5432; neither flag present | Matches frontend locally |
| event | 5432; neither flag present | Different local identity; sharing unproven |

All inspected local URLs use the same Supabase regional pooler hostname; this
alone does not mean one database/project. Comparison used a digest of connection
identity without passwords; no raw URL/user was printed. Local `DIRECT_URL` was
absent for these consumers. Their deployed values/traffic remain unverified.
Both dashboard and event source include Prisma clients. Event public content
also uses Sanity; the historical “event is Sanity-only” assumption is unsafe.
Do not edit/deploy other consumers as part of this backend hotfix.

## Candidate and operator boundaries

Official Supabase guidance distinguishes session pooling (5432) from transaction
pooling (6543), the latter intended for transient/serverless workloads. Candidate
Prisma flags/budgets/timeouts/TLS must be tested with the installed client before
cutover. A prior isolated read-only 6543 transaction succeeded, but is not load,
identity-write or production-cutover proof. Do not infer readiness from it.

- [Supabase connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Prisma troubleshooting](https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting)

Owner preparation: identify Android/iOS testers and installed versions; retain
the current Production runtime secret securely outside chat. Secret backup is
not confirmed by this slice. Slice 3 requires explicit production go-ahead,
owner-controlled runtime-only change, then merge/deploy verification. Leave
DIRECT_URL, other environments, auth secrets, schema/RLS and data untouched.
Rolling back code and rolling back an environment are separate actions; an old
immutable deployment may restore the same session-pool risk.
