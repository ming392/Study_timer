'use strict';
function range(log) {
    if (C.dayKey(log.start) === C.dayKey(log.end)) return `${C.time(log.start)} ~ ${C.time(log.end)}`;
    const short = t => C.dayKey(t).slice(5).replace('-','/') + ' ' + C.time(t);
    return `${short(log.start)} ~ ${short(log.end)}`;
}
function logRow(log) {
    return `<button class="card" data-mode="${log.type}" data-log="${esc(log.id)}">
        <span class="badge">${label(log.type)}</span>
        <strong>${C.clock(log.end-log.start)}</strong>
        <span class="range">${range(log)}</span>
        <span class="chevron">${icon('right')}</span>
        ${log.note ? `<span class="note">${esc(log.note)}</span>` : ''}
    </button>`;
}
function day() {
    const d = new Date(selected+'T00:00:00');
    const logs = C.onDay(state.logs,selected);
    const title = `${d.getMonth()+1}월 ${d.getDate()}일 ${['일','월','화','수','목','금','토'][d.getDay()]}요일`;
    app.innerHTML = header(title,false,true) + `
        <div class="summary">
            <span class="section-label">총 공부 시간</span>
            <strong>${C.clock(C.totals(state.logs,selected))}</strong>
            <small>휴식 ${C.clock(C.totals(state.logs,selected,'rest'))}</small>
        </div>
        ${logs.length ? `<div class="cards">${logs.map(logRow).join('')}</div><p class="hint">로그를 누르면 시간과 메모를 수정할 수 있어요</p>` : '<div class="empty">아직 기록이 없어요</div>'}`;
    document.querySelectorAll('[data-log]').forEach(button => {
        button.onclick = () => {
            draft = {...state.logs.find(log => log.id === button.dataset.log)};
            page='edit'; render();
        };
    });
}
