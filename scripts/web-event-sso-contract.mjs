import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mock } from "bun:test";
import jwt from "jsonwebtoken";
const target = "postgresql://jaothui_e2e@127.0.0.1:55432/jaothui_local_e2e?schema=public";
assert.equal(process.env.JAOTHUI_EVENT_SSO_E2E_DATABASE_URL, target, "Explicit pinned synthetic-only loopback DB required");
const proof = spawnSync("/opt/homebrew/bin/psql", ["-X", "--no-password", "-h", "127.0.0.1", "-p", "55432", "-U", "jaothui_e2e", "-d", "jaothui_local_e2e", "-tA", "-c", "SELECT current_database() || '|' || current_user || '|' || host(inet_server_addr()) || '|' || inet_server_port();"], { encoding: "utf8", env: { PATH: "/usr/bin:/bin", PGPASSFILE: "/dev/null", PGCONNECT_TIMEOUT: "3" } });
assert.equal(proof.status, 0); assert.equal(proof.stdout.trim(), "jaothui_local_e2e|jaothui_e2e|127.0.0.1|55432");
Object.assign(process.env, { NODE_ENV: "test", DATABASE_URL: target, JAOTHUI_EVENT_SSO_ENABLED: "true", JAOTHUI_FRONT_ORIGIN: "http://127.0.0.1:3100", JAOTHUI_EVENT_ORIGIN: "http://127.0.0.1:3200", JAOTHUI_EVENT_SSO_CLIENT_SECRET: "synthetic-dedicated-event-client-key-123456", JAOTHUI_EVENT_SSO_STATE_SECRET: "synthetic-dedicated-attach-state-key-123456", JAOTHUI_WEB_AUTH_SECRET: "synthetic-web-signing-key", private_procedure_secret: "synthetic-legacy-wallet-signing-key", JAOTHUI_LINE_LOGIN_CHANNEL_ID: "2003013735", JAOTHUI_LINE_LOGIN_CHANNEL_SECRET: "synthetic-channel-secret", JAOTHUI_LINE_LOGIN_CALLBACK_URL: "http://127.0.0.1:3100/oauth/web/line/callback" });
const { PrismaClient } = await import("@prisma/client");
const clients = Array.from({ length: 8 }, () => new PrismaClient({ datasources: { db: { url: target } }, log: [] }));
const db = clients[0]; mock.module("../server/prisma.ts", () => ({ prisma: db }));
const sso = await import("../server/auth/event-sso.ts");
const attach = await import("../server/auth/event-sso-line-attach.ts");
const { createLineWebSession } = await import("../server/auth/line-web-session.ts");
const { eventSsoHandler } = await import("../server/auth/event-sso-http.ts");
const authorize = (await import("../pages/api/auth/event-sso/authorize.ts")).default;
const logout = (await import("../pages/api/auth/logout.ts")).default;
const prefix = `web-sso-${randomUUID()}`;
let count = 0;
const isCode = code => e => e.code === code;
async function check(name, run) { await run(); count++; console.log(`PASS ${name}`); }
function response() { return { headers: {}, statusCode: 200, setHeader(k,v){this.headers[k.toLowerCase()]=v;return this;}, getHeader(k){return this.headers[k.toLowerCase()];}, status(s){this.statusCode=s;return this;}, json(body){this.body=body;return this;}, redirect(s,to){this.statusCode=s;this.location=to;return this;} }; }
function context(cookies = {}) { return { req: { headers: { origin: process.env.JAOTHUI_FRONT_ORIGIN, "sec-fetch-site": "same-origin" }, cookies: { ...cookies } }, res: response() }; }
function adopt(ctx) { for (const entry of ctx.res.getHeader("Set-Cookie") ?? []) { const [pair] = entry.split(";"); const i=pair.indexOf("="); ctx.req.cookies[pair.slice(0,i)] = decodeURIComponent(pair.slice(i+1)); } return ctx; }
async function lineAccount(label) { return db.account.create({ data: { displayName: "synthetic", identities: { create: { provider: "line", providerUserId: `${prefix}-${label}`, displayName: "synthetic" } } } }); }
function lineCtx(account, label) { const session=createLineWebSession({accountId:account.id,lineUserId:`${prefix}-${label}`}); return context({jaothui_line_session:session.token}); }
function walletToken(wallet) { return jwt.sign({wallet},process.env.private_procedure_secret,{algorithm:"HS256",issuer:"jaothui",audience:"jaothui-user",expiresIn:"1d"}); }
async function grant(ctx, codeVerifier = sso.randomToken()) { const state=sso.randomToken(); const callback=await sso.authorizeGrant(ctx,{eventId:"synthetic-event",state,challenge:sso.pkceChallenge(codeVerifier)},db);adopt(ctx);const url=new URL(callback);assert.equal(url.searchParams.get("state"),state);return {code:url.searchParams.get("code"),codeVerifier,redirectUri:sso.ssoConfig().redirectUri}; }
async function post(action,body,headers={}) { const res=response();await eventSsoHandler(action)({method:"POST",headers:{authorization:`Bearer ${process.env.JAOTHUI_EVENT_SSO_CLIENT_SECRET}`,"content-type":"application/json",...headers},body},res);return res; }
let A, ctxA, first;
try {
await check("strict config, no broad-key reuse, exact HTTPS origins and finite event ids",async()=>{
 const original={...process.env};
 for(const patch of [{JAOTHUI_EVENT_ORIGIN:"https://unsafe.test/path"},{JAOTHUI_EVENT_ORIGIN:"http://remote.invalid"},{JAOTHUI_EVENT_SSO_CLIENT_SECRET:process.env.private_procedure_secret.padEnd(32,"x"),JAOTHUI_EVENT_SSO_STATE_SECRET:""},{JAOTHUI_EVENT_SSO_CLIENT_SECRET:process.env.JAOTHUI_EVENT_SSO_STATE_SECRET}]){Object.assign(process.env,patch);assert.throws(sso.ssoConfig,isCode("SSO_CONFIGURATION_UNAVAILABLE"));Object.assign(process.env,original);}
 assert.throws(()=>sso.validEventId("../profile"));assert.throws(()=>sso.validEventId(["event"]));assert.equal(sso.validEventId("event.0"),"event.0");assert.throws(()=>sso.validEventId("event..0"));assert.throws(()=>sso.validEventId("drafts.event"));assert.throws(()=>sso.validEventId("versions.event"));
});
await check("same JWT in independent browsers creates independent random host-only SID",async()=>{
 A=await lineAccount("A");ctxA=lineCtx(A,"A");const ctx2=context({jaothui_line_session:ctxA.req.cookies.jaothui_line_session});const one=await sso.activeBrowser(ctxA,db);const two=await sso.activeBrowser(ctx2,db);adopt(ctxA);adopt(ctx2);assert.notEqual(one.id,two.id);assert.notEqual(ctxA.req.cookies.jaothui_browser_sid,ctx2.req.cookies.jaothui_browser_sid);const c=ctxA.res.getHeader("Set-Cookie").find(c=>c.startsWith("jaothui_browser_sid="));assert.match(c,/HttpOnly/);assert.match(c,/SameSite=Lax/);assert.ok(!c.includes("Domain="));
 await sso.revokeBrowser(ctx2,db);assert.equal((await sso.activeBrowser(ctxA,db)).id,one.id);
});
await check("authorize exact callback/state, S256 binding and grant lifetime <=120seconds",async()=>{
 first=await grant(ctxA);const stored=await db.webEventGrant.findUnique({where:{id:sso.hash(first.code)}});assert.ok(stored.expiresAt-new Date()<=120000);assert.notEqual(stored.id,first.code);assert.ok(stored.stateHash);assert.equal(stored.redirectUri,"http://127.0.0.1:3200/api/auth/front/callback");
 const res=response();await authorize({...ctxA.req,method:"GET",query:{eventId:"event",state:sso.randomToken(),code_challenge:sso.randomToken(),code_challenge_method:"plain"}},res);assert.equal(res.statusCode,400);assert.equal(res.getHeader("Cache-Control"),"no-store");
});
await check("wrong PKCE or callback cannot consume the grant; wrong client/extra fields denied",async()=>{
 await assert.rejects(()=>sso.exchangeGrant({...first,codeVerifier:sso.randomToken()},db),isCode("INVALID_GRANT"));await assert.rejects(()=>sso.exchangeGrant({...first,redirectUri:"https://attacker.invalid/callback"},db),isCode("INVALID_EXCHANGE"));assert.equal((await db.webEventGrant.findUnique({where:{id:sso.hash(first.code)}})).consumedAt,null);
 assert.equal((await post("exchange",first,{authorization:"Bearer incorrect"})).statusCode,401);assert.equal((await post("exchange",{...first,accountId:"forged"})).statusCode,400);
});
await check("real PostgreSQL concurrent redemption exactly one winner across8 clients",async()=>{
 const replies=await Promise.allSettled(clients.map(client=>sso.exchangeGrant(first,client)));const winners=replies.filter(r=>r.status==="fulfilled");assert.equal(winners.length,1);assert.equal(replies.filter(r=>r.status==="rejected"&&r.reason.code==="INVALID_GRANT").length,7);first.session=winners[0].value;assert.equal(first.session.account.accountId,A.id);assert.equal(first.session.eventId,"synthetic-event");assert.equal(await db.webEventSession.count({where:{id:sso.hash(first.session.sessionToken)}}),1);
});
await check("fresh profile and applicant-only exact response; no client account authority",async()=>{
 await db.accountIdentity.update({where:{provider_providerUserId:{provider:"line",providerUserId:`${prefix}-A`}},data:{displayName:"updated-synthetic"}});const result=await post("introspect",{sessionToken:first.session.sessionToken});assert.equal(result.statusCode,200);assert.deepEqual(Object.keys(result.body.data.account).sort(),["accountId","avatarUrl","displayName","email","lineId"]);assert.equal(result.body.data.account.displayName,"updated-synthetic");assert.equal((await post("introspect",{sessionToken:first.session.sessionToken,accountId:"other"})).statusCode,400);
});
await check("expired grants and revoked/expired parent fail closed",async()=>{
 const expired=await grant(ctxA);await db.webEventGrant.update({where:{id:sso.hash(expired.code)},data:{expiresAt:new Date(0)}});await assert.rejects(()=>sso.exchangeGrant(expired,db),isCode("INVALID_GRANT"));
 const ctx=lineCtx(A,"A");const g=await grant(ctx);await db.webBrowserSession.update({where:{id:sso.hash(ctx.req.cookies.jaothui_browser_sid)},data:{expiresAt:new Date(0)}});await assert.rejects(()=>sso.exchangeGrant(g,db),isCode("SESSION_REVOKED"));
});
await check("relinked/missing LINE and inactive/deleted account invalidate without JWT-cache trust",async()=>{
 await db.accountIdentity.update({where:{provider_providerUserId:{provider:"line",providerUserId:`${prefix}-A`}},data:{providerUserId:`${prefix}-A-relinked`}});await assert.rejects(()=>sso.introspectSession(first.session.sessionToken,db),isCode("LINE_IDENTITY_CHANGED"));
 await db.accountIdentity.update({where:{provider_providerUserId:{provider:"line",providerUserId:`${prefix}-A-relinked`}},data:{providerUserId:`${prefix}-A`}});
 await db.account.update({where:{id:A.id},data:{status:"DELETED",deletedAt:new Date()}});await assert.rejects(()=>sso.introspectSession(first.session.sessionToken,db),isCode("ACCOUNT_INACTIVE"));await db.account.update({where:{id:A.id},data:{status:"ACTIVE",deletedAt:null}});
});
await check("different credential and ambiguous account cannot reuse family",async()=>{
 const B=await lineAccount("B");const switched=lineCtx(B,"B");switched.req.cookies.jaothui_browser_sid=ctxA.req.cookies.jaothui_browser_sid;await assert.rejects(()=>sso.activeBrowser(switched,db),isCode("BROWSER_SESSION_INVALID"));
 const wallet=`0x${randomUUID().replaceAll("-","").padEnd(40,"0")}`;await db.walletLink.create({data:{walletAddress:wallet,accountId:B.id,verifiedAt:new Date()}});const ambiguous=context({...ctxA.req.cookies,session_token:walletToken(wallet)});await assert.rejects(()=>sso.resolvePrincipal(ambiguous,db),isCode("ACCOUNT_SELECTION_REQUIRED"));
 const staleLine=context({jaothui_line_session:"expired-or-invalid-line",session_token:walletToken(wallet)});await assert.rejects(()=>sso.resolvePrincipal(staleLine,db),isCode("ACCOUNT_SELECTION_REQUIRED"));
 const staleWallet=context({...ctxA.req.cookies,session_token:"expired-or-invalid-wallet"});await assert.rejects(()=>sso.resolvePrincipal(staleWallet,db),isCode("ACCOUNT_SELECTION_REQUIRED"));
});
await check("root account switch revokes old family before new login; event logout idempotent",async()=>{
 const B=await lineAccount("switch");const session=createLineWebSession({accountId:B.id,lineUserId:`${prefix}-switch`});await sso.establishBrowser(ctxA,{accountId:B.id,credentialHash:sso.hash(session.token),credentialKind:"line",credentialSubject:`${prefix}-switch`,expiresAt:new Date(session.expiresAt*1000)},db);await assert.rejects(()=>sso.introspectSession(first.session.sessionToken,db),isCode("SESSION_REVOKED"));
 const ctx=lineCtx(B,"switch");const g=await grant(ctx);const session2=await sso.exchangeGrant(g,db);await sso.revokeEventSession(session2.sessionToken,db);await sso.revokeEventSession(session2.sessionToken,db);await assert.rejects(()=>sso.introspectSession(session2.sessionToken,db),isCode("INVALID_SESSION"));
});
await check("root logout CSRF rejected; accepted logout revokes existing child",async()=>{
 const ctx=lineCtx(A,"A");const g=await grant(ctx);const child=await sso.exchangeGrant(g,db);let res=response();await logout({...ctx.req,method:"POST",headers:{origin:"https://attacker.invalid","sec-fetch-site":"cross-site"}},res);assert.equal(res.statusCode,403);assert.equal((await sso.introspectSession(child.sessionToken,db)).account.accountId,A.id);
 res=response();await logout({...ctx.req,method:"POST"},res);assert.equal(res.statusCode,200);await assert.rejects(()=>sso.introspectSession(child.sessionToken,db),isCode("SESSION_REVOKED"));
});
await check("DB outage yields503 and never clears valid cookies",async()=>{
 const bad = new PrismaClient({datasources:{db:{url:"postgresql://synthetic@127.0.0.1:1/never_connect?connect_timeout=1"}},log:[]});
 try { const ctx=lineCtx(A,"A"); await assert.rejects(()=>sso.activeBrowser(ctx,bad), e=>sso.ssoFailure(e).status===503);assert.equal(ctx.res.getHeader("Set-Cookie"),undefined); }finally{await bad.$disconnect();}
});
await check("featureOFF skips new tables for legacy hooks",async()=>{
 process.env.JAOTHUI_EVENT_SSO_ENABLED="false";const forbidden=new Proxy({}, {get(){throw new Error("new-table-access");}});await sso.revokeBrowser(context(),forbidden);await sso.establishBrowser(context(),{},forbidden);const res=response();await logout({method:"POST",headers:{},cookies:{}},res);assert.equal(res.statusCode,200);process.env.JAOTHUI_EVENT_SSO_ENABLED="true";
});
await check("server-verified legacy wallet maps account; attach bound to same browser and one-shot proof",async()=>{
 const wallet=`0x${randomUUID().replaceAll("-","").padEnd(40,"0")}`;const ctx=context({session_token:walletToken(wallet)});const principal=await sso.resolvePrincipal(ctx,db);const browser=await sso.activeBrowser(ctx,db);adopt(ctx);const url=new URL(await attach.beginLineAttach(ctx,"/v2/event-entry?eventId=synthetic-event",db));const state=url.searchParams.get("state");assert.equal(attach.attachStateHint(state),true);
 const other=context({session_token:ctx.req.cookies.session_token});await sso.activeBrowser(other,db);adopt(other);let calls=0;
 const fetcher=async (_url,init)=>{calls++;if(_url.endsWith("/token"))return Response.json({access_token:"synthetic-provider-token",id_token:"synthetic-id-token"});const nonce=new URLSearchParams(init.body).get("nonce");return Response.json({sub:`${prefix}-attach`,name:"synthetic",nonce});};
 await assert.rejects(()=>attach.completeLineAttach(other,{state,code:"synthetic-code"},db,fetcher),isCode("INVALID_ATTACH_STATE"));assert.equal(calls,0);
 assert.equal(await attach.completeLineAttach(ctx,{state,code:"synthetic-code"},db,fetcher),"/v2/event-entry?eventId=synthetic-event");assert.equal((await sso.freshAccount(principal.accountId,`${prefix}-attach`,db)).accountId,principal.accountId);assert.equal((await sso.activeBrowser(ctx,db)).id,browser.id);assert.equal(ctx.req.cookies.jaothui_line_session,undefined);await assert.rejects(()=>attach.completeLineAttach(ctx,{state,code:"synthetic-code"},db,fetcher),isCode("INVALID_ATTACH_STATE"));
});
await check("LINE attach identity conflict cannot switch or merge wallet account",async()=>{
 const wallet=`0x${randomUUID().replaceAll("-","").padEnd(40,"0")}`;const ctx=context({session_token:walletToken(wallet)});const parent=await sso.activeBrowser(ctx,db);adopt(ctx);const state=new URL(await attach.beginLineAttach(ctx,"/v2/event-entry?eventId=synthetic-event",db)).searchParams.get("state");
 const fetcher=async (url,init)=>url.endsWith("/token")?Response.json({access_token:"synthetic",id_token:"synthetic"}):Response.json({sub:`${prefix}-A`,nonce:new URLSearchParams(init.body).get("nonce")});
 await assert.rejects(()=>attach.completeLineAttach(ctx,{state,code:"synthetic"},db,fetcher),isCode("LINE_IDENTITY_ALREADY_LINKED"));assert.equal((await sso.freshAccount(parent.accountId,undefined,db)).lineId,null);assert.equal((await sso.activeBrowser(ctx,db)).accountId,parent.accountId);
});
await check("logout client keeps local identity on503/network and clears once only after success",async()=>{
 const {logoutAndClear}=await import("../utils/auth-logout.ts");let clears=0,calls=0;
 const fetcher=async(_url,init)=>{calls++;assert.equal(init.method,"POST");return Response.json({success:false},{status:503});};
 assert.equal(await logoutAndClear(()=>clears++,fetcher),false);assert.equal(clears,0);assert.equal(calls,1);
 assert.equal(await logoutAndClear(()=>clears++,async()=>{throw new Error("offline");}),false);assert.equal(clears,0);
 assert.equal(await logoutAndClear(()=>clears++,async()=>Response.json({success:true})),true);assert.equal(clears,1);
});
await check("unverified LINE namespace fails before issuer use",async()=>{
 process.env.JAOTHUI_LINE_LOGIN_CHANNEL_ID="unverified-channel";assert.throws(sso.ssoConfig,isCode("IDENTITY_MAPPING_UNVERIFIED"));process.env.JAOTHUI_LINE_LOGIN_CHANNEL_ID="2003013735";
});
await check("failed family establishment rolls back revocation and never clears credentials",async()=>{
 const ctx=lineCtx(A,"A");const g=await grant(ctx);const child=await sso.exchangeGrant(g,db);ctx.res=response();
 await assert.rejects(()=>sso.establishBrowser(ctx,{accountId:A.id,credentialHash:"synthetic",credentialKind:"line",expiresAt:new Date(Date.now()+60000)},db));
 assert.equal((await sso.introspectSession(child.sessionToken,db)).account.accountId,A.id);assert.equal(ctx.res.getHeader("Set-Cookie"),undefined);
});
await check("missing LINE, unlinked wallet and expired child rejected from fresh DB",async()=>{
 const wallet=`0x${randomUUID().replaceAll("-","").padEnd(40,"0")}`;const ctx=context({session_token:walletToken(wallet)});await sso.activeBrowser(ctx,db);adopt(ctx);
 await assert.rejects(()=>grant(ctx),isCode("LINE_LINK_REQUIRED"));const principal=await sso.resolvePrincipal(ctx,db);await db.accountIdentity.create({data:{accountId:principal.accountId,provider:"line",providerUserId:`${prefix}-wallet-fresh`}});
 const g=await grant(ctx);const child=await sso.exchangeGrant(g,db);await db.walletLink.update({where:{walletAddress:wallet},data:{status:"UNLINKED"}});await assert.rejects(()=>sso.introspectSession(child.sessionToken,db),isCode("WALLET_IDENTITY_CHANGED"));await db.walletLink.update({where:{walletAddress:wallet},data:{status:"LINKED"}});await db.webEventSession.update({where:{id:sso.hash(child.sessionToken)},data:{expiresAt:new Date(0)}});await assert.rejects(()=>sso.introspectSession(child.sessionToken,db),isCode("INVALID_SESSION"));
});
await check("attach tampered signature/expired durable state/wrongnonce rejected without account change",async()=>{
 const wallet=`0x${randomUUID().replaceAll("-","").padEnd(40,"0")}`;const ctx=context({session_token:walletToken(wallet)});const parent=await sso.activeBrowser(ctx,db);adopt(ctx);const url=new URL(await attach.beginLineAttach(ctx,"/v2/event-entry?eventId=event.0",db));const state=url.searchParams.get("state");const payload=jwt.decode(state);
 await assert.rejects(()=>attach.completeLineAttach(ctx,{state:state.slice(0,-3)+"bad",code:"synthetic"},db),e=>sso.ssoFailure(e).status===401);
 await db.webLineAttachIntent.update({where:{id:sso.hash(payload.id)},data:{expiresAt:new Date(0)}});await assert.rejects(()=>attach.completeLineAttach(ctx,{state,code:"synthetic"},db),isCode("INVALID_ATTACH_STATE"));
 const state2=new URL(await attach.beginLineAttach(ctx,"/v2/event-entry?eventId=event.0",db)).searchParams.get("state");const fetcher=async(url)=>url.endsWith("/token")?Response.json({access_token:"synthetic",id_token:"synthetic"}):Response.json({sub:`${prefix}-wrongnonce`,nonce:"wrongnonce"});await assert.rejects(()=>attach.completeLineAttach(ctx,{state:state2,code:"synthetic"},db,fetcher),e=>sso.ssoFailure(e).status===401);assert.equal((await sso.freshAccount(parent.accountId,undefined,db)).lineId,null);
});
await check("reviewer sandbox cannot become a real Event applicant",async()=>{
 const reviewer=await lineAccount("reviewer");await db.account.update({where:{id:reviewer.id},data:{role:"REVIEWER_SANDBOX"}});await assert.rejects(()=>sso.freshAccount(reviewer.id,undefined,db),isCode("REVIEWER_APPLICANT_FORBIDDEN"));await assert.rejects(()=>sso.activeBrowser(lineCtx(reviewer,"reviewer"),db),isCode("REVIEWER_APPLICANT_FORBIDDEN"));
});
await check("real entry SSR renders public login/link/resume and preserves dotted event intent",async()=>{
 const {default:Page,getServerSideProps}=await import("../pages/v2/event-entry.tsx");assert.equal(Page.publicPage,true);
 const anon=context();const state=sso.randomToken(),challenge=sso.randomToken();const login=await getServerSideProps({...anon,query:{eventId:"event.0",state,code_challenge:challenge}});assert.ok(login.props.loginTo);const returnTo=new URL(login.props.loginTo,"http://local.invalid").searchParams.get("returnTo");assert.equal(new URL(returnTo,"http://local.invalid").searchParams.get("eventId"),"event.0");assert.equal(new URL(returnTo,"http://local.invalid").searchParams.get("state"),state);
 const ctx=lineCtx(A,"A");const ready=await getServerSideProps({...ctx,query:{eventId:"event.0"}});assert.equal(ready.redirect.destination,"http://127.0.0.1:3200/api/auth/front/start?eventId=event.0");
 const wallet=`0x${randomUUID().replaceAll("-","").padEnd(40,"0")}`;const w=context({session_token:walletToken(wallet)});const missing=await getServerSideProps({...w,query:{eventId:"event.0"}});assert.equal(missing.props.linkTo,"/v2/event-entry?eventId=event.0&attach=line");
});
await check("attach final transaction rechecks wallet binding after deferred provider flight",async()=>{
 const wallet=`0x${randomUUID().replaceAll("-","").padEnd(40,"0")}`;const ctx=context({session_token:walletToken(wallet)});const parent=await sso.activeBrowser(ctx,db);adopt(ctx);const state=new URL(await attach.beginLineAttach(ctx,"/v2/event-entry?eventId=event.0",db)).searchParams.get("state");
 let resume,started;const entered=new Promise(resolve=>{started=resolve;});const deferred=new Promise(resolve=>{resume=resolve;});
 const fetcher=async(url,init)=>{if(url.endsWith("/token")){started();await deferred;return Response.json({access_token:"synthetic",id_token:"synthetic"});}return Response.json({sub:`${prefix}-deferred-attach`,nonce:new URLSearchParams(init.body).get("nonce")});};
 const result=attach.completeLineAttach(ctx,{state,code:"synthetic"},db,fetcher);const rejected=assert.rejects(()=>result,isCode("WALLET_IDENTITY_CHANGED"));await entered;await db.walletLink.update({where:{walletAddress:wallet},data:{status:"UNLINKED"}});resume();await rejected;assert.equal((await sso.freshAccount(parent.accountId,undefined,db)).lineId,null);
});
console.log(`Web Event SSO real-PG contract PASS ${count} cases; 8-client race=1 winner/7 rejects; synthetic rows retained namespace=${prefix}`);
} finally { await Promise.all(clients.map(c=>c.$disconnect())); }
