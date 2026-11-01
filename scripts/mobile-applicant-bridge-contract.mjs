import assert from "node:assert/strict";
import { createApplicantBridge } from "../server/mobile/events/applicant-bridge.ts";
import { MobileEventService } from "../server/mobile/events/service.ts";
import { eventHandler } from "../server/mobile/events/http.ts";
const env = {NODE_ENV:"production",JAOTHUI_EVENT_APPLICANT_API_URL:"https://source.example.test",JAOTHUI_COMPETITION_APPLICANT_BRIDGE_KEY:"a".repeat(32)};
const row = {_id:"entry",_rev:"r",_createdAt:"2026-10-30T00:00:00Z",name:"fixture",microchip:"001",type:"class A",level:"ประเทศ",ownerName:"owner",farmName:"farm",birthday:"2024-01-01",sex:"male",color:"black",buffaloAge:32,event:{_id:"event",title:"event",startAt:"2026-11-01",endAt:"2026-11-02",eventType:"royal"},registrationPolicyVersion:1,registrationStatus:"accepted",approvalRequirement:"required",approvementResult:true,comment:null,checkInVersion:1,checkInStatus:"not_checked_in",checkedInAt:null,qrAvailable:true,checkInEligibility:{eligible:true,reason:null}};
const envelope = data => new Response(JSON.stringify({ok:true,version:1,data}),{status:200});
const failure = status => new Response(JSON.stringify({ok:false,error:{code:status===404?"NOT_FOUND":status===403?"FORBIDDEN":status===409?"CONFLICT":"UNAUTHORIZED"}}),{status});
const code = c => e => e.code===c;
let count=0;async function check(name,run){await run();count++;console.log("PASS "+name);}
await check("server-only transport uses POST body, dedicated key, timeout and no-store",async()=>{
 let call;const client=createApplicantBridge(async(...args)=>{call=args;return envelope(row);},env);
 assert.equal((await client.status("derived-owner","entry"))._id,"entry");assert.equal(call[0],"https://source.example.test/api/competitions/mobile-applicant");assert.equal(call[1].method,"POST");assert.equal(call[1].cache,"no-store");assert.equal(call[1].redirect,"error");assert.ok(call[1].signal);assert.equal(call[1].headers.Authorization,"Bearer "+env.JAOTHUI_COMPETITION_APPLICANT_BRIDGE_KEY);assert.deepEqual(JSON.parse(call[1].body),{action:"status",owner:"derived-owner",registrationId:"entry"});assert.ok(!call[0].includes("owner"));
});
await check("unsafe/missing bridge config fails before network",async()=>{
 for(const config of [{},{...env,JAOTHUI_EVENT_APPLICANT_API_URL:"http://source.example.test"},{...env,JAOTHUI_EVENT_APPLICANT_API_URL:"https://user:password@source.example.test"},{...env,JAOTHUI_COMPETITION_APPLICANT_BRIDGE_KEY:"short"}]){let calls=0;await assert.rejects(()=>createApplicantBridge(async()=>{calls++;},config).status("owner","entry"),code("EVENTS_UNAVAILABLE"));assert.equal(calls,0);}
});
await check("upstream auth/outage/missing route never invalidates customer session or invents record absence",async()=>{
 for(const reply of [failure(401),new Response("missing route",{status:404}),new Response("offline",{status:500}),envelope({bad:"shape"})])await assert.rejects(()=>createApplicantBridge(async()=>reply,env).status("owner","entry"),code("EVENTS_UNAVAILABLE"));
 await assert.rejects(()=>createApplicantBridge(async()=>{throw new Error("private network detail");},env).status("owner","entry"),code("EVENTS_UNAVAILABLE"));
});
await check("known source record errors preserve safe API classifications",async()=>{
 for(const [status,c]of [[404,"REGISTRATION_NOT_FOUND"],[403,"QR_UNAVAILABLE"],[409,"EVENT_REVISION_CONFLICT"]])await assert.rejects(()=>createApplicantBridge(async()=>failure(status),env).status("owner","entry"),code(c));
});
await check("source cursor/deletion/index errors retain narrow retry classifications",async()=>{
 for(const [status,c,expected]of [[422,"BAD_REQUEST","INVALID_FIELDS"],[422,"INVALID_FIELDS","INVALID_FIELDS"],[404,"APPLICATION_NOT_FOUND","REGISTRATION_NOT_FOUND"],[409,"CHECKIN_INDEX_PENDING","EVENT_REVISION_CONFLICT"]]){
   await assert.rejects(()=>createApplicantBridge(async()=>new Response(JSON.stringify({ok:false,error:{code:c}}),{status}),env).status("owner","entry"),code(expected));
 }
});
await check("source response cannot substitute a different application or non-HTTPS QR",async()=>{
 await assert.rejects(()=>createApplicantBridge(async()=>envelope({...row,_id:"other"}),env).status("owner","entry"),code("EVENTS_UNAVAILABLE"));
 await assert.rejects(()=>createApplicantBridge(async()=>envelope({application:row,qrUrl:"http://unsafe.example.test/pass"}),env).pass("owner","entry"),code("EVENTS_UNAVAILABLE"));
});
await check("legacy approved alias retained while canonical status and arrival remain separate",async()=>{
 const s=new MobileEventService({});const accepted=s.registrationSummary({...row,checkInStatus:"checked_in",checkedInAt:"2026-11-01T01:00:00Z"});assert.equal(accepted.status,"approved");assert.equal(accepted.registrationStatus,"accepted");assert.equal(accepted.checkInStatus,"checked_in");
 const normal=s.registrationSummary({...row,event:{...row.event,eventType:"normal"},registrationStatus:"registered",approvalRequirement:"not_required",comment:"old rejected"});assert.equal(normal.status,"registered");assert.equal(normal.approvalComment,null);
 const unknown=s.registrationSummary({...row,event:{...row.event,eventType:undefined},registrationStatus:"needs_type_review",approvalRequirement:"unknown",qrAvailable:false});assert.equal(unknown.status,"pending");assert.equal(unknown.registrationStatus,"needs_type_review");assert.equal(unknown.event.eventType,null);assert.equal(unknown.qrAvailable,false);
});
await check("bounded history uses one bridge call and no per-item Sanity reads",async()=>{
 let calls=0;const bridge=createApplicantBridge(async(_url,request)=>{calls++;const body=JSON.parse(request.body);assert.equal(body.owner,"derived-owner");assert.equal(body.q,"literal*");assert.equal(body.limit,20);return envelope({items:Array.from({length:20},(_,i)=>({...row,_id:"entry"+i})),eventNames:["event"],nextCursor:"cursor"});},env);
 const db={fetch:()=>{throw new Error("must not read Sanity history");}};const s=new MobileEventService(db,()=>new Date(),async()=>{},bridge);const result=await s.history("derived-owner",{limit:20,q:"literal*",period:"all"});assert.equal(calls,1);assert.equal(result.items.length,20);assert.equal(result.nextCursor,"cursor");assert.equal(result.items[0].event.endDay,"2026-11-02");
});
await check("pass returns full owned registration plus source QR without arrival writes",async()=>{
 const bridge=createApplicantBridge(async()=>envelope({application:row,qrUrl:"https://dboard.jaothui.com/dashboard/competitions/check-in/synthetic"}),env);let reads=0;
 const db={getDocument:async()=>{reads++;return {_id:"entry",_type:"eventRegister",user:{_ref:"owner"},event:{_ref:"event"},ownerTel:"fixture-phone"};},fetch:async()=>({images:[],address:null}),transaction:()=>{throw new Error("must not write arrival");}};
 const s=new MobileEventService(db,()=>new Date(),async()=>{},bridge);const pass=await s.pass("entry","owner");assert.equal(pass.registration.id,"entry");assert.equal(pass.registration.ownerTel,"fixture-phone");assert.equal(pass.registration.checkInStatus,"not_checked_in");assert.match(pass.qrUrl,/\/check-in\//);assert.equal(reads,1);
 await assert.rejects(()=>s.pass("entry","foreign"),code("REGISTRATION_NOT_FOUND"));
});
await check("native pass route rejects GET and anonymous POST before any provider call",async()=>{
 for(const [method,status]of [["GET",405],["POST",401]]){const result={};const res={setHeader(){},status(n){result.status=n;return this;},json(body){result.body=body;return this;}};await eventHandler("pass")({method,headers:{},query:{id:"entry"},body:{}},res);assert.equal(result.status,status);assert.equal(result.body.ok,false);}
});
console.log(`Mobile applicant bridge contract PASS ${count} cases`);
