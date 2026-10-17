import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

// A distinct lane: never consumes DATABASE_URL, DIRECT_URL, or default PG env.
const target = {
  host: "127.0.0.1", port: "55433", database: "jaothui_line_reliability_e2e",
  user: "jaothui_line_e2e",
};
const example = `postgresql://${target.user}@${target.host}:${target.port}/${target.database}`;
function validate(raw) {
  assert.ok(raw, "Set JAOTHUI_LINE_E2E_DATABASE_URL explicitly; no fallback is allowed");
  let url;
  try { url = new URL(raw); } catch { throw new Error("Invalid isolated target URL"); }
  // Boolean assertions keep rejected input (including credentials) out of errors.
  assert.ok(url.protocol === "postgresql:", "Only the pinned local PostgreSQL lane is allowed");
  assert.ok(url.hostname === target.host, "Remote/non-pinned hosts are forbidden");
  assert.ok(url.port === target.port, "Unexpected local port");
  assert.ok(url.username === target.user, "Unexpected test role");
  assert.ok(url.pathname === `/${target.database}`, "Unexpected test database");
  assert.ok(url.password === "", "No credentials are permitted in this disposable lane");
  assert.ok(url.search === "", "Query overrides are forbidden");
  assert.ok(url.hash === "", "URL fragments are forbidden");
}

const args = process.argv.slice(2);
assert.equal(args.length, 1, "Use --self-test or --probe");
if (args[0] === "--self-test") {
  validate(example);
  const rejected = [undefined, "invalid", example.replace("127.0.0.1", "db.example.com"),
    example.replace("55433", "5432"), example.replace(target.user, "postgres"),
    example.replace(target.database, "production"), example.replace("@", ":secret@"),
    `${example}?schema=public`, `${example}#override`, example.replace("postgresql:", "postgres:")];
  for (const raw of rejected) assert.throws(() => validate(raw));
  console.log(`Isolated target guard PASS: 1 allowed, ${rejected.length} denied; no database connection attempted.`);
} else if (args[0] === "--probe") {
  validate(process.env.JAOTHUI_LINE_E2E_DATABASE_URL);
  // A clean child environment prevents PGHOST/PGSERVICE/PGOPTIONS or passwords
  // inherited from a developer shell from redirecting or altering this probe.
  const result = spawnSync("/opt/homebrew/bin/psql", [
    "-X", "--no-password", "--no-psqlrc", "--tuples-only", "--no-align",
    "--host", target.host, "--port", target.port, "--username", target.user,
    "--dbname", target.database, "--set", "ON_ERROR_STOP=1",
    "--command", "BEGIN READ ONLY",
    "--command", "SELECT current_database(), current_user, inet_server_addr(), inet_server_port(), 1 AS ready",
    "--command", "COMMIT",
  ], {
    env: { PATH: "/opt/homebrew/bin:/usr/bin:/bin", LANG: "C", PGCONNECT_TIMEOUT: "3", PGPASSFILE: "/dev/null" },
    encoding: "utf8", timeout: 10_000,
  });
  // Do not echo raw errors/config on failure.
  assert.equal(result.status, 0, "Pinned local read-only database probe failed; inspect the local cluster separately");
  assert.ok(result.stdout.split("\n").includes(`${target.database}|${target.user}|${target.host}|${target.port}|1`), "Unexpected database identity");
  console.log(JSON.stringify({ state: "LOCAL-READY", ...target, writes: 0, productionProof: false }));
} else {
  throw new Error("Use --self-test or --probe");
}
