# LINE reliability — controlled backend cutover

This runbook prepares **Slice 3**, not authorization to deploy. The owner reviews
the backend PR but must **not merge before explicit production go-ahead**.
No mobile build is needed to benefit from this backend fix. Native completion
deduplication/provider-preserving retry remains a later mobile slice.

## What the code does / does not do

- Typed token/claim verification failures and confirmed inactive accounts401.
- Known transient database capacity/connectivity/pool-timeout failures503;
  signing configuration and unexpected failures500. Released JSON envelope is
  preserved; existing apps clear sessions on401, not503/500.
- Active-account checks remain mandatory. A fresh profile lookup returning no
  active account is denied even if the first guard passed moments earlier.
- LINE callback exposes only bounded machine codes. Failed service requests do
  not retry/replay an already consumed OAuth code. Start a fresh authorization.
- Logs contain allowlisted stage/category/UUID/duration only. Arbitrary request
  headers, codes, URLs, provider identities, tokens and raw Prisma errors are not
  emitted by the changed auth paths. Prisma raw engine/query logging is off.
- No schema/RLS/migration changes, account purge, auth-secret rotation, pool-size
  increase or paid plan change. Existing module/global client reuse is retained.

## Candidate runtime configuration

Owner obtains the **correct project's Supavisor Transaction connection URL**
from Supabase Connect, port6543. Preserve the intended database, runtime role,
password encoding and any existing schema selection. Do not derive the target
from hostname alone or copy an unrelated project's URL.

Append/update exactly these public parameters (never duplicate conflicting keys):

```text
pgbouncer=true&connection_limit=1&connect_timeout=5&pool_timeout=10&sslmode=require&sslaccept=strict&sslcert=certs/supabase-prod-ca-2021.crt
```

Prisma5.14 uses `sslcert`, **not `sslrootcert`**. Do not use libpq's `verify-full`
as a Prisma5 URL mode: the version-matched engine accepts disable/prefer/require.
Strict certificate checking plus the bundled trust anchor is tested on Linux;
an unrelated CA must fail. `server/prisma-url.ts` resolves only the explicit
bundled CA path to an absolute path. It does not switch ports/modes/credentials
or silently relax TLS. Existing URLs without this explicit CA selection pass
through unchanged. CA source/fingerprint/expiry are in [cert notes](../../prisma/certs/README.md).

One connection is the **per-instance** Prisma limit, not an account-wide cap.
The connection/pool waits are finite (5s/10s). Transaction pooling cannot make
an overloaded database or slow query infinitely scalable. Monitor real traffic.
The local concurrency figures are not production-latency promises.

## Owner + Codex steps (stop at each gate)

1. **PR review:** Codex supplies final commit, passing checks, safe evidence and
   this runbook. Owner confirms Android/iOS testers and installed versions.
2. **WAITING_PRODUCTION_GO:** owner explicitly approves the intended project,
   Production-only DATABASE_URL change and merge/deploy sequence. No secrets in
   chat, screenshots, issue/PR comments, shell arguments or logs.
3. **Secure backup:** owner stores the original Production DATABASE_URL in their
   approved password manager/secret store, plus original deployment ID/source.
   Codex has not retrieved or backed up the plaintext production secret.
4. **Owner configuration:** in Vercel scope `nons-projects-2ee1d9ee`, project
   `jaothui-front`, update **DATABASE_URL for Production only** to the candidate.
   If a variable is shared across environments, split/update only Production
   using the UI's scoped edit; do not accidentally change Preview/Development.
   Leave DIRECT_URL/operator/migration settings and other projects untouched.
5. **Owner merges PR:** after Codex confirms the configuration scope is ready,
   merge the reviewed backend head. Existing Git integration creates the new
   production deployment. Do not create a duplicate redeploy. Saving an env var
   alone does not change an already immutable running deployment.
6. **Codex verifies provenance:** Ready status, merged SHA, public aliases,
   certificate packaging/runtime behavior and bounded read-only checks/logs.
   Do not add a public diagnostic endpoint. Do not log into a Preview backed by
   unverified/shared production data or run load there.
7. **Owner tests installed apps separately:** Android and iOS each start directly
   in the app, without web login first; approve LINE and verify app return,
   profile, logout/login and reopen. Include fresh and existing controlled test
   identities when available, optional-wallet behavior and existing saved session.
   Do not delete a real customer's account just to test. Real provider/device
   proof is not replaced by reviewer sandbox, unit tests, simulator or build.
8. **Return evidence:** device model, OS, app version/build, approximate Thai time,
   outcome and safe request ID/screenshot if shown. No LINE ID, passwords, OTP,
   authorization URL, code, handoff or tokens. No iPhone means iOS stays Pending.
9. **Codex observes actual attempts:** immediate and bounded30-minute actual
   traffic window; correlate stage categories and successful callbacks/profile
   loads. No capacity/wrong401 failures in that window is meaningful only if
   real attempts occurred. Future recurring monitoring requires a separate ask.
10. **Proceed later:** only after this backend delivery's operator/runtime gates
    pass do we move to native once-only completion and store builds in later slices.

## Rollback

Baseline code/source: `f17e1b0b2216d2227362201aa1698a182a170fdc`.
Original observed deployment: `dpl_7ZABQjZ3gi2W5uiPpP6AMfYAs2Y1`.
Requery these at go-live; they are historical provenance, not a guaranteed good
connection configuration. Alias rollback can resurrect the session-mode secret
captured in that old immutable deployment.

- Code regression: prefer last-good code freshly deployed with the verified
  connection configuration; owner-approved rollback only.
- Connection regression: owner restores the securely backed-up runtime value
  and triggers one controlled deployment; disclose that old session-mode pool
  risk returns. Preserve DIRECT_URL and other environments.
- No schema rollback/data restore is needed. Do not rotate session secrets,
  purge accounts or bypass active checks. Sessions already cleared by the old
  app cannot be magically restored; users may need fresh login after recovery.

## Sources

- [Supabase Prisma troubleshooting](https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting)
- [Supabase connection modes/TLS](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Exact Prisma5 engine URL parser](https://github.com/prisma/prisma-engines/blob/e9771e62de70f79a5e1c604a2d7c8e2a0a874b48/quaint/src/connector/postgres/url.rs)
