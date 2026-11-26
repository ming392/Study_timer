'use strict';
const inputDate = t => C.dayKey(t)+'T'+C.time(t)+':'+C.pad(new Date(t).getSeconds());
function syncDraft() {
    const start = $('start'), end = $('end');
    if (!start) return;
    const a = +new Date(start.value), b = +new Date(end.value);
    if (a !== Math.floor(draft.start/1000)*1000) draft.start=a;
    if (b !== Math.floor(draft.end/1000)*1000) draft.end=b;
    draft.note=$('note').value;
}
function check() {
    syncDraft();
    const error=C.validate(draft,state.logs,state.active);
    $('error').textContent=error;
    $('save').disabled=!!error;
    $('end').closest('.field').classList.toggle('invalid',!!error);
    $('duration').textContent=Number.isFinite(draft.end-draft.start) ? C.clock(draft.end-draft.start) : '—';
    return !error;
}
function editor() {
    app.innerHTML = header('로그 편집') + `
        <span class="section-label">기록 유형</span>
        ${segment(draft.type)}
        <span class="section-label">측정 시간</span>
        <div class="duration" id="duration">${C.clock(draft.end-draft.start)}</div>
        <div class="field"><label for="start">시작</label><input id="start" type="datetime-local" step="1" value="${inputDate(draft.start)}"></div>
        <div class="field"><label for="end">종료</label><input id="end" type="datetime-local" step="1" value="${inputDate(draft.end)}"></div>
        <div class="error" id="error" role="alert"></div>
        <div class="field memo"><label for="note">세부 기록</label><textarea id="note" placeholder="세부 사항을 기록해 주세요">${esc(draft.note)}</textarea></div>
        <button class="primary" id="save">저장</button>
        <button class="delete-log" id="delete-log">로그 삭제</button>`;
    ['start','end','note'].forEach(id => $(id).addEventListener('input',check));
    $('save').onclick = () => {
        if (!check()) return;
        if (persist({...state,logs:state.logs.map(log => log.id === draft.id ? {...draft} : log)})) {
            selected=C.dayKey(draft.start); page='day'; render();
        }
    };
    $('delete-log').onclick=confirmDelete;
    check();
}
function confirmDelete() {
    const id=draft.id, dialog=document.createElement('dialog');
    dialog.id='delete-dialog';
    dialog.setAttribute('aria-labelledby','delete-title');
    dialog.innerHTML=`<h2 id="delete-title">이 로그를 삭제할까요?</h2><p>삭제한 기록은 되돌릴 수 없어요.</p><div class="dialog-actions"><button id="cancel-delete" autofocus>취소</button><button id="confirm-delete">삭제</button></div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('close',()=>dialog.remove());
    dialog.querySelector('#cancel-delete').onclick=()=>dialog.close();
    dialog.querySelector('#confirm-delete').onclick=()=>{
        if (persist(C.removeLog(state,id))) { dialog.close(); draft=null; page='day'; render(); }
    };
    dialog.showModal();
}
