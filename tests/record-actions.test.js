const assert=require('node:assert/strict');
const C=require('../assets/core.js');
const start=+new Date('2026-11-24T17:00:00');
const previous={id:'old',type:'study',start:start-3600000,end:start-1800000,note:'keep'};
for(const type of ['study','rest']){
 for(const elapsed of [0,1,999,1000,1001,1999,2000,2001,35000]){
  const original={logs:[previous],active:{id:'new',type,start}};
  const result=C.finish(original,start+elapsed);
  assert.equal(result.discarded,elapsed<2000,`${type} ${elapsed}ms boundary`);
  assert.equal(result.state.active,null);
  assert.equal(result.state.logs.length,elapsed<2000?1:2);
  assert.equal(original.logs.length,1,'Input state remains unchanged until storage succeeds');
  assert.ok(original.active);
  assert.equal(result.state.logs[0].note,'keep');
  if(elapsed>=2000){assert.equal(result.state.logs[1].end,start+elapsed);assert.equal(result.state.logs[1].type,type);}
 }
}
const other={id:'rest',type:'rest',start,end:start+10000,note:'rest'};
const stored={logs:[previous,other],active:{id:'running',type:'study',start:start+10000}};
const removed=C.removeLog(stored,'old');
assert.deepEqual(removed.logs,[other]);
assert.equal(C.totals(removed.logs,'2026-11-24'),0);
assert.equal(C.totals(removed.logs,'2026-11-24','rest'),10000);
assert.equal(removed.active,stored.active,'Deleting a log leaves ongoing measurement intact');
assert.equal(stored.logs.length,2,'Deleting does not mutate the original state before persistence');
assert.deepEqual(JSON.parse(JSON.stringify(removed)),removed,'Deletion survives persistence round trip');
assert.deepEqual(C.removeLog(stored,'missing').logs,stored.logs);
assert.throws(()=>C.finish(stored,start),/clock/);
assert.equal(C.finish({logs:[],active:null},start).discarded,false);
assert.ok(C.validate({id:'tiny',start,end:start+1999},[],null,start+10000));
assert.equal(C.validate({id:'tiny',start,end:start+2000},[],null,start+10000),'');
console.log('Record action tests passed: 0–2 second boundaries for study/rest, deletion, totals, persistence, clock reversal.');
