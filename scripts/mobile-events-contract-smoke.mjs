import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { MobileEventService, sourcePayload, registrationIdentity } from "../server/mobile/events/service.ts";
import { calculateCompetitionAge, calculateRegistrationAge, getCompetitionPolicy } from "../server/mobile/events/competition-policy.ts";
import { encodeCompetitionClass, isCompetitionClassEligible } from "../server/mobile/events/competition-classes.ts";
import { eventConfig } from "../server/mobile/events/config.ts";
import { applicantImageIdentity, scopedApplicantImage } from "../server/mobile/events/image.ts";
import { requireEventCustomer } from "../server/mobile/events/guard.ts";
import { eventHandler, eventFailure, customerSession } from "../server/mobile/events/http.ts";
import { InvalidAuthError } from "../server/auth/errors.ts";
import { createMobileAccountSession, createMobileSession } from "../server/mobile/auth-session.ts";

const now = new Date("2026-10-16T12:00:00Z");
const event = { _id: "event", _type: "event", _rev: "r1", title: "งานประกวด", competitionState: "published", isActive: true, registrationActive: true,
  startAt: "2026-10-17", endAt: "2026-10-18", registrationStartAt: "2026-10-01", registrationDeadline: "2026-10-16", buffaloAgeDeadline: "2026-10-17", eventType: "normal", competitionRegistrationCount: 0 };
const normal = { operationId: "00000000-0000-4000-8000-000000000001", type: "มากกว่า 12 เดือน ถึง 15 เดือน", level: "ประเทศ", name: "synthetic", sex: "male", color: "black", birthdate: "2025-10-16", microchip: "", ownerName: "fixture", ownerTel: "000", fatherName: "f", motherName: "m", farmName: "f", province: "p", buffaloAge: 99,
  agreements: Object.fromEntries([1,2,3,4].map(i=>[`accept${i}`,true])) };
