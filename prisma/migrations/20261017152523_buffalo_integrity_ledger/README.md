# Buffalo integrity ledger — Phase 2 migration

This migration adds only the private `buffalo_integrity` schema. It does not change
`Pedigree`, `Reward`, `Microchip`, account tables, public read routes, storage policies
or the existing dashboard write flow. The dashboard engine remains disabled for live
use until the remaining integration and release phases are qualified together.

The migration belongs here because this repository owns the three migrations already
recorded in the shared database. Do not create another baseline in the dashboard or
use `prisma db push`. The dashboard keeps a byte-identical SQL release artifact for
its isolated engine tests; production deployment uses this existing Prisma lineage.

## Review and rehearsal

The SQL runs in one transaction with five-second lock and thirty-second statement
timeouts. It adds operation, transaction-step, reservation, wallet-lease and event
tables. Intent, approved plans and signed transaction envelopes cannot be rewritten;
operation/step deletion and event mutation are rejected. Active reservations are
released by the coordinator without deleting the retained journal.

All five tables enable RLS. `PUBLIC`, `anon` and `authenticated` receive no schema,
table, sequence or function access. Trigger functions use invoker security. The
server currently uses the privileged database owner connection; a separate future
runtime role needs explicitly reviewed grants and policies before activation.
No signed bytes or operation payloads should be exposed through the Data API.

Rehearse with the pinned Prisma 5 CLI against a disposable PostgreSQL 15.1 database:

1. Apply the three existing migrations, then the new migration with `prisma migrate
   deploy`. Run deploy again and require no pending migrations.
2. Compare the `public` schema before and after. It must remain unchanged.
3. Create disposable `anon`/`authenticated` roles before migration, and run
   `node scripts/buffalo-integrity-ledger-check.mjs` using the explicit
   `BUFFALO_INTEGRITY_TEST_DATABASE_URL`. The script requires loopback, the exact test
   database name and the disposable database marker; all its fixtures roll back.
4. Run dashboard concurrency, receipt, replay, restart and local EVM failure tests.
   A SQL-only check does not prove transaction recovery or publication correctness.

## Release boundary and recovery

This is a draft migration package for the combined five-phase release, not an
instruction to apply it to production now. Before any future application, verify
the database target, applied migration checksums, ownership/default grants, backup
and compatible dashboard release. Preserve old public reads throughout cutover.

If application fails, inspect the transaction and Prisma migration status before
retrying. Do not mark an unapplied migration as applied. Do not drop this schema or
erase signed/pending steps as an application rollback. Stop new work and reconcile
known transaction hashes first; retain the additive journal during rollback. The
full deployment, storage cutover and staff runbooks are completed in later phases.
