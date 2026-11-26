'use strict';
// Application state, persistence, native bridge and navigation.
const C=TimerCore, app=$('app');
let nativeSnapshot='';
let state={logs:[],active:null};
let page='home', type='study', month=new Date(), selected=C.dayKey(Date.now()), draft=null;

function loadState() {
    try {
        const raw=window.DeviceStore ? DeviceStore.read() : localStorage.getItem('study-timer');
        nativeSnapshot=raw||'';
        if (raw) {
            const parsed=JSON.parse(raw);
            if (Array.isArray(parsed.logs)) state=parsed;
        }
    } catch(e) { notice('저장된 기록을 불러오지 못했어요'); }
    if (state.active) type=state.active.type;
}
function persist(next) {
    try {
        if (window.DeviceStore) {
            if (!DeviceStore.write(JSON.stringify(next),nativeSnapshot)) {
                refreshFromDevice();
                notice('기록이 변경됐어요. 확인 후 다시 저장해 주세요');
                return false;
            }
            nativeSnapshot=DeviceStore.read();
            state=JSON.parse(nativeSnapshot);
        } else {
            localStorage.setItem('study-timer',JSON.stringify(next));
            state=next;
        }
        return true;
    } catch(e) { notice('저장하지 못했어요. 다시 시도해 주세요'); return false; }
}
function refreshFromDevice() {
    if (!window.DeviceStore) return;
    try {
        const raw=DeviceStore.read();
        if (raw === nativeSnapshot) return;
        const next=raw ? JSON.parse(raw) : {logs:[],active:null};
        if (!Array.isArray(next.logs)) return;
        const oldType=type;
        nativeSnapshot=raw; state=next;
        if (state.active) type=state.active.type;
        if (page === 'home') {
            if (type !== oldType) render(); else updateHome();
        } else if (page === 'edit') {
            if (state.logs.some(log=>log.id===draft.id)) check();
            else { draft=null; page='day'; render(); }
        } else render();
    } catch(e) { notice('기록을 불러오지 못했어요'); }
}
window.refreshFromDevice=refreshFromDevice;
function render() {
    app.className=page==='edit' ? 'edit' : page+'-page';
    ({home,calendar,day,edit:editor}[page])();
    if ($('back')) $('back').onclick=goBack;
    if ($('calendar-link')) $('calendar-link').onclick=()=>{ month=new Date(selected+'T00:00:00'); page='calendar'; render(); };
    document.querySelectorAll('[data-type]').forEach(button=>{
        button.onclick=()=>{
            if (page==='edit') { syncDraft(); draft.type=button.dataset.type; }
            else type=button.dataset.type;
            render();
        };
    });
}
function goBack() {
    const modal=$('delete-dialog');
    if (modal) { modal.close(); modal.remove(); return true; }
    if (page==='home') return false;
    page=(page==='edit'||page==='calendar') ? 'day' : 'home';
    draft=null; render(); return true;
}
window.goBack=goBack;
loadState();
bindTouchFeedback();
setInterval(()=>{ if ($('clock') && state.active) $('clock').textContent=C.clock(Date.now()-state.active.start); },250);
document.addEventListener('visibilitychange',()=>{ if (!document.hidden) { refreshFromDevice(); if (page==='home') updateHome(); } });
render();
