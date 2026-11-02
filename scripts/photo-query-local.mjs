import assert from "node:assert/strict";
import { prisma } from "../server/prisma.ts";
import { queryPublishedPhotos } from "../server/photos/batch-service.ts";
import { PrismaClient } from "@prisma/client";
import handler from "../pages/api/mobile/v1/buffalos/photos.ts";
const endpoint = new URL(process.env.DATABASE_URL ?? "http://invalid");
if (endpoint.hostname!=="127.0.0.1" || endpoint.port!=="55439" || endpoint.pathname!=="/jaothui_photo_test") throw new Error("ISOLATED_PHOTO_DB_REQUIRED");
try {
  await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "Pedigree" ("microchip" text PRIMARY KEY, "tokenId" bigint NOT NULL, "image" text, "updatedAt" text NOT NULL)');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Pedigree"');
  const base="https://wtnqjxerhmdnqszkhbvs.supabase.co/storage/v1/object/public/slipstorage/buffalo/";
  await prisma.$executeRaw`INSERT INTO "Pedigree" VALUES ('123',71,${base+'71.jpg'},'1'),('124',72,${base+'72.jpg'},'1'),('125',72,${base+'72.jpg'},'2'),('126',9007199254740993,${base+'9007199254740993.jpg'},'3')`;
  const rows=await queryPublishedPhotos({tokenIds:["71","72","73","9007199254740993"]});
  assert.equal(rows.length,4); assert.equal(rows.find(r=>r.tokenId==="72").reason,"ambiguous");
  assert.equal(rows.find(r=>r.tokenId==="73").reason,"missing");
  assert.match(rows.find(r=>r.tokenId==="9007199254740993").imageUrl,/9007199254740993.jpg/);
  const chips=await queryPublishedPhotos({microchips:["124","125","999"]});
  assert.equal(chips[0].microchip,"124"); assert.equal(chips[0].tokenId,"72"); assert.equal(chips[1].microchip,"125");
  assert.equal(chips[2].status,"unavailable");
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;}};
  await handler({method:"POST",body:{tokenIds:["71","72","9007199254740993"]},headers:{}},res);
  assert.equal(res.statusCode,200); assert.match(res.headers["Cache-Control"],/no-store/);
  assert.equal(res.body.data.photos.find(r=>r.tokenId==="9007199254740993").status,"ready");
  assert.equal(res.body.data.photos.find(r=>r.tokenId==="72").reason,"ambiguous");
  assert.doesNotMatch(JSON.stringify(res.body),/wallet|owner|BuffaloOperation|password|secret/);
  // Hold a disposable table lock from a separate test-only connection. The real
  // service's SET LOCAL timeout must cancel its blocked SELECT, not just race it.
  const blocker=new PrismaClient();
  let unlock, locked;
  const ready=new Promise(resolve=>locked=resolve);
  const holding=blocker.$transaction(async tx=>{
    await tx.$executeRawUnsafe('LOCK TABLE "Pedigree" IN ACCESS EXCLUSIVE MODE');
    locked(); await new Promise(resolve=>unlock=resolve);
  },{timeout:8000});
  try {
    await ready; const started=Date.now();
    await assert.rejects(queryPublishedPhotos({tokenIds:["71"]}),/timeout|canceling statement/i);
    assert(Date.now()-started<4500,"database cancellation remains bounded");
  } finally { unlock?.(); await holding; await blocker.$disconnect(); }
  assert.equal((await queryPublishedPhotos({tokenIds:["71"]}))[0].status,"ready","pool recovers after cancellation");
  console.log("PHOTO_QUERY_LOCAL_OK real Postgres grouped duplicate rejection, missing, BigInt and exact unique microchip recovery; synthetic loopback DB only");
} finally { await prisma.$disconnect(); }
