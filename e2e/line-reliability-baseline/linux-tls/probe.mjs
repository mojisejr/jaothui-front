import assert from "node:assert/strict";
import { X509Certificate } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaClient, Prisma } from "@prisma/client";

assert.equal(process.platform, "linux", "Linux-only proof lane");
assert.equal(Prisma.prismaVersion.client, "5.14.0");
const fingerprint = "80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA";
assert.equal(new X509Certificate(await readFile("/certs/supabase-prod-ca-2021.crt")).fingerprint256, fingerprint);
const url = new URL(process.env.CANDIDATE_DATABASE_URL);
assert.ok(url.protocol === "postgresql:" && url.hostname === "aws-0-ap-southeast-1.pooler.supabase.com" && url.port === "6543", "Unexpected candidate endpoint; never print URL");
url.search = "pgbouncer=true&connection_limit=1&connect_timeout=5&pool_timeout=10&sslmode=require&sslaccept=strict";
// Prisma5's Rust connector uses sslcert (sslrootcert is silently ignored).
url.searchParams.set("sslcert", "/certs/supabase-prod-ca-2021.crt");
const db = new PrismaClient({ datasources: { db: { url: url.toString() } }, log: [] });
try {
  const result = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    await tx.$executeRaw`SET LOCAL statement_timeout = 5000`;
    return (await tx.$queryRaw`SELECT current_setting('transaction_read_only') AS read_only, (SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()) AS tls, 1 AS ready`)[0];
  }, { maxWait: 5000, timeout: 7000 });
  assert.ok(result.read_only === "on" && result.ready === 1, "Read-only query proof failed");
  // pg_stat_ssl sees the Postgres<->pooler leg, not this client<->pooler TLS
  // leg. Do not confuse a plaintext internal leg with a client TLS failure.
  // sslmode=require + strict + the wrong-CA negative control prove this leg.
  console.log(JSON.stringify({ lane: "LINUX-PRISMA5-SUPAVISOR-STRICT-TLS", pass: true, node: process.version, arch: process.arch, prisma: Prisma.prismaVersion.client, engine: Prisma.prismaVersion.engine, readOnly: true, clientTlsRequired: true, strictCertificateVerification: true, postgresPoolerLegTls: result.tls ?? null, writes: 0, productionConfigChanged: false }));
} catch (error) {
  const code = error.code ?? error.errorCode;
  const text = String(error.message ?? "");
  const reasonHints = ["TLS", "certificate", "engine", "libssl", "timeout", "read-only", "permission denied"].filter((part) => text.toLowerCase().includes(part.toLowerCase()));
  console.log(JSON.stringify({ lane: "LINUX-PRISMA5-SUPAVISOR-STRICT-TLS", pass: false, code: /^P\d{4}$/.test(code ?? "") ? code : "withheld", reasonHints, details: "withheld" }));
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
if (!process.exitCode) {
  url.searchParams.set("sslcert", "/tmp/line-tls/wrong-ca.crt");
  const negative = new PrismaClient({ datasources: { db: { url: url.toString() } }, log: [] });
  let rejected = false;
  try { await negative.$connect(); }
  catch (error) { rejected = (error.errorCode ?? error.code) === "P1011"; }
  finally { await negative.$disconnect(); }
  assert.ok(rejected, "Wrong CA must be rejected; no silent TLS downgrade");
  console.log("PASS: unrelated CA rejected withP1011; certificate checking remains enabled.");
}
