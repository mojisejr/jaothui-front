import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

// This destructive-test boundary is deliberately independent of DATABASE_URL.
// All fixture changes roll back. Never run this against a live database/tunnel.
const value = process.env.BUFFALO_INTEGRITY_TEST_DATABASE_URL;
if (!value) throw new Error("BUFFALO_INTEGRITY_TEST_DATABASE_URL required");
const target = new URL(value);
assert(["127.0.0.1", "[::1]"].includes(target.hostname), "loopback required");
assert.equal(target.pathname, "/jaothui_integrity_p2", "disposable DB required");
const db = new PrismaClient({ datasources: { db: { url: value } } });
const marker = "oracle-disposable:jaothui-buffalo-write-integrity:2026-10-17:phase2";
const results = [];
const rollback = new Error("ROLLBACK_TEST_FIXTURES");

try {
  const identity = await db.$queryRaw`
    SELECT current_database() AS database, version() AS version,
      shobj_description(oid, 'pg_database') AS marker
    FROM pg_database WHERE datname=current_database()`;
  assert.equal(identity[0]?.marker, marker, "disposable marker required");
  assert.match(identity[0].version, /PostgreSQL 15\.1 /);
  const tables = await db.$queryRaw`
    SELECT c.relname, c.relrowsecurity
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='buffalo_integrity' AND c.relkind='r' ORDER BY c.relname`;
  assert.deepEqual(tables.map((row) => row.relname),
    ["event", "operation", "reservation", "step", "wallet_lease"]);
  assert(tables.every((row) => row.relrowsecurity), "RLS on every ledger table");
  results.push("private tables and RLS");
  const functions = await db.$queryRaw`
    SELECT p.oid::int AS id, p.proname, p.prosecdef
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='buffalo_integrity' ORDER BY p.proname`;
  assert(functions.length > 0 && functions.every((row) => !row.prosecdef),
    "no security-definer functions");

  for (const role of ["anon", "authenticated"]) {
    const schema = await db.$queryRaw`
      SELECT has_schema_privilege(${role}, 'buffalo_integrity', 'USAGE') AS allowed`;
    assert.equal(schema[0]?.allowed, false, `${role}: schema private`);
    for (const table of tables) {
      for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
        const grants = await db.$queryRaw`
          SELECT has_table_privilege(${role}, ${"buffalo_integrity." + table.relname}, ${privilege}) AS allowed`;
        assert.equal(grants[0]?.allowed, false, `${role}:${table.relname}:${privilege}`);
      }
    }
    for (const fn of functions) {
      const access = await db.$queryRaw`
        SELECT has_function_privilege(${role}, ${fn.id}::oid, 'EXECUTE') AS allowed`;
      assert.equal(access[0]?.allowed, false, `${role}:${fn.proname}:EXECUTE`);
    }
    results.push(`${role}: schema and all table grants denied`);
  }

  try {
    await db.$transaction(async (tx) => {
      const operationId = randomUUID();
      const stepId = randomUUID();
      const hash = randomUUID();
      await tx.$executeRaw`
        INSERT INTO buffalo_integrity.operation
          (id,owner,idempotency_key,intent_hash,intent,domain)
        VALUES (${operationId}::uuid,'migration-test',${hash},${hash},'{}'::jsonb,'{}'::jsonb)`;
      await tx.$executeRaw`
        INSERT INTO buffalo_integrity.step
          (id,operation_id,ordinal,kind,expected,chain_id,sender)
        VALUES (${stepId}::uuid,${operationId}::uuid,0,'setter','{}'::jsonb,31337,${hash})`;
      // Synthetic SQL fixtures only: these bytes are never sent to an EVM.
      await tx.$executeRaw`
        UPDATE buffalo_integrity.step SET nonce=1,calldata_hash='fixture',
          transaction_hash=${hash},signed_bytes='0xdead',transaction_envelope='{}'::jsonb
        WHERE id=${stepId}::uuid`;
      await tx.$executeRaw`
        INSERT INTO buffalo_integrity.event(operation_id,step_id,kind)
        VALUES (${operationId}::uuid,${stepId}::uuid,'MIGRATION_FIXTURE')`;

      async function denied(label, expected, callback) {
        await tx.$executeRawUnsafe("SAVEPOINT ledger_guard_check");
        let failure;
        try { await callback(); } catch (error) { failure = error; }
        await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT ledger_guard_check");
        await tx.$executeRawUnsafe("RELEASE SAVEPOINT ledger_guard_check");
        assert(failure, label);
        assert.match(String(failure.meta?.message ?? failure.message), expected, label);
        results.push(label);
      }

      await denied("operation intent immutable", /immutable operation intent/, () => tx.$executeRaw`
        UPDATE buffalo_integrity.operation SET intent='{"changed":true}'::jsonb WHERE id=${operationId}::uuid`);
      await tx.$executeRaw`
        UPDATE buffalo_integrity.operation SET plan='{"approved":true}'::jsonb WHERE id=${operationId}::uuid`;
      await denied("approved plan immutable", /immutable approved plan/, () => tx.$executeRaw`
        UPDATE buffalo_integrity.operation SET plan='{}'::jsonb WHERE id=${operationId}::uuid`);
      await denied("signed bytes immutable", /immutable signed step/, () => tx.$executeRaw`
        UPDATE buffalo_integrity.step SET signed_bytes='0xbeef' WHERE id=${stepId}::uuid`);
      await denied("signed nonce immutable", /immutable signed step/, () => tx.$executeRaw`
        UPDATE buffalo_integrity.step SET nonce=2 WHERE id=${stepId}::uuid`);
      await denied("step history cannot be deleted", /durable operation journal cannot be deleted/, () => tx.$executeRaw`
        DELETE FROM buffalo_integrity.step WHERE id=${stepId}::uuid`);
      await denied("operation history cannot be deleted", /durable operation journal cannot be deleted/, () => tx.$executeRaw`
        DELETE FROM buffalo_integrity.operation WHERE id=${operationId}::uuid`);
      await denied("events append only", /append-only operation event/, () => tx.$executeRaw`
        UPDATE buffalo_integrity.event SET kind='CHANGED' WHERE operation_id=${operationId}::uuid`);

      for (const role of ["anon", "authenticated"]) {
        await denied(`${role}: actual SELECT denied`, /permission denied/, async () => {
          // Both strings come from this fixed list, not user input.
          await tx.$executeRawUnsafe(`SET LOCAL ROLE ${role}`);
          await tx.$queryRaw`SELECT id FROM buffalo_integrity.operation LIMIT 1`;
        });
      }
      throw rollback;
    }, { timeout: 15000 });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  const remaining = await db.$queryRaw`
    SELECT count(*)::int AS count FROM buffalo_integrity.operation WHERE owner='migration-test'`;
  assert.equal(remaining[0]?.count, 0, "test fixture rollback");
  console.log(JSON.stringify({ status: "passed", postgres: "15.1", disposableOnly: true,
    fixtureRollback: true, productionMutations: 0, checks: results }, null, 2));
} finally {
  await db.$disconnect();
}
