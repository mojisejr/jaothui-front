import assert from "node:assert/strict";
import { mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

const sentinel = "DO-NOT-LOG-secret-cookie-profile-state-code-verifier";
const hostileUrl = `https://private.invalid/path?code=${sentinel}&state=${sentinel}`;
let dbCalls = 0;
mock.module("../server/prisma.ts", () => ({ prisma: new Proxy({}, { get(_target, key) {
  return async () => { dbCalls++; throw Object.assign(new Error(hostileUrl), { code: "P1001", sessionToken: sentinel }); };
} }) }));
const sso = await import("../server/auth/event-sso.ts");
const { recordEventSsoFailure } = await import("../server/auth/event-sso-diagnostics.ts");
const entry = await import("../pages/v2/event-entry.tsx");
const authorize = (await import("../pages/api/auth/event-sso/authorize.ts")).default;
const { eventSsoHandler } = await import("../server/auth/event-sso-http.ts");
const config = { NODE_ENV: "test", JAOTHUI_EVENT_SSO_ENABLED: "true", JAOTHUI_LINE_LOGIN_CHANNEL_ID: "2003013735", JAOTHUI_FRONT_ORIGIN: "http://127.0.0.1:3100", JAOTHUI_EVENT_ORIGIN: "http://127.0.0.1:3200", JAOTHUI_EVENT_SSO_CLIENT_SECRET: "synthetic-dedicated-client-secret-0000", JAOTHUI_EVENT_SSO_STATE_SECRET: "synthetic-dedicated-state-secret-0000", private_procedure_secret: "synthetic-existing-auth-secret" };
Object.assign(process.env, config);
function response() { return { statusCode: 200, headers: {}, setHeader(k,v){this.headers[k.toLowerCase()]=v;return this;}, getHeader(k){return this.headers[k.toLowerCase()];}, status(n){this.statusCode=n;return this;}, json(body){this.body=body;return this;}, redirect(n,to){this.statusCode=n;this.location=to;return this;} }; }
function context(headers = {}) { return { req: { headers: { "x-request-id": `${hostileUrl}\n${sentinel}`, authorization: sentinel, cookie: sentinel, ...headers }, cookies: {}, url: hostileUrl, query: { code: sentinel, state: sentinel }, body: { sessionToken: sentinel, profile: sentinel } }, res: response() }; }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const logs = []; const saved = { info: console.info, warn: console.warn }; let count = 0;
async function check(name, run) { const before = logs.length; await run(); for (const [label, receipt] of logs.slice(before)) {
  assert.equal(label, "JAOTHUI Event SSO"); assert.match(receipt.requestId, uuid);
  assert.ok(Object.keys(receipt).every(k => ["requestId","flow","stage","outcome","code","status","category","missingVariables"].includes(k)));
  assert.ok(!JSON.stringify(receipt).includes(sentinel)); assert.ok(!JSON.stringify(receipt).includes("private.invalid"));
} count++; saved.info(`PASS ${name}`); }
console.info = (...args) => logs.push(args); console.warn = (...args) => logs.push(args);
try {
await check("hostile error/request/URL cannot enter fixed diagnostic fields", async () => {
 const ctx=context(); const error=Object.assign(new Error(hostileUrl), { code: sentinel, profile: { lineId: sentinel }, headers: { authorization: sentinel } });
 const {failure,requestId}=recordEventSsoFailure(ctx,hostileUrl,error);const receipt=logs.at(-1)[1];assert.equal(failure.status,503);assert.equal(failure.code,"SSO_UNAVAILABLE");assert.equal(receipt.stage,"handoff");assert.equal(receipt.category,"unexpected");assert.equal(ctx.res.getHeader("X-Request-Id"),requestId);
 const forged=new sso.EventSsoError(599,hostileUrl,[sentinel,"JAOTHUI_FRONT_ORIGIN"]);recordEventSsoFailure(ctx,"authorize",forged);assert.equal(logs.at(-1)[1].code,"SSO_UNAVAILABLE");assert.ok(!logs.at(-1)[1].missingVariables);
});
await check("missing configuration logs only bounded variable names, never values", async()=>{
 delete process.env.JAOTHUI_FRONT_ORIGIN;delete process.env.JAOTHUI_EVENT_SSO_CLIENT_SECRET;
 let failure;try{sso.ssoConfig();}catch(error){failure=error;}
 const ctx=context();recordEventSsoFailure(ctx,"entry_configuration",failure);const receipt=logs.at(-1)[1];assert.equal(receipt.code,"SSO_CONFIGURATION_UNAVAILABLE");assert.equal(receipt.status,503);assert.equal(receipt.category,"configuration");assert.deepEqual(receipt.missingVariables,["JAOTHUI_FRONT_ORIGIN","JAOTHUI_EVENT_SSO_CLIENT_SECRET"]);
 assert.ok(!JSON.stringify(logs).includes(config.JAOTHUI_EVENT_SSO_STATE_SECRET));Object.assign(process.env,config);
 recordEventSsoFailure(context(),"entry_configuration",new sso.EventSsoError(503,"SSO_CONFIGURATION_UNAVAILABLE",[sentinel,"JAOTHUI_EVENT_ORIGIN","JAOTHUI_EVENT_ORIGIN"]));assert.deepEqual(logs.at(-1)[1].missingVariables,["JAOTHUI_EVENT_ORIGIN"]);
});
await check("configuration failure entry preserves validated event intent and support reference", async()=>{
 delete process.env.JAOTHUI_EVENT_SSO_STATE_SECRET;const ctx=context();const state="a".repeat(43),challenge="b".repeat(43);const result=await entry.getServerSideProps({...ctx,query:{eventId:"event.0",state,code_challenge:challenge,returnTo:hostileUrl,code:sentinel}});
 assert.equal(ctx.res.statusCode,503);assert.match(result.props.supportReference,uuid);assert.equal(result.props.supportReference,ctx.res.getHeader("X-Request-Id"));const retry=new URL(result.props.retryTo,"https://front.invalid");assert.equal(retry.pathname,"/v2/event-entry");assert.equal(retry.searchParams.get("eventId"),"event.0");assert.equal(retry.searchParams.get("state"),state);assert.equal(retry.searchParams.get("code_challenge"),challenge);assert.equal(retry.searchParams.size,3);assert.ok(!result.props.loginTo);
 const html=renderToStaticMarkup(React.createElement(entry.default,result.props));assert.ok(html.includes(result.props.supportReference));assert.ok(html.includes("ผู้ดูแล"));assert.ok(!html.includes("JAOTHUI_EVENT_SSO_STATE_SECRET"));Object.assign(process.env,config);
});
await check("unsafe intent cannot produce recovery redirect even on config failure", async()=>{
 delete process.env.JAOTHUI_FRONT_ORIGIN;const result=await entry.getServerSideProps({...context(),query:{eventId:hostileUrl,state:sentinel,code_challenge:sentinel}});assert.ok(!result.props.retryTo);Object.assign(process.env,config);
});
await check("guest login resume remains401 classification, not configuration503 or logout", async()=>{
 const ctx=context();const result=await entry.getServerSideProps({...ctx,query:{eventId:"event.0"}});assert.equal(ctx.res.statusCode,200);assert.ok(result.props.loginTo);assert.equal(new URL(result.props.loginTo,"https://front.invalid").searchParams.get("returnTo"),"/v2/event-entry?eventId=event.0");const receipt=logs.at(-1)[1];assert.equal(receipt.code,"LOGIN_REQUIRED");assert.equal(receipt.status,401);assert.equal(receipt.category,"invalid_auth");assert.equal(receipt.outcome,"resume");assert.equal(receipt.stage,"entry_principal");assert.equal(ctx.res.getHeader("Set-Cookie"),undefined);
});
await check("authorize guest preserves PKCE/state flow and logs no query values", async()=>{
 const ctx=context();const state="c".repeat(43),challenge="d".repeat(43);await authorize({...ctx.req,method:"GET",query:{eventId:"event.0",state,code_challenge:challenge,code_challenge_method:"S256"}},ctx.res);assert.equal(ctx.res.statusCode,302);assert.equal(new URL(ctx.res.location,"https://front.invalid").searchParams.get("state"),state);assert.equal(logs.at(-1)[1].code,"LOGIN_REQUIRED");assert.ok(!JSON.stringify(logs).includes(state));assert.ok(!JSON.stringify(logs).includes(challenge));
});
await check("backchannels classify missingconfig503, invalidclient401 and outage503 safely", async()=>{
 delete process.env.JAOTHUI_EVENT_ORIGIN;let ctx=context();await eventSsoHandler("exchange")({...ctx.req,method:"POST"},ctx.res);assert.equal(ctx.res.statusCode,503);assert.equal(ctx.res.body.error.code,"SSO_CONFIGURATION_UNAVAILABLE");assert.equal(logs.at(-1)[1].stage,"exchange");Object.assign(process.env,config);
 ctx=context();await eventSsoHandler("revoke")({...ctx.req,method:"POST"},ctx.res);assert.equal(ctx.res.statusCode,401);assert.equal(ctx.res.body.error.code,"INVALID_CLIENT");assert.equal(logs.at(-1)[1].stage,"revoke");
 ctx=context({authorization:`Bearer ${config.JAOTHUI_EVENT_SSO_CLIENT_SECRET}`,"content-type":"application/json"});await eventSsoHandler("introspect")({...ctx.req,method:"POST",body:{sessionToken:"e".repeat(43)}},ctx.res);assert.equal(ctx.res.statusCode,503);assert.equal(ctx.res.body.error.code,"SSO_UNAVAILABLE");assert.equal(logs.at(-1)[1].category,"database_unavailable");assert.equal(ctx.res.getHeader("Set-Cookie"),undefined);
});
await check("intentional flagOFF retains404 envelope/view and does not inspect missing config or DB", async()=>{
 const calls=dbCalls;process.env.JAOTHUI_EVENT_SSO_ENABLED="false";delete process.env.JAOTHUI_FRONT_ORIGIN;delete process.env.JAOTHUI_LINE_LOGIN_CHANNEL_ID;
 const ctx=context();const result=await entry.getServerSideProps({...ctx,query:{eventId:"event.0"}});assert.equal(ctx.res.statusCode,404);assert.deepEqual(result.props,{message:"ยังไม่เปิดใช้การสมัครจากเว็บไซต์"});assert.equal(logs.at(-1)[1].code,"SSO_DISABLED");assert.ok(!logs.at(-1)[1].missingVariables);
 const api=context();await eventSsoHandler("exchange")({...api.req,method:"POST"},api.res);assert.equal(api.res.statusCode,404);assert.deepEqual(api.res.body,{ok:false,error:{code:"SSO_DISABLED"}});assert.equal(dbCalls,calls);Object.assign(process.env,config);
});
assert.equal(dbCalls,1,"Only one simulated DB outage call; no real database/network I/O");
saved.info(`EVENT_SSO_DIAGNOSTICS_OK ${count} focused cases; safe allowlisted receipts; simulated DB outage only; no provider/network/database I/O`);
} finally { console.info=saved.info;console.warn=saved.warn; }
