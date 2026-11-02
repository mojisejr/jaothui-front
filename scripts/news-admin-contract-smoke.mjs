import assert from "node:assert/strict";

process.env.JAOTHUI_NEWS_ADMIN_API_KEY = "local-news-admin-secret";
delete process.env.SANITY_WRITE_TOKEN;

const auth = await import("../server/admin/news-event-admin-auth.ts");
const contract = await import("../server/admin/news-event-admin-contract.ts");
const listRoute = await import("../pages/api/admin/news-events/index.ts");
const publishRoute = await import("../pages/api/admin/news-events/[id]/publish.ts");

assert.equal(
  auth.isAuthorizedNewsAdminRequest({ headers: {} }),
  false,
  "missing Authorization header must be rejected"
);
assert.equal(
  auth.isAuthorizedNewsAdminRequest({
    headers: { authorization: "Bearer wrong-secret" },
  }),
  false,
  "invalid bearer token must be rejected"
);
assert.equal(
  auth.isAuthorizedNewsAdminRequest({
    headers: { authorization: "Bearer local-news-admin-secret" },
  }),
  true,
  "valid bearer token must be accepted"
);

const envStatus = auth.getNewsAdminEnvStatus();
assert.equal(envStatus.adminApiKeyConfigured, true);
assert.equal(envStatus.serverOnlySanityTokenConfigured, false);
assert.deepEqual(envStatus.missing, []);

const parsedDraft = contract.newsEventAdminUpsertInputSchema.parse({
  title: "ทดสอบข่าว",
  slug: "test-news",
  excerpt: "เนื้อหาสั้นสำหรับทดสอบ",
});
assert.equal(parsedDraft.type, "news");
assert.equal(parsedDraft.status, "draft");
assert.equal(parsedDraft.priority, 100);

assert.deepEqual(
  contract.getNewsEventPublishMissingFields({
    title: "Title",
    slug: "slug",
    excerpt: "Excerpt",
    publishedAt: null,
  }),
  ["publishedAt"]
);

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

const listRes = createMockResponse();
await listRoute.default({ method: "GET", headers: {}, query: {} }, listRes);
assert.equal(listRes.statusCode, 401);
assert.deepEqual(listRes.body, { error: "UNAUTHORIZED" });

const publishRes = createMockResponse();
await publishRoute.default(
  { method: "POST", headers: { authorization: "Bearer wrong-secret" }, query: { id: "drafts.test" } },
  publishRes
);
assert.equal(publishRes.statusCode, 401);
assert.deepEqual(publishRes.body, { error: "UNAUTHORIZED" });

console.log("news admin contract smoke passed");
