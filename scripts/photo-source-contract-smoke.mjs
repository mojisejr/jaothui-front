import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PHOTO_ORIGIN, PHOTO_PUBLIC_PREFIX, normalizePublishedPhotoUrl, resolvePublishedPhoto, parsePhotoTokenIds, resolvePhotoGroups } from "../server/photos/source-contract.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const fixtures = JSON.parse(read("scripts/fixtures/photo-publication.json"));
const base = `${PHOTO_ORIGIN}${PHOTO_PUBLIC_PREFIX}`;
let passed = 0;
const check = (name, run) => { run(); passed++; console.log(`PASS ${name}`); };
const legacy = fixtures.legacy;

check("extensionless historical URL gains exactly one jpg before query", () => {
  assert.equal(normalizePublishedPhotoUrl(`${base}buffalo/71?v=old`).url.href, `${base}buffalo/71.jpg?v=old`);
});
for (const suffix of ["jpg", "JPG", "jpeg", "png", "webp"]) check(`existing ${suffix} suffix preserved`, () => {
  assert.equal(normalizePublishedPhotoUrl(`${base}buffalo/legacy.${suffix}`).url.href, `${base}buffalo/legacy.${suffix}`);
});
check("safe nonstandard public buffalo path is preserved", () => {
  assert.equal(normalizePublishedPhotoUrl(`${base}buffalo/archive/portrait%20one.png`).url.href, `${base}buffalo/archive/portrait%20one.png`);
});
check("encoded safe spelling canonicalizes and allowed query order is stable", () => {
  assert.equal(normalizePublishedPhotoUrl(`${base}buffalo/%37%31.jpg?v=one&version=two`).url.href, `${base}buffalo/71.jpg?v=one&version=two`);
});
check("immutable create pointer unchanged and raw marker does not churn it", () => {
  const a = resolvePublishedPhoto(fixtures.created);
  assert.equal(a.imageUrl, fixtures.created.image);
  assert.equal(a.kind, "immutable-pointer");
  assert.deepEqual(a, resolvePublishedPhoto({ ...fixtures.created, updatedAt: "other-publication" }));
});
check("completed current-writer edit changes public pointer/key", () => {
  assert.notEqual(resolvePublishedPhoto(fixtures.created).sourceKey, resolvePublishedPhoto(fixtures.completed).sourceKey);
  assert.equal(resolvePublishedPhoto(fixtures.completed).imageUrl, fixtures.completed.image);
});
check("pending draft cannot change a reader fed the unchanged public row", () => {
  const before = resolvePublishedPhoto(fixtures.created);
  const state = { publicRow: fixtures.created, draft: fixtures.pending };
  assert.deepEqual(resolvePublishedPhoto(state.publicRow), before);
  assert.notEqual(before.imageUrl, state.draft.draftImageNotPublicInput);
  // Fixture projection proof, NOT invocation of the writer or hosted canary proof.
});
check("legacy bootstrap is stable; raw seconds/ms markers not reformatted", () => {
  const a = resolvePublishedPhoto(legacy);
  assert.deepEqual(a, resolvePublishedPhoto({ ...legacy }));
  assert.equal(a.kind, "legacy-bootstrap");
  assert.match(a.imageUrl, /71\.jpg\?cacheNonce=jaothui-photo-v1-[a-f0-9]{64}$/);
  assert.notEqual(a.sourceKey, resolvePublishedPhoto({ ...legacy, updatedAt: "1720000000000" }).sourceKey);
});
check("null/foreign pointer safely falls back to own alias", () => {
  for (const image of [null, "https://evil.test/a.jpg"]) {
    const result = resolvePublishedPhoto({ ...legacy, image });
    assert.equal(result.status, "fallback");
    assert.match(result.imageUrl, /\/buffalo\/71\.jpg\?/);
  }
});
check("numeric alias of another identity never displayed as requested buffalo", () => {
  for (const path of ["72.jpg", "72.JPG", "%37%32.jpg"]) assert.equal(resolvePublishedPhoto({ ...legacy, image: `${base}buffalo/${path}` }).status, "fallback");
});
check("legacy approved query survives; old cacheNonce bootstraps deterministically", () => {
  const a = resolvePublishedPhoto({ ...legacy, image: `${base}buffalo/71.jpg?v=old&cacheNonce=previous` });
  const b = resolvePublishedPhoto({ ...legacy, image: `${base}buffalo/71.jpg?v=old&cacheNonce=another` });
  assert.deepEqual(a, b);
  assert.equal(new URL(a.imageUrl).searchParams.get("v"), "old");
  assert.deepEqual(resolvePublishedPhoto({ ...legacy, image: a.imageUrl }), a, "already emitted legacy URL is idempotent");
});
check("malformed runtime image types fail closed", () => {
  for (const value of [1, {}, [], undefined]) assert.equal(normalizePublishedPhotoUrl(value), null);
});
for (const [name, url] of Object.entries({
  doubled: `${base}buffalo/71.jpg.jpg`, private: `${PHOTO_ORIGIN}/storage/v1/object/sign/slipstorage/buffalo/71.jpg?token=secret`,
  wrongBucket: `${PHOTO_ORIGIN}/storage/v1/object/public/private/buffalo/71.jpg`, root: `${base}avatar/71.jpg`,
  script: "javascript:alert(1)", data: "data:image/png;base64,a", http: `${base.replace("https:", "http:")}buffalo/71.jpg`,
  user: `${base.replace("https://", "https://user:pass@")}buffalo/71.jpg`, port: `${base.replace(".co/", ".co:443/")}buffalo/71.jpg`,
  sibling: `${base.replace(".co/", ".co.evil.test/")}buffalo/71.jpg`, fragment: `${base}buffalo/71.jpg#x`,
  traversal: `${base}buffalo/../avatar/a.jpg`, encodedTraversal: `${base}buffalo/%2e%2e/a.jpg`,
  separator: `${base}buffalo/foo%2fbar.jpg`, backslash: `${base}buffalo/foo%5cbar.jpg`, doubleEncoded: `${base}buffalo/%252e%252e/a.jpg`,
  control: `${base}buffalo/a%00.jpg`, badEncoding: `${base}buffalo/%zz.jpg`, unknownQuery: `${base}buffalo/a.jpg?token=secret`,
  duplicateQuery: `${base}buffalo/a.jpg?v=a&v=b`, activeExtension: `${base}buffalo/a.svg`, newline: `${base}buffalo/a\n.jpg`,
})) check(`reject unsafe ${name}`, () => assert.equal(normalizePublishedPhotoUrl(url), null));