const assetIds = Array.from({length:5},(_,i)=>`image-${String(i).repeat(40)}-1x1-png`);
const royal = { ...normal, imageIds: assetIds, address: "test", district: "test", amphoe: "test", zipcode: "00000", agreements: Object.fromEntries(["d1Accept","d2Accept","d3Accept",...Array.from({length:9},(_,i)=>`accept${i+1}`)].map(key=>[key,true])) };
let count = 0;
async function check(label, fn) { await fn(); count++; console.log(`PASS ${label}`); }
class FakeSanity {
  constructor(royalEvent=false) {
    this.docs = new Map([["event",{...event,eventType:royalEvent?"royal":"normal"}], ["line",{_id:"line",_type:"user",lineId:"line",role:"USER"}], ["catalog",{_id:"catalog",_type:"nationalEventType",event:{_ref:"event"},data:[normal.type]}], ...assetIds.map(id=>[id,{_id:id,_type:"sanity.imageAsset",source:{id:"competition:event:line"}}])]);
    this.commits = 0; this.assetUploads = 0;
    this.assets = { upload: async (_kind,bytes)=> {this.assetUploads++;const id=applicantImageIdentity(bytes).id;const doc={_id:id,_type:"sanity.imageAsset",_rev:"asset-r1",...(this.uploadSource?{source:this.uploadSource}:{})};this.docs.set(id,doc);return doc;} };
  }
  config(){ return {projectId:"q38mtihr",dataset:"dev"}; }
  async getDocument(id){ if(this.onGet) await this.onGet(id); return structuredClone(this.docs.get(id)); }
  async createIfNotExists(doc){ if(!this.docs.has(doc._id))this.docs.set(doc._id,structuredClone(doc));return this.getDocument(doc._id); }
  patch(id){const self=this,state={};return {ifRevisionId(rev){state.rev=rev;return this;},set(fields){state.fields=fields;return this;},async commit(){if(self.beforeAssetPatch)self.beforeAssetPatch(id);if(self.docs.get(id)._rev!==state.rev)throw Object.assign(new Error("revision conflict"),{statusCode:409});if(!self.assetPatchNoOp)Object.assign(self.docs.get(id),state.fields,{_rev:"asset-r2"});return self.getDocument(id);}};}
  async fetch(query,args={}) {
    if(this.fetchError)throw this.fetchError;
    const rows=[...this.docs.values()];
    if(query.includes('_type == "event"'))return structuredClone(rows.filter(d=>d._type==="event"));
    if(query.includes('_type in $types'))return structuredClone(rows.filter(d=>args.types.includes(d._type)&&d.event?._ref===args.eventId).map(d=>({_id:d._id})));
    if(query.includes('_type == "user"'))return structuredClone(rows.filter(d=>d._type==="user"&&(d.lineId===args.lineId||d._id===args.lineId)));
    if(query.includes('_type=="eventRegister"'))return structuredClone(rows.filter(d=>d._type==="eventRegister"&&d.user?._ref===args.lineId&&this.docs.get(d.event._ref)?.competitionState!=="draft").map(d=>({...d,event:this.docs.get(d.event._ref),approval:this.docs.get(d._id+".approval")})).slice(0,args.take));
    if(query.includes('"approval":'))return {approval:this.docs.get(args.id+".approval"),images:[],address:null};
    throw new Error("Unexpected mock query");
  }
  transaction(){
    const creates=[], state={}; const self=this;
    const tx={ patch(id,callback){state.id=id;callback({ifRevisionId(rev){state.rev=rev;return this;},setIfMissing(){return this;},inc(values){state.inc=values;return this;}});return tx;},create(doc){creates.push(doc);return tx;},async commit(){
      if(self.beforeCommit) await self.beforeCommit();
      if(self.failCommit)throw new Error("atomic transaction failure");
      if(self.docs.get(state.id)._rev!==state.rev||creates.some(d=>self.docs.has(d._id)))throw Object.assign(new Error("revision conflict"),{statusCode:409});
      const next=structuredClone(self.docs.get(state.id));for(const[k,v]of Object.entries(state.inc))next[k]=(next[k]??0)+v;next._rev=randomUUID();self.docs.set(state.id,next);
      for(const d of creates)self.docs.set(d._id,{...structuredClone(d),_createdAt:"2026-10-16T12:00:00Z"});self.commits++;return creates;
    }};return tx;
  }
}
const service = fake => new MobileEventService(fake,()=>now);
const code = expected => error => error.code===expected;
await check("0/1/5/6 open events and page total",async()=>{
  for(const n of [0,1,5,6]){const f=new FakeSanity();f.docs.delete("event");for(let i=0;i<n;i++)f.docs.set(`e${i}`,{...event,_id:`e${i}`});const result=await service(f).list({limit:5});assert.equal(result.totalOpen,n);assert.equal(result.items.length,Math.min(n,5));assert.equal(!!result.nextCursor,n>5);}
});
await check("stable pagination, name search and inclusive competition overlap",async()=>{const f=new FakeSanity();for(const id of ["a","b"])f.docs.set(id,{...event,_id:id});const first=await service(f).list({limit:1,q:"ประกวด",from:"2026-10-18",to:"2026-10-18"});assert.equal(first.items[0].id,"a");assert.equal((await service(f).list({limit:1,cursor:first.nextCursor})).items[0].id,"b");});
await check("Bangkok deadline inclusive across UTC boundary",()=>{assert.equal(getCompetitionPolicy(event,new Date("2026-10-16T16:59:59Z")).publicRegistration,"open");assert.equal(getCompetitionPolicy(event,new Date("2026-10-16T17:00:00Z")).publicRegistration,"closed-date");});
await check("draft, manual, ended and invalid dates excluded",async()=>{const f=new FakeSanity();for(const patch of [{competitionState:"draft"},{registrationActive:false},{endAt:"2026-10-01"},{registrationDeadline:"bad"}]){f.docs.set("event",{...event,...patch});assert.equal((await service(f).list()).totalOpen,0);}});
await check("legacy policy fallback and distinct age cutoff",()=>{const {competitionState,...legacy}=event;delete legacy.registrationDeadline;assert.equal(getCompetitionPolicy(legacy,now).publicRegistration,"open");assert.equal(calculateCompetitionAge("2025-10-16","2026-10-17"),13);});
await check("leap birth and month ceiling",()=>{assert.equal(calculateCompetitionAge("2024-02-29","2025-02-28"),12);assert.equal(calculateCompetitionAge("2025-01-31","2025-02-01"),1);});
await check("Royal albino one-day adjustment, black/normal unchanged",()=>{const e={...event,buffaloAgeDeadline:"2026-10-16",eventType:"royal"};assert.equal(calculateRegistrationAge(e,"2025-10-16","albino"),13);assert.equal(calculateRegistrationAge(e,"2025-10-16","black"),12);});
await check("special structured class eligibility",()=>{const label=encodeCompetitionClass({name:"special",kind:"special",minMonths:12,maxMonths:15,minInclusive:false,group:"",criteria:""});assert.equal(isCompetitionClassEligible(12,label),false);assert.equal(isCompetitionClassEligible(13,label),true);});
await check("source-compatible ID/hash ignores tokens/images only",()=>{const payload=sourcePayload("event","line",royal,true);const identity=registrationIdentity({eventId:"event",userId:"line",operationId:normal.operationId},payload);assert.equal(identity.id,"competition-registration."+createHash("sha256").update(`event:line:${normal.operationId}`).digest("hex"));assert.equal(identity.hash,registrationIdentity({eventId:"event",userId:"line",operationId:normal.operationId},{...payload,idToken:"not-persisted",imageIds:["replacement"]}).hash);assert.notEqual(identity.hash,registrationIdentity({eventId:"event",userId:"line",operationId:normal.operationId},{...payload,buffaloAge:98}).hash);assert.equal(payload.birthdate,payload.birthday);assert.ok(!("agreements"in payload));});
await check("normal persist recomputes age, normalized class and count",async()=>{const f=new FakeSanity(),result=await service(f).submit("event","line",normal);assert.equal(f.docs.get(result.id).buffaloAge,13);assert.equal(f.docs.get("event").competitionRegistrationCount,1);assert.equal(f.docs.get(result.id).user._ref,"line");});
await check("exact replay succeeds after closure/type edit without another write",async()=>{const f=new FakeSanity(),s=service(f),a=await s.submit("event","line",normal);Object.assign(f.docs.get("event"),{competitionState:"closed",eventType:"royal"});const b=await s.submit("event","line",normal);assert.equal(a.id,b.id);assert.equal(b.replayed,true);assert.equal(f.commits,1);});
await check("changed payload operation conflicts",async()=>{const f=new FakeSanity(),s=service(f);await s.submit("event","line",normal);await assert.rejects(()=>s.submit("event","line",{...normal,name:"changed"}),code("OPERATION_CONFLICT"));});
await check("concurrent operation produces one graph/count",async()=>{const f=new FakeSanity(),s=service(f);const results=await Promise.all([s.submit("event","line",normal),s.submit("event","line",normal)]);assert.equal(results.filter(x=>!x.replayed).length,1);assert.equal(f.docs.get("event").competitionRegistrationCount,1);});
await check("forged age does not override class validation",async()=>{const f=new FakeSanity();await assert.rejects(()=>service(f).submit("event","line",{...normal,buffaloAge:1,type:"ไม่เกิน 12 เดือน"}),code("INVALID_CLASS"));assert.equal(f.commits,0);});
await check("strong catalog replaces stale permissive discovery",async()=>{const f=new FakeSanity();f.docs.get("catalog").data=["ไม่เกิน 12 เดือน"];await assert.rejects(()=>service(f).submit("event","line",normal),code("INVALID_CLASS"));});
await check("event close/catalog revision race aborts",async()=>{const f=new FakeSanity();f.beforeCommit=()=>{Object.assign(f.docs.get("event"),{_rev:"closed-rev",registrationActive:false});};await assert.rejects(()=>service(f).submit("event","line",normal),code("EVENT_REVISION_CONFLICT"));assert.equal(f.docs.get("event").competitionRegistrationCount,0);});
await check("normal cannot bypass Royal form",async()=>{const f=new FakeSanity(true);await assert.rejects(()=>service(f).submit("event","line",normal),code("INVALID_FIELDS"));assert.equal(f.commits,0);});
await check("Royal atomically creates four deterministic documents",async()=>{const f=new FakeSanity(true),result=await service(f).submit("event","line",royal);for(const suffix of ["",".images",".approval",".address"])assert.ok(f.docs.has(result.id+suffix));assert.equal(f.docs.get("event").competitionRegistrationCount,1);assert.equal(f.docs.get(result.id+".images").imageArray.length,5);assert.equal(f.docs.get(result.id+".approval").approvementResult,undefined);});
await check("Royal foreign and duplicate assets rejected",async()=>{for(const duplicate of [true,false]){const f=new FakeSanity(true);if(!duplicate)f.docs.get(assetIds[0]).source.id="foreign";await assert.rejects(()=>service(f).submit("event","line",{...royal,imageIds:duplicate?Array(5).fill(assetIds[0]):assetIds}),code("INVALID_ASSET_OWNERSHIP"));assert.equal(f.commits,0);}});
await check("failed Royal transaction leaves no partial graph/count",async()=>{const f=new FakeSanity(true);f.failCommit=true;const before=[...f.docs.keys()];await assert.rejects(()=>service(f).submit("event","line",royal));assert.deepEqual([...f.docs.keys()],before);assert.equal(f.docs.get("event").competitionRegistrationCount,0);});
await check("upload oversize and actual byte-format rejection",async()=>{const f=new FakeSanity(true),s=service(f);await assert.rejects(()=>s.upload("event","line",Buffer.alloc(4*1024*1024+1)),code("IMAGE_TOO_LARGE"));await assert.rejects(()=>s.upload("event","line",Buffer.from("fake-jpeg")),code("UNSUPPORTED_IMAGE"));assert.equal(f.assetUploads,0);});
await check("history includes ended own events and preserves false rejection",async()=>{const f=new FakeSanity(true),s=service(f),result=await s.submit("event","line",royal);f.docs.get("event").endAt="2025-01-01";f.docs.get(result.id+".approval").approvementResult=false;assert.equal((await s.history("line")).items[0].status,"rejected");assert.equal((await s.history("foreign")).items.length,0);});
await check("guessed foreign registration denied",async()=>{const f=new FakeSanity(),s=service(f),result=await s.submit("event","line",normal);await assert.rejects(()=>s.registration(result.id,"foreign"),code("REGISTRATION_NOT_FOUND"));});
await check("member enrollment preserves existing ADMIN and rejects role escalation",async()=>{const f=new FakeSanity();f.docs.get("line").role="ADMIN";const s=service(f);assert.equal((await s.enroll("line",{firstName:"f",lastName:"l",tel:"000"})).member.role,"ADMIN");await assert.rejects(()=>s.enroll("line",{firstName:"f",lastName:"l",tel:"000",role:"ADMIN"}),code("INVALID_FIELDS"));});
await check("ambiguous legacy members refused",async()=>{const f=new FakeSanity();f.docs.set("legacy",{_id:"legacy",_type:"user",lineId:"line"});await assert.rejects(()=>service(f).member("line"),code("MEMBER_AMBIGUOUS"));});
await check("invalid/injection fields and false agreements rejected",async()=>{const f=new FakeSanity();await assert.rejects(()=>service(f).list({from:'2026-10-99'}),code("INVALID_FIELDS"));await assert.rejects(()=>service(f).submit("event","line",{...normal,userId:"foreign"}),code("INVALID_FIELDS"));await assert.rejects(()=>service(f).submit("event","line",{...normal,agreements:{...normal.agreements,accept4:false}}),code("INVALID_FIELDS"));});
await check("current identity guard rejects absent/reviewer/deleted/unlinked/stale identities",async()=>{const env={JAOTHUI_LINE_LOGIN_CHANNEL_ID:"2003013735"},db={account:{findUnique:async()=>({_id:"unused",id:"a",status:"ACTIVE",identities:[{provider:"line",providerUserId:"current"}]})}},session={accountId:"a",primaryProvider:"apple",providerUserId:"apple",lineUserId:"stale"};assert.equal((await requireEventCustomer(session,db,env)).lineId,"current");await assert.rejects(()=>requireEventCustomer(null,db,env),code("UNAUTHENTICATED"));await assert.rejects(()=>requireEventCustomer({...session,primaryProvider:"reviewer"},db,env),code("CUSTOMER_REQUIRED"));db.account.findUnique=async()=>({id:"a",status:"DELETED",identities:[]});await assert.rejects(()=>requireEventCustomer(session,db,env),code("ACCOUNT_NOT_ACTIVE"));db.account.findUnique=async()=>({id:"a",status:"ACTIVE",identities:[]});await assert.rejects(()=>requireEventCustomer(session,db,env),code("LINE_LINK_REQUIRED"));});
await check("writes disabled and no public/editorial credential fallback",()=>{const env={JAOTHUI_MOBILE_EVENTS_ENABLED:"true",JAOTHUI_EVENT_SANITY_PROJECT_ID:"q38mtihr",JAOTHUI_EVENT_SANITY_DATASET:"dev",NEXT_PUBLIC_SANITY_TOKEN:"unsafe"};assert.throws(()=>eventConfig(env,true),code("EVENT_WRITE_NOT_CONFIGURED"));env.JAOTHUI_MOBILE_EVENT_WRITES_ENABLED="true";assert.throws(()=>eventConfig(env,true),code("EVENT_WRITE_NOT_CONFIGURED"));});
function response(){return {statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;},end(){return this;}};}
await check("actual private HTTP route: missing bearer401, reviewer/wallet403",async()=>{process.env.JAOTHUI_MOBILE_AUTH_SECRET="unit-only";for(const [token,expected]of [[null,401],[createMobileAccountSession({accountId:"a",primaryProvider:"reviewer",providerUserId:"r"}).token,403],[createMobileSession({walletAddress:"0xfixture"}).token,403]]){const res=response();await eventHandler("history")({method:"GET",query:{},headers:token?{authorization:`Bearer ${token}`}:{},body:{}},res);assert.equal(res.statusCode,expected);}});
await check("actual HTTP failure mapping: upstream credential401/DB capacity become503",()=>{for(const error of [Object.assign(new Error("sanity unauthorized"),{statusCode:401}),Object.assign(new Error("capacity"),{code:"P2024"})]){const res=response();eventFailure({headers:{}},res,error);assert.equal(res.statusCode,503);assert.equal(res.body.error.code,"SERVICE_UNAVAILABLE");}const res=response();eventFailure({headers:{}},res,new InvalidAuthError("expired intent"));assert.equal(res.statusCode,409);});
await check("JWT corruption401 differs from intent conflict409 and public method405",async()=>{assert.throws(()=>customerSession({headers:{authorization:"Bearer invalid"}}),code("INVALID_SESSION"));const res=response();await eventHandler("list")({method:"POST",headers:{},query:{}},res);assert.equal(res.statusCode,405);});
await check("whitespace/source DTO serializer parity for normal and Royal",()=>{
  const common={...normal,name:"  spaced name  ",ownerName:" owner ",farmName:" farm "};
  for(const isRoyal of [false,true]){
    const input=isRoyal?{...royal,...common,agreements:royal.agreements,address:" street "}:common;
    const expected={operationId:input.operationId,userId:"line",eventId:"event",type:input.type,name:input.name,level:input.level,sex:input.sex,color:input.color,birthday:input.birthdate,microchip:input.microchip,ownerName:input.ownerName,ownerTel:input.ownerTel,buffaloAge:input.buffaloAge,fatherName:input.fatherName,motherName:input.motherName,farmName:input.farmName,province:input.province};
    if(isRoyal)Object.assign(expected,{birthdate:input.birthdate,address:input.address,amphoe:input.amphoe,district:input.district,zipcode:input.zipcode,imageIds:input.imageIds});
    const pinnedExcluded=["idToken","lineAccessToken","imageIds","buffaloImage","buffaloImage2","frontImage","sideImage","backImage"];
    const pinnedHash=createHash("sha256").update(JSON.stringify(expected,Object.keys(expected).filter(key=>!pinnedExcluded.includes(key)).sort())).digest("hex");
    const payload=sourcePayload("event","line",input,isRoyal);assert.equal(payload.name,"  spaced name  ");assert.equal(registrationIdentity({eventId:"event",userId:"line",operationId:input.operationId},payload).hash,pinnedHash);
  }
});
await check("deduplicated identical image refuses foreign/unowned asset without upload",async()=>{
  const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==","base64"),id=applicantImageIdentity(png).id;
  for(const source of [undefined,{id:"competition:another:owner"}]){const f=new FakeSanity(true);f.docs.set(id,{_id:id,_type:"sanity.imageAsset",source});await assert.rejects(()=>service(f).upload("event","line",png),code("INVALID_ASSET_OWNERSHIP"));assert.equal(f.assetUploads,0);}
  const f=new FakeSanity(true);f.docs.set(id,{_id:id,_type:"sanity.imageAsset",source:{id:"competition:event:line"}});assert.equal((await service(f).upload("event","line",png)).assetId,id);assert.equal(f.assetUploads,0);
});
await check("draft registration detail is never exposed",async()=>{const f=new FakeSanity();f.docs.set("drafts.hidden",{_id:"drafts.hidden",_type:"eventRegister",user:{_ref:"line"},event:{_ref:"event"}});await assert.rejects(()=>service(f).registration("drafts.hidden","line"),code("REGISTRATION_NOT_FOUND"));});
await check("new asset assignment preserves non-ID metadata and verifies strong owner",async()=>{
 const bytes=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==","base64"),id=applicantImageIdentity(bytes).id,f=new FakeSanity(true);f.uploadSource={name:"existing source label",url:"https://example.test"};await service(f).upload("event","line",bytes);assert.equal(f.docs.get(id).source.id,"competition:event:line");assert.equal(f.docs.get(id).source.url,"https://example.test");
 const noOp=new FakeSanity(true);noOp.assetPatchNoOp=true;await assert.rejects(()=>service(noOp).upload("event","line",bytes),code("INVALID_ASSET_OWNERSHIP"));
});
await check("concurrent different asset owner wins without being overwritten",async()=>{
 const bytes=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==","base64"),id=applicantImageIdentity(bytes).id,f=new FakeSanity(true);f.beforeAssetPatch=()=>{Object.assign(f.docs.get(id),{_rev:"concurrent",source:{id:"competition:foreign:owner"}});};await assert.rejects(()=>service(f).upload("event","line",bytes),code("INVALID_ASSET_OWNERSHIP"));assert.equal(f.docs.get(id).source.id,"competition:foreign:owner");
});
await check("authenticated read config remains available with writes disabled",()=>{const env={JAOTHUI_MOBILE_EVENTS_ENABLED:"true",JAOTHUI_EVENT_SANITY_PROJECT_ID:"q38mtihr",JAOTHUI_EVENT_SANITY_DATASET:"dev",JAOTHUI_EVENT_SANITY_WRITE_TOKEN:"server-only-read",JAOTHUI_MOBILE_EVENT_WRITES_ENABLED:"false"};assert.equal(eventConfig(env,false).token,"server-only-read");assert.throws(()=>eventConfig(env,true),code("EVENT_WRITE_NOT_CONFIGURED"));});
await check("Royal source ninth agreement is required and must be positive",()=>{for(const value of [undefined,false]){const agreements={...royal.agreements,accept9:value};assert.throws(()=>sourcePayload("event","line",{...royal,agreements},true),code("INVALID_FIELDS"));}assert.equal(Object.keys(royal.agreements).length,12);});
await check("same JPEG across events creates independent ownership; retry deduplicates",async()=>{
 const bytes=Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAHAA0DASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDBooor504z/9k=","base64"),originalId=applicantImageIdentity(bytes).id,originalHash=createHash("sha256").update(bytes).digest("hex"),f=new FakeSanity(true),s=service(f);
 f.docs.set("event2",{...event,_id:"event2",eventType:"royal"});const original={_id:originalId,_type:"sanity.imageAsset",_rev:"legacy-asset",source:{id:"competition:legacy:other"}};f.docs.set(originalId,structuredClone(original));
 const a=await s.upload("event","line",bytes),retry=await s.upload("event","line",bytes),b=await s.upload("event2","line",bytes);
 assert.equal(a.assetId,retry.assetId);assert.notEqual(a.assetId,b.assetId);assert.notEqual(a.assetId,originalId);assert.equal(f.assetUploads,2);assert.equal(f.docs.get(a.assetId).source.id,"competition:event:line");assert.equal(f.docs.get(b.assetId).source.id,"competition:event2:line");assert.deepEqual(f.docs.get(originalId),original);assert.equal(createHash("sha256").update(bytes).digest("hex"),originalHash);
 assert.equal(applicantImageIdentity(scopedApplicantImage(bytes,"competition:event:line").bytes).id,a.assetId);
 const maximum=Buffer.concat([bytes,Buffer.alloc(4*1024*1024-bytes.length)]);assert.ok(scopedApplicantImage(maximum,"competition:event:line").bytes.length>maximum.length);assert.throws(()=>scopedApplicantImage(Buffer.alloc(4*1024*1024+1),"owner"),code("IMAGE_TOO_LARGE"));
});
console.log(`Mobile events contract PASS ${count} cases`);
