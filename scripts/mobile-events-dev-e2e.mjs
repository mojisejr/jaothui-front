import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID, randomBytes } from "node:crypto";
import { deflateSync } from "node:zlib";
import { requireEventTestTarget, guardOwnedEventClient } from "./mobile-events-isolation.mjs";

if (process.argv[2] !== "--run" || process.argv[3] !== "--output" || !path.isAbsolute(process.argv[4]??"")) throw new Error("Usage: bun scripts/mobile-events-dev-e2e.mjs --run --output ABSOLUTE_SCRATCH");
requireEventTestTarget(process.env); // Before constructing ANY Sanity client.
const pg=new URL(process.env.DATABASE_URL||"");assert.equal(pg.hostname,"127.0.0.1");assert.equal(pg.port,"55432");assert.equal(pg.pathname,"/jaothui_local_e2e");assert.equal(pg.username,"jaothui_e2e");assert.equal(pg.password,"");
const out=path.join(process.argv[4],`phase2-dev-${new Date().toISOString().replaceAll(':','-')}-${randomBytes(3).toString('hex')}`);fs.mkdirSync(out,{recursive:true});
const {createClient}=await import("@sanity/client");
const {MobileEventService,sourcePayload,registrationIdentity}=await import("../server/mobile/events/service.ts");
const {applicantImageIdentity}=await import("../server/mobile/events/image.ts");
const {eventHandler}=await import("../server/mobile/events/http.ts");
const {createMobileAccountSession}=await import("../server/mobile/auth-session.ts");
const {prisma:db}=await import("../server/prisma.ts");
const config={projectId:"q38mtihr",dataset:"dev",apiVersion:"2024-06-17",useCdn:false,perspective:"published",token:process.env.JAOTHUI_EVENT_SANITY_WRITE_TOKEN};
const raw=createClient(config);
const digest=rows=>createHash('sha256').update(JSON.stringify(rows.map(d=>[d._id,d._rev]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0))).digest('hex');
// Refresh and freeze every existing document for THIS run, including retained
// synthetic fixtures from earlier attempts. No namespace exclusions or resets.
const before=await raw.fetch('*[]{_id,_rev}'),baseline=new Set(before.map(d=>d._id));
const expectedIndex=process.argv.indexOf('--expected-baseline-sha');
if(expectedIndex>=0)assert.equal(digest(before),process.argv[expectedIndex+1],"Operator baseline lock changed; stop before mutation");
const nonce=randomUUID(),prefix=`oracle-mobile-${nonce}`,user=`${prefix}.user`,normalEvent=`${prefix}.normal`,royalEvent=`${prefix}.royal`,legacyEvent=`${prefix}.legacy`,legacyRegister=`${prefix}.legacy-register`;
const owned=new Set([user,normalEvent,royalEvent,legacyEvent,legacyRegister,`${prefix}.normal-catalog`,`${prefix}.royal-catalog`]);
const receipt={startedAt:new Date().toISOString(),target:"q38mtihr/dev",namespace:prefix,baseline:{documents:before.length,idRevisionSHA256:digest(before)},ownedIds:[],fixtures:{user,normalEvent,royalEvent,legacyEvent,legacyRegister},checks:{},status:"running"};
function save(){receipt.ownedIds=[...owned].sort();fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');}
save();
const client=guardOwnedEventClient(raw,owned,baseline,save),service=new MobileEventService(client);
function crc32(bytes){let c=0xffffffff;for(const v of bytes){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(type,bytes){const label=Buffer.from(type),body=Buffer.concat([label,bytes]),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(bytes.length);crc.writeUInt32BE(crc32(body));return Buffer.concat([length,body,crc]);}
function png(){const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(1,0);ihdr.writeUInt32BE(1,4);ihdr[8]=8;ihdr[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('tEXt',Buffer.from(`fixture\0${randomUUID()}`)),chunk('IDAT',deflateSync(Buffer.from([0,...randomBytes(3),255]))),chunk('IEND',Buffer.alloc(0))]);}
const day=offset=>new Date(Date.now()+offset*86400000+7*3600000).toISOString().slice(0,10);
const eventFields={_type:"event",title:"Oracle synthetic mobile integration",competitionState:"published",isActive:true,registrationActive:true,startAt:day(1),endAt:day(2),registrationStartAt:day(-1),registrationDeadline:day(1),buffaloAgeDeadline:day(1),competitionWriteFence:0,competitionRegistrationCount:0};
const normal={operationId:randomUUID(),name:"Synthetic buffalo",type:"ไม่เกิน 1200 เดือน",level:"ประเทศ",sex:"male",color:"black",birthdate:"2025-01-01",microchip:"",ownerName:"Synthetic owner",ownerTel:"0000000000",fatherName:"unknown",motherName:"unknown",farmName:"Synthetic fixture",province:"test",buffaloAge:999,agreements:Object.fromEntries([1,2,3,4].map(i=>[`accept${i}`,true]))};
const reference=id=>({_type:"reference",_ref:id});
async function waitFor(fn){let last;for(let i=0;i<15;i++){try{return await fn();}catch(error){last=error;await new Promise(resolve=>setTimeout(resolve,500));}}throw last;}
function response(){return {statusCode:0,setHeader(){},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;},end(){return this;}};}
try{
  await client.create({...eventFields,_id:normalEvent,eventType:"normal"});await client.create({...eventFields,_id:royalEvent,eventType:"royal"});
  await client.create({...eventFields,_id:legacyEvent,competitionState:undefined,startAt:"2025-01-01",endAt:"2025-01-02",eventType:"normal"});
  for(const [eventId,id]of [[normalEvent,`${prefix}.normal-catalog`],[royalEvent,`${prefix}.royal-catalog`]])await client.create({_id:id,_type:"nationalEventType",event:reference(eventId),data:[normal.type]});
  const actor=await db.account.create({data:{identities:{create:{provider:"line",providerUserId:user}}}});receipt.localAccountId=actor.id;save();
  await service.enroll(user,{firstName:"Synthetic",lastName:"Fixture",tel:"0000000000"});
  await waitFor(async()=>{assert.ok(await service.member(user));assert.equal((await service.catalogs(normalEvent)).length,1);});
  const normalIdentity=registrationIdentity({eventId:normalEvent,userId:user,operationId:normal.operationId},sourcePayload(normalEvent,user,normal,false));owned.add(normalIdentity.id);save();
  const normalResult=await service.submit(normalEvent,user,normal),normalReplay=await service.submit(normalEvent,user,normal);
  assert.equal(normalResult.replayed,false);assert.equal(normalReplay.replayed,true);assert.equal(normalReplay.id,normalResult.id);
  const normalDoc=await client.getDocument(normalResult.id),normalEventDoc=await client.getDocument(normalEvent);
  assert.equal(normalDoc.user._ref,user);assert.equal(normalDoc.event._ref,normalEvent);assert.notEqual(normalDoc.buffaloAge,999);assert.equal(normalDoc.registrationRequestHash,normalIdentity.hash);assert.equal(normalEventDoc.competitionRegistrationCount,1);assert.equal(normalEventDoc.competitionWriteFence,1);
  receipt.checks.normal={id:normalResult.id,hash:normalIdentity.hash,count:1,fence:1,replay:true};save();
  const images=[];
  for(let i=0;i<5;i++){const bytes=png(),id=applicantImageIdentity(bytes).id;assert.equal(await raw.getDocument(id),undefined,"Synthetic bytes deduplicated with existing asset; refuse");owned.add(id);save();const uploaded=await service.upload(royalEvent,user,bytes);assert.equal(uploaded.assetId,id);images.push(id);assert.equal((await raw.getDocument(id)).source.id,`competition:${royalEvent}:${user}`);}
  const royal={...normal,operationId:randomUUID(),imageIds:images,address:"Synthetic address",district:"test",amphoe:"test",zipcode:"00000",agreements:Object.fromEntries(["d1Accept","d2Accept","d3Accept",...Array.from({length:8},(_,i)=>`accept${i+1}`)].map(key=>[key,true]))};
  const royalIdentity=registrationIdentity({eventId:royalEvent,userId:user,operationId:royal.operationId},sourcePayload(royalEvent,user,royal,true));for(const suffix of ["",".images",".approval",".address"])owned.add(royalIdentity.id+suffix);save();
  const royalResult=await service.submit(royalEvent,user,royal),royalReplay=await service.submit(royalEvent,user,royal);assert.equal(royalReplay.replayed,true);
  const graph=await Promise.all(["",".images",".approval",".address"].map(suffix=>raw.getDocument(royalIdentity.id+suffix))),royalEventDoc=await raw.getDocument(royalEvent);
  assert.ok(graph.every(Boolean));assert.equal(graph[0].registrationRequestHash,royalIdentity.hash);assert.equal(graph[1].imageArray.length,5);assert.equal(graph[2].approvementResult,undefined);assert.equal(graph[3].user._ref,user);assert.equal(royalEventDoc.competitionRegistrationCount,1);assert.equal(royalEventDoc.competitionWriteFence,1);
  receipt.checks.royal={id:royalResult.id,hash:royalIdentity.hash,graphIds:graph.map(d=>d._id),assets:images,count:1,fence:1,replay:true};save();
  await client.create({_id:legacyRegister,_type:"eventRegister",event:reference(legacyEvent),user:reference(user),name:"Synthetic historical buffalo",type:normal.type,level:"ประเทศ",birthday:"2024-01-01",buffaloAge:12,sex:"male",color:"black",microchip:""});
  await waitFor(async()=>{const history=await service.history(user);assert.ok(history.items.some(row=>row.id===legacyRegister));assert.equal(history.items.find(row=>row.id===royalResult.id).status,"pending");});
  await client.patch(`${royalIdentity.id}.approval`).set({approvementResult:false,comment:"Synthetic rejection fixture"}).commit();
  await waitFor(async()=>assert.equal((await service.registration(royalResult.id,user)).status,"rejected"));
  process.env.JAOTHUI_MOBILE_EVENTS_ENABLED="true";process.env.JAOTHUI_MOBILE_AUTH_SECRET="synthetic-events-route-only";process.env.JAOTHUI_LINE_LOGIN_CHANNEL_ID="2003013735";
  const token=createMobileAccountSession({accountId:actor.id,primaryProvider:"line",providerUserId:user}).token;
  await waitFor(async()=>{const res=response();await eventHandler("history")({method:"GET",query:{},headers:{authorization:`Bearer ${token}`}},res);assert.equal(res.statusCode,200);assert.ok(res.body.data.items.some(row=>row.id===legacyRegister),"Own HTTP history must include ended legacy fixture");});
  const foreign=await db.account.create({data:{identities:{create:{provider:"line",providerUserId:`${prefix}.foreign`}}}}),foreignToken=createMobileAccountSession({accountId:foreign.id,primaryProvider:"line",providerUserId:`${prefix}.foreign`}).token,foreignRes=response();
  await eventHandler("registration")({method:"GET",query:{id:royalResult.id},headers:{authorization:`Bearer ${foreignToken}`}},foreignRes);assert.equal(foreignRes.statusCode,404);
  receipt.checks.history={legacyEndedIncluded:true,royalPendingThenFalseRejected:true,actualOwnRoute200:true,actualForeignRoute404:true};
  const after=await raw.fetch('*[]{_id,_rev}'),retained=after.filter(d=>!owned.has(d._id));assert.equal(retained.length,before.length);assert.equal(digest(retained),digest(before));
  receipt.after={documents:after.length,retainedLegacyDocuments:retained.length,idRevisionSHA256:digest(retained)};receipt.status="PASS";receipt.finishedAt=new Date().toISOString();save();
  console.log(JSON.stringify({status:receipt.status,receipt:path.join(out,'receipt.json'),ownedIds:owned.size,legacyDocuments:retained.length,legacyDigestUnchanged:true,normalAndRoyalGraph:true,historyPrivacy:true}));
}catch(error){receipt.status="FAIL";receipt.failure={name:error.name,code:error.code??error.statusCode??null,message:"Integration assertion failed; synthetic docs retained. Inspect focused test stack without upstream payload."};save();console.error(JSON.stringify({status:"FAIL",receipt:path.join(out,"receipt.json"),name:error.name,code:error.code??error.statusCode??null,detail:error.name==="AssertionError"?error.message:"Sanity integration failed; inspect protected receipt",location:error.stack?.split("\n").filter(line=>line.includes("mobile-events-dev-e2e.mjs"))[0]}));process.exitCode=1;}
finally{await db.$disconnect();}
