import assert from "node:assert/strict";
import { mock } from "bun:test";
import { resolvePublishedPhoto } from "../server/photos/source-contract.ts";
const root = (path) => new URL(`../${path}`, import.meta.url).pathname;
const operation = 'https://wtnqjxerhmdnqszkhbvs.supabase.co/storage/v1/object/public/slipstorage/operations/'+'a'.repeat(64)+'/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/source.jpg';
const rows=[{tokenId:71n,microchip:'123',image:'https://wtnqjxerhmdnqszkhbvs.supabase.co/storage/v1/object/public/slipstorage/buffalo/71',updatedAt:'1'},
  {tokenId:9007199254740993n,microchip:'124',image:operation,updatedAt:'1792520000000'}].map(row=>({
  name:'Synthetic',origin:'thai',color:'black',detail:'Fixture',sex:'male',birthday:new Date('2020-01-01'),height:150,
  certNo:null,rarity:'Normal',dna:'N/A',fatherId:null,motherId:null,createdAt:'1700000000',...row,
}));
mock.module(root('server/prisma.ts'),()=>({prisma:{pedigree:{findMany:async()=>rows,findUnique:async({where})=>rows.find(row=>row.microchip===where.microchip),count:async()=>rows.length},
  user:{findUnique:async()=>({id:1,wallet:'synthetic',avatar:'fixture'})},$transaction:async values=>Promise.all(values)}}));
mock.module(root('server/services/certificate.service.ts'),()=>({isCertificateActivated:async()=>null}));
mock.module(root('server/services/nft-pedigree.service.ts'),()=>({getTokenOfOwnerAll:async()=>rows.map(row=>row.tokenId)}));
mock.module(root('server/supabase/index.ts'),()=>({getAvatarUrl:()=>'/images/logo.png'}));
const metadata=await import('../server/services/metadata.service.ts');
const {getMemberData}=await import('../server/services/kwaithai.service.ts');
const {toMobileBuffaloCard}=await import('../server/mobile/view-models.ts');
const list=await metadata.getAllMetadata({page:1});
const batch=await metadata.getMetadataBatch(['123','124']);
const search=await metadata.searchByKeyword('Synthetic');
const member=await getMemberData('synthetic',{throwOnError:true});
for (const row of rows) {
  const expected=resolvePublishedPhoto({...row,tokenId:row.tokenId.toString()});
  const detail=await metadata.getMetadataByMicrochip(row.microchip);
  const results=[list.items,batch,search,member.Certificate].map(items=>items.find(item=>item.microchip===row.microchip));
  for (const item of results) {
    assert.equal(item.image,expected.imageUrl); assert.equal(item.photoTokenId,row.tokenId.toString());
    assert.equal(item.photoSourceKey,expected.sourceKey); assert.equal(toMobileBuffaloCard(item).imageUrl,expected.imageUrl);
  }
  assert.equal(detail.imageUri,expected.imageUrl); assert.equal(detail.photoTokenId,row.tokenId.toString());
  assert.equal(toMobileBuffaloCard({...detail,microchip:row.microchip}).imageUrl,expected.imageUrl);
}
console.log('PHOTO_CONSUMER_OK actual list/detail/batch/search/member mapping, exact large ID, and old mobile imageUrl compatibility; mocked infrastructure only');
