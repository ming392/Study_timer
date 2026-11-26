//시간 계산 및 데이터 가공 알고리즘



(function(root){
 'use strict';
 const pad=n=>String(n).padStart(2,'0');
 const dayKey=t=>{const d=new Date(t);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
 const time=t=>{const d=new Date(t);return `${pad(d.getHours())}:${pad(d.getMinutes())}`;};
 const overlaps=(a,b)=>a.start<b.end && b.start<a.end;
 const MIN_DURATION=2000;
 const isTooShort=ms=>ms>=0 && ms<MIN_DURATION;
 function finish(state,now){
   if(!state.active)return {state,discarded:false};
   if(now<state.active.start)throw new Error('clock');
   const discarded=isTooShort(now-state.active.start);
   return {discarded,state:{...state,active:null,logs:discarded?state.logs:[...state.logs,{...state.active,end:now,note:''}]}};
 }
 function removeLog(state,id){return {...state,logs:state.logs.filter(log=>log.id!==id)};}
 function conflict(item,logs,active,now=Date.now()) {
   const saved=logs.find(x=>x.id!==item.id && overlaps(item,x));
   if(saved)return saved;
   if(active && overlaps(item,{start:active.start,end:Math.max(now,active.start+1)}))return {...active,end:now,active:true};
   return null;
 }

 //캘린더에서 확인 가능한 날짜별 공부 시간을 계산하는 함수
 function totals(logs,key,type='study') {
   const start=new Date(key+'T00:00:00').getTime();

   const next=new Date(start);
   next.setDate(next.getDate()+1);
   return logs
          .filter(x=>x.type===type)
          .reduce((sum,x)=>sum+Math
          .max(0,Math.min(x.end,+next)-Math.max(x.start,start)),0);
 }


 function onDay(logs,key){
   const start=+new Date(key+'T00:00:00'),end=new Date(start);end.setDate(end.getDate()+1);
   return logs.filter(x=>x.start<+end&&x.end>start).sort((a,b)=>a.start-b.start);
 }
 function duration(ms){
   const sec=Math.floor(Math.max(0,ms)/1000),min=Math.floor(sec/60),h=Math.floor(min/60);
   if(min===0)return `${sec}초`;
   return h ? `${h}시간${min%60?' '+min%60+'분':''}` : `${min}분`;
 }
 function clock(ms){let s=Math.floor(Math.max(0,ms)/1000);return `${pad(Math.floor(s/3600))}:${pad(Math.floor(s/60)%60)}:${pad(s%60)}`;}
 function validate(item,logs,active,now=Date.now()){
    if(!Number.isFinite(item.start)||!Number.isFinite(item.end))return '시작과 종료 시각을 입력해 주세요';
    if(item.end<=item.start)return '종료 시각은 시작 시각보다 늦어야 해요';
    if(isTooShort(item.end-item.start))return '기록은 2초 이상이어야 해요';
    if(item.end>now)return '미래 시각으로 수정할 수 없어요';
    const hit=conflict(item,logs,active,now);
    return hit ? `${hit.active?'측정 중인':'다른'} 로그와 시간이 겹쳐요\n${hit.type==='study'?'공부':'휴식'} ${time(hit.start)} ~ ${hit.active?'측정 중':time(hit.end)}` : '';
 }
 const api={pad,dayKey,time,overlaps,conflict,totals,onDay,duration,clock,validate,MIN_DURATION,isTooShort,finish,removeLog};
 if(typeof module!=='undefined'&&module.exports)module.exports=api; else root.TimerCore=api;
})(typeof window!=='undefined'?window:globalThis);
