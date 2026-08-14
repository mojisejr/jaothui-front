# JAOTHUI local account-deletion E2E database

This is a disposable PostgreSQL target for the account-deletion E2E lane. It is
not a development or production database, contains synthetic fixtures only, and
is reachable only on the Mac loopback interface.

## Safety contract

- Never copy, dump, restore, or seed production/Supabase/customer data here.
- Do not read, edit, or source `.env` or `.env.local` for this lane.
- Use `prisma migrate deploy` only. `prisma migrate dev` and `prisma db push`
  are forbidden.
- Every command accepts `JAOTHUI_E2E_DATABASE_URL`, validates it first, and
  passes only an allow-listed child environment to Prisma. A non-local host,
  password, unexpected port, database, or user is rejected.
- Do not expose Docker PostgreSQL to the LAN. The mobile app reaches the local
  Next API; it never reaches PostgreSQL directly.

## Disposable target

The canonical non-secret URL is:

```text
postgresql://jaothui_e2e@127.0.0.1:55432/jaothui_local_e2e?schema=public
```

## Run sequence

From `projects/jaothui-frontend`, use an explicit shell variable for every
command. Do not export it globally and do not source an environment file.

```sh
E2E_DB_URL='postgresql://jaothui_e2e@127.0.0.1:55432/jaothui_local_e2e?schema=public'

docker compose -f e2e/account-deletion-local/compose.yaml up -d
JAOTHUI_E2E_DATABASE_URL="$E2E_DB_URL" bun run e2e:local:preflight
JAOTHUI_E2E_DATABASE_URL="$E2E_DB_URL" bun run e2e:local:migrate
JAOTHUI_E2E_DATABASE_URL="$E2E_DB_URL" bun run e2e:local:seed
```

`e2e:local:migrate` is intentionally the only migration runner in this lane and
invokes `prisma migrate deploy`. `e2e:local:seed` creates and verifies one
synthetic `ACTIVE` Account with one LINE identity and one Bitkub NEXT wallet
link. It prints labels and row counts only; it never prints a connection URL,
token, e-mail address, or provider subject.

## Isolated local API

The device-facing API is deliberately started from an operating-system temporary
copy of this repository. The copy excludes every `.env*` file, `.next`, `.git`,
and `node_modules`; it uses a symlink to the reviewed dependency tree and only
an allow-listed environment. This prevents Next from discovering the project's
remote `.env` or `.env.local` files.

Run the normal hard gates before starting the API, then launch it in a separate
terminal. The API binds to `0.0.0.0:3100` so an operator device on the same LAN
can reach it; PostgreSQL remains loopback-only.

```sh
E2E_DB_URL='postgresql://jaothui_e2e@127.0.0.1:55432/jaothui_local_e2e?schema=public'
JAOTHUI_E2E_DATABASE_URL="$E2E_DB_URL" bun run e2e:local:api
```

The launcher generates an ephemeral session-signing secret in memory. It does
not print the secret, database URL, or API URL. Its redacted runtime log and
non-secret PID/host/port record live under `e2e/account-deletion-local/runtime/`
and are ignored by Git. Stop only the PID recorded there when the E2E lane is
finished; do not stop unrelated processes.

## Reset only after evidence is preserved

This is the only permitted cleanup target. Verify the exact compose project,
container, and volume names before running it:

```sh
docker compose -f e2e/account-deletion-local/compose.yaml down --volumes
```

Do not use broad Docker cleanup commands. Stop here and ask the operator before
any real-device sign-in, public provider callback, remote environment, or
release action.
