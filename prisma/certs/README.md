# Public Supabase trust anchor

`supabase-prod-ca-2021.crt` is a **public CA certificate**, not a private key or
credential. Fetched over verified HTTPS from the URL used by Supabase Studio:

https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

Vendor source for that download URL:
https://github.com/supabase/supabase/blob/master/apps/studio/hooks/custom-content/custom-content.json
(`ssl:certificate_url`, production environment).

SHA256 certificate fingerprint:
`80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`

Expiry: 2031-04-26. Revalidate against the owner's Supabase Dashboard download
before rollout and whenever the provider rotates its chain. Do not replace it
with a leaf/intermediate copied from an unverified socket.

Prisma **5.14.0 Rust connector** uses `sslcert` for this trust anchor;
`sslrootcert` is not recognized by that engine version. Use `sslmode=require`
and `sslaccept=strict`, never `accept_invalid_certs` as a workaround. Only an
explicit `sslcert=certs/supabase-prod-ca-2021.crt` is resolved by
`server/prisma-url.ts` to an absolute bundled path at runtime. This does not
switch the database, mode, credentials or TLS policy. Next tracing explicitly
includes the certificate in serverless bundles.

Version-matched engine source:
https://github.com/prisma/prisma-engines/blob/e9771e62de70f79a5e1c604a2d7c8e2a0a874b48/quaint/src/connector/postgres/url.rs

Official guidance:
https://supabase.com/docs/guides/database/connecting-to-postgres#ssl
