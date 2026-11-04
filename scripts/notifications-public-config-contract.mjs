import assert from "node:assert/strict";
import { mock } from "bun:test";
mock.module("../server/notifications/http.ts", () => ({ pushHeaders: res => { res.setHeader("Cache-Control", "no-store"); res.setHeader("Referrer-Policy", "no-referrer"); } }));
const handler = (await import("../pages/api/notifications/config.ts")).default;
Object.assign(process.env, { JAOTHUI_FRONT_ORIGIN: "https://www.jaothui.com", JAOTHUI_EVENT_ORIGIN: "https://event.example", JAOTHUI_PUSH_REGISTRATION_ENABLED: "true", JAOTHUI_WEB_PUSH_VAPID_PUBLIC_KEY: "synthetic-public-key", JAOTHUI_WEB_PUSH_VAPID_PRIVATE_KEY: "PRIVATE-DO-NOT-EXPOSE", JAOTHUI_PUSH_PILOT_ACCOUNT_IDS: "PRIVATE-ACCOUNT-LIST" });
const run = (origin, method = "GET") => {
  const res = { headers: {}, statusCode: 200, setHeader(key, value) { this.headers[key] = value; }, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
  handler({ method, headers: origin === undefined ? {} : { origin } }, res);
  return res;
};
const allowed = run("https://event.example");
assert.equal(allowed.statusCode, 200);
assert.equal(allowed.headers["Access-Control-Allow-Origin"], "https://event.example");
assert.equal(allowed.headers.Vary, "Origin");
assert.equal(allowed.headers["Access-Control-Allow-Methods"], "GET");
assert(!("Access-Control-Allow-Credentials" in allowed.headers));
assert.deepEqual(Object.keys(allowed.body.data).sort(), ["available", "expoProjectId", "vapidPublicKey"]);
assert(!JSON.stringify(allowed.body).includes("PRIVATE-"));
for (const origin of ["https://evil.example", "https://event.example.evil.example", "null", "https://event.example/path", ["https://event.example", "https://evil.example"]]) {
  const denied = run(origin); assert.equal(denied.statusCode, 403); assert(!("Access-Control-Allow-Origin" in denied.headers)); assert(!("data" in denied.body));
}
for (const method of ["POST", "PUT", "DELETE", "OPTIONS"]) {
  const denied = run("https://event.example", method); assert.equal(denied.statusCode, 405); assert(!("Access-Control-Allow-Origin" in denied.headers));
}
assert.equal(run().statusCode, 200); assert.equal(run("https://www.jaothui.com").statusCode, 200);
process.env.JAOTHUI_EVENT_ORIGIN = "https://event.example/path";
assert.equal(run("https://event.example/path").statusCode, 403);
process.env.JAOTHUI_EVENT_ORIGIN = "https://event.example";
process.env.JAOTHUI_PUSH_REGISTRATION_ENABLED = "false";
assert.equal(run("https://event.example").body.data.available, false);
console.log("PASS public notification config exact Event-origin GET CORS, no credentials/wildcard/private fields, and feature-off state");
