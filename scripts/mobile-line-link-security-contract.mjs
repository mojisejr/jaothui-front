import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { requireLocalE2eDatabaseUrl } from "./local-e2e-contract.mjs";

// Fail closed before invoking psql. Never reads .env or accepts a remote target.
requireLocalE2eDatabaseUrl();
const schema = `mobile_link_security_${randomBytes(8).toString("hex")}`;
const source = readFileSync(new URL("../prisma/migrations/20261028050000_mobile_line_link_intent/migration.sql", import.meta.url), "utf8");
assert.match(source, /^BEGIN;$/m);
assert.match(source, /^COMMIT;\s*$/m);
// Keep the exact DDL inside one outer transaction so all test objects/roles roll back.
const migration = source.replace(/^BEGIN;\s*$/m, "").replace(/^COMMIT;\s*$/m, "");
const sql = `
BEGIN;
SET LOCAL statement_timeout = '10s';
CREATE SCHEMA ${schema};
SET LOCAL search_path = ${schema};
DO $$ DECLARE role_name text; BEGIN
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
   EXECUTE format('CREATE ROLE %I NOLOGIN NOSUPERUSER NOBYPASSRLS', role_name);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name AND (rolsuper OR rolbypassrls)) THEN
   RAISE EXCEPTION 'Client-role fixture must not bypass RLS';
  END IF;
 END LOOP;
END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT ALL ON TABLES TO PUBLIC, anon, authenticated;
CREATE TABLE "Account" ("id" text PRIMARY KEY);
INSERT INTO "Account" VALUES ('synthetic-security-account');
${migration}
INSERT INTO "MobileLineLinkIntent" ("id","accountId","purpose","returnIntent","stateNonceHash","expiresAt","verifiedProfile")
 VALUES ('synthetic-intent','synthetic-security-account','attach-line','{}','synthetic-hash',now() + interval '10 minutes','{"synthetic":true}');
DO $$ DECLARE role_name text; privilege_name text; BEGIN
 IF NOT (SELECT relrowsecurity AND NOT relforcerowsecurity FROM pg_class WHERE oid = '"MobileLineLinkIntent"'::regclass) THEN
  RAISE EXCEPTION 'Migration must enable ordinary RLS';
 END IF;
 IF EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = '"MobileLineLinkIntent"'::regclass) THEN
  RAISE EXCEPTION 'Server-only table must have no client policies';
 END IF;
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  FOREACH privilege_name IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
   IF has_table_privilege(role_name, '"MobileLineLinkIntent"', privilege_name) THEN
    RAISE EXCEPTION 'Client privilege survived migration';
   END IF;
  END LOOP;
 END LOOP;
 IF (SELECT count(*) FROM "MobileLineLinkIntent") <> 1 THEN
  RAISE EXCEPTION 'BFF owner must retain row access';
 END IF;
END $$;
-- Even if a future grant is accidentally added, no-policy RLS denies row access.
GRANT USAGE ON SCHEMA ${schema} TO anon;
GRANT SELECT, INSERT ON "MobileLineLinkIntent" TO anon;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF (SELECT count(*) FROM "MobileLineLinkIntent") <> 0 THEN
  RAISE EXCEPTION 'RLS exposed a temporary OAuth profile';
 END IF;
 BEGIN
  INSERT INTO "MobileLineLinkIntent" ("id","accountId","purpose","returnIntent","stateNonceHash","expiresAt")
   VALUES ('client-denied','synthetic-security-account','attach-line','{}','synthetic-hash',now());
  RAISE EXCEPTION 'RLS accepted a client insert';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'MOBILE_LINK_SECURITY_PASS';
`;
const result = spawnSync("/opt/homebrew/bin/psql", [
  "-X", "--no-password", "--no-psqlrc", "--tuples-only", "--no-align",
  "--host", "127.0.0.1", "--port", "55432", "--username", "jaothui_e2e",
  "--dbname", "jaothui_local_e2e", "--set", "ON_ERROR_STOP=1",
], {
  input: sql, encoding: "utf8", timeout: 30_000,
  env: { PATH: "/opt/homebrew/bin:/usr/bin:/bin", LANG: "C", PGCONNECT_TIMEOUT: "3", PGPASSFILE: "/dev/null" },
});
assert.equal(result.status, 0, "Pinned local migration security rehearsal failed");
assert.ok(result.stdout.split("\n").includes("MOBILE_LINK_SECURITY_PASS"));
console.log("Mobile LINE link security PASS: atomic migration, revoked automatic client grants, no-policy RLS denial, owner access; all test objects/roles rolled back");
