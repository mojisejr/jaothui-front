# Read-only Linux / Prisma5 / Supavisor TLS proof

This fixture is never migrated. It generates a minimal Prisma5.14.0 client in
an ephemeral Linux container, runs one read-only transaction querying connection
metadata/constant1 only, and rejects an unrelated synthetic CA. It reads no user
tables, does no load test and changes no production configuration.

Use the existing local Docker context only. Image used:
`node@sha256:0e5f906573693feaa1e21057ebdcfdb5bd5021f050b2dc7c9deceb629c7da2a8`
(node22-bookworm, linux/amd64). Packages are pinned to Prisma/client5.14.0 in this fixture;
install artifacts and the synthetic private key stay in container tmpfs, which
is removed with `--rm`. Nothing installs into the application checkout.

Supply `CANDIDATE_DATABASE_URL` through a secure inherited environment (no value
in command arguments/chat). The probe pins the expected pooler hostname/6543,
then explicitly sets finite budget/strict TLS parameters and the bundled CA.
It has no production URL fallback. Database identity/credentials are never printed.

Run from the frontend root after secure environment setup:

```sh
docker run --rm --platform linux/amd64 --name jaothui-line-slice2-tls \
  --read-only --tmpfs /tmp:rw,nosuid,exec,size=768m \
  --cpus 2 --memory 2g --pids-limit 256 \
  --mount "type=bind,source=$PWD/e2e/line-reliability-baseline/linux-tls,target=/fixture,readonly" \
  --mount "type=bind,source=$PWD/prisma/certs,target=/certs,readonly" \
  --env CANDIDATE_DATABASE_URL \
  --env DATABASE_URL=postgresql://synthetic@127.0.0.1:1/never_connect \
  --env NPM_CONFIG_CACHE=/tmp/npm-cache \
  node@sha256:0e5f906573693feaa1e21057ebdcfdb5bd5021f050b2dc7c9deceb629c7da2a8 \
  bash -lc 'mkdir -p /tmp/line-tls && cp /fixture/package.json /fixture/schema.prisma /fixture/probe.mjs /tmp/line-tls/ && cd /tmp/line-tls && npm install --silent && node node_modules/prisma/build/index.js generate --schema=schema.prisma && openssl req -x509 -newkey rsa:2048 -nodes -keyout wrong-ca.key -out wrong-ca.crt -days 1 -subj /CN=synthetic-unrelated-ca >/dev/null 2>&1 && node probe.mjs'
```

`exec` on tmpfs is necessary for the generated native engine; read-only rootfs
and host mounts remain enforced. Do not disable certificate verification if the
probe fails. `pg_stat_ssl` measures the Postgres-to-pooler leg, not client TLS:
the client leg is enforced by require/strict and proved by the wrong-CA rejection.

Linux success does not claim Darwin Prisma success: the macOS Security.framework
lane returned certificate-not-trusted and remains an explicit local limitation.
It also does not prove a particular Vercel deployment's packaging/env/provenance;
that remains a gated Slice3 runtime check.
