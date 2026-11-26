'use strict';
function calendar() {
    const y = month.getFullYear(), m = month.getMonth();
    const first = new Date(y,m,1).getDay(), count = new Date(y,m+1,0).getDate();
    const today = C.dayKey(Date.now());
    let cells = ['일','월','화','수','목','금','토'].map(x => `<div class="weekday">${x}</div>`).join('');
    cells += '<div class="blank"></div>'.repeat(first);
    for (let n=1; n<=count; n++) {
        const key = C.dayKey(new Date(y,m,n));
        const total = C.totals(state.logs,key);
        cells += `<button class="day ${key === today ? 'today' : ''} ${key === selected ? 'selected' : ''}" data-day="${key}" aria-label="${m+1}월 ${n}일 공부 ${C.duration(total)}">
            <span>${n}</span><span class="total">${total ? C.duration(total) : ''}</span>
        </button>`;
    }
    const rows = Math.ceil((first+count)/7);
    cells += '<div class="blank"></div>'.repeat(rows*7-first-count);
    app.innerHTML = header('공부 기록') + `
        <div class="month">
            <span>${y}년 ${m+1}월</span>
            ${iconButton('prev','back','이전 달')}
            ${iconButton('next','right','다음 달')}
        </div>
        <div class="calendar" style="grid-template-rows:30px repeat(${rows},minmax(0,1fr))">${cells}</div>
        <p class="hint calendar-foot">날짜 아래에는 총 공부 시간이 표시돼요</p>`;
    $('prev').onclick = () => { month = new Date(y,m-1,1); render(); };
    $('next').onclick = () => { month = new Date(y,m+1,1); render(); };
    document.querySelectorAll('[data-day]').forEach(button => {
        button.onclick = () => { selected=button.dataset.day; page='day'; render(); };
    });
}