check("large decimal identity losslessly survives request/group/response", () => {
  const id = fixtures.created.tokenId;
  assert.deepEqual(parsePhotoTokenIds([id, "71", id]), ["71", id]);
  assert.equal(resolvePhotoGroups([id], [{ tokenId: id, rowCount: 1, row: fixtures.created }])[0].tokenId, id);
});
check("invalid/overflow/numeric/leading-zero identities fail closed", () => {
  for (const id of [0, 71, "0", "01", "1.0", "1e3", "-1", "9223372036854775808", "9".repeat(100)]) assert.throws(() => parsePhotoTokenIds([id]));
  assert.throws(() => parsePhotoTokenIds([]));
  assert.throws(() => parsePhotoTokenIds(Array(41).fill("71")));
});
check("duplicate token rows, duplicate groups and mismatched rows are unavailable", () => {
  const group = { tokenId: "71", rowCount: 1, row: legacy };
  assert.equal(resolvePhotoGroups(["71"], [{ ...group, rowCount: 2 }])[0].reason, "ambiguous");
  assert.equal(resolvePhotoGroups(["71"], [group, group])[0].reason, "ambiguous");
  assert.equal(resolvePhotoGroups(["71"], [{ ...group, row: fixtures.created }])[0].reason, "invalid-row");
  assert.equal(resolvePhotoGroups(["71"], [])[0].reason, "missing");
  assert.throws(() => resolvePhotoGroups(["71"], Array(41).fill(group)));
  assert.throws(() => resolvePhotoGroups(["71"], [{ ...group, tokenId: "72" }]));
});
check("baseline reader defect remains visible: current batch/search/member double jpg", () => {
  const metadata = read("server/services/metadata.service.ts"), member = read("server/services/kwaithai.service.ts");
  assert(metadata.includes('image: `${d.image}.jpg`'));
  assert(member.includes('image: `${m.image!}.jpg`'));
  // Execute the actual baseline expression, not a claim that integration is fixed.
  const expression = metadata.match(/image: (`\$\{d\.image\}\.jpg`)/)[1];
  const old = new Function("d", `return ${expression}`)(fixtures.created);
  assert.match(old, /source\.jpg\.jpg$/);
  assert.notEqual(old, resolvePublishedPhoto(fixtures.created).imageUrl);
});
check("baseline list/detail ignore committed immutable pointer", () => {
  assert(read("server/services/metadata.service.ts").includes('getImageUrl(`${m.tokenId.toString()}.jpg`)'));
  assert(read("server/services/metadata.service.ts").includes('getImageUrl(`${pedigree.tokenId.toString()}.jpg`)'));
  assert.notEqual(`${base}buffalo/${fixtures.created.tokenId}.jpg`, fixtures.created.image);
});
check("contract remains unwired and cannot read ledger, network or clock", () => {
  const module = read("server/photos/source-contract.ts");
  assert.doesNotMatch(module, /Date\.now|Math\.random|fetch\(|prisma|supabase-js/);
  for (const file of ["server/services/metadata.service.ts", "server/services/kwaithai.service.ts"]) assert(!read(file).includes("source-contract"));
});
console.log(`PHOTO_SOURCE_CONTRACT_OK ${passed} cases; known reader defects characterized, NOT fixed or deployed`);
