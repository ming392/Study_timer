//인터페이스와 이벤트 처리


'use strict';
const C=TimerCore,app=document.getElementById('app');
let nativeSnapshot='';
let state={logs:[],active:null},page='home',type='study',month=new Date(),selected=C.dayKey(Date.now()),draft=null;

try{
    const raw=window.DeviceStore?DeviceStore.read():localStorage.getItem('study-timer');
    nativeSnapshot=raw||'';
    if(raw){
        const parsed=JSON.parse(raw);
        if(Array.isArray(parsed.logs))
            state=parsed;
    }
}
catch(e){
    notice('저장된 기록을 불러오지 못했어요');
}

if(state.active)
    type=state.active.type;

function persist(next){
    try{
        if(window.DeviceStore){
            if(!DeviceStore.write(JSON.stringify(next),nativeSnapshot)){
                refreshFromDevice();
                notice('기록이 변경됐어요. 확인 후 다시 저장해 주세요');
                return false;
            }
            nativeSnapshot=DeviceStore.read();
            state=JSON.parse(nativeSnapshot);
        }
        else{
            localStorage.setItem('study-timer',JSON.stringify(next));
            state=next;
        }
        return true;
    }
    catch(e){
        notice('저장하지 못했어요. 다시 시도해 주세요');
    return false;
    }
}
function refreshFromDevice(){
    if(!window.DeviceStore)return;

    try {
        const raw=DeviceStore.read();
        if(raw===nativeSnapshot)return;

        const next=raw ? JSON.parse(raw) : {logs:[],active:null};
        if(!Array.isArray(next.logs))return;

        const oldType=type;
        nativeSnapshot=raw;
        state=next;
        if(state.active)type=state.active.type;

        if(page==='home'){
            if(type!==oldType)render();
            else updateHome();
        }
        else if(page==='edit'){
            if(state.logs.some(log=>log.id===draft.id))
                check();
            else{
                draft=null;
                page='day';
                render();
            }
        }
        else render();

    }
    catch(e){
        notice('기록을 불러오지 못했어요');
    }
}
window.refreshFromDevice=refreshFromDevice;

function notice(text)
{
    document.querySelectorAll('.notice').forEach(el=>el.remove());

    const el=document.createElement('div');

    el.className='notice';

    el.setAttribute('role','status');

    el.setAttribute('aria-live','polite');

    el.textContent=text;
    document.body.appendChild(el);
    setTimeout(()=>{el.classList.add('leaving');
                    setTimeout(()=>el.remove(),250);
                    },2600);
}
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const label=t=>t==='study'?'공부':'휴식';

function segment(value,locked=false){
    return `<div class="segment ${value==='rest'?'rest':''}" role="group" aria-label="기록 종류">${['study','rest'].map(t=>`<button data-type="${t}" class="${value===t?'selected':''}" aria-pressed="${value===t}" ${locked?'disabled':''}>${label(t)}</button>`).join('')}</div>`;
}
function header(title, home = false, calendarLink = false) {

    const backIcon = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 18L9 12L15 6"/>
        </svg>
    `;

    const logIcon = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="3" width="16" height="18" rx="2"/>
            <path d="M8 8H16 M8 12H16 M8 16H13"/>
        </svg>
    `;

    const calendarIcon = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2"/>
            <path d="M3 10H21 M8 3V7 M16 3V7"/>
        </svg>
    `;

    if (home) {
        return `
            <header>
                <h1>공부 시간</h1>
                <button class="log-link" id="logs"
                        aria-label="로그 보기">
                    ${logIcon}
                </button>
            </header>
        `;
    }

    return `
        <header class="${calendarLink ? 'with-calendar' : ''}">
            <button class="back" id="back"
                    aria-label="뒤로">
                ${backIcon}
            </button>

            <h1>${esc(title)}</h1>

            ${calendarLink ? `
                <button class="log-link" id="calendar-link"
                        aria-label="캘린더">
                    ${calendarIcon}
                </button>
            ` : ''}
        </header>
    `;
}
function render(){
 app.className=page==='edit'?'edit':page+'-page';

 if(page==='home')home();

else if(page==='calendar')calendar();

else if(page==='day')day();
else editor();

 const back=document.getElementById('back');
if(back)back.onclick=goBack;

 const calendarLink=document.getElementById('calendar-link');
if(calendarLink)calendarLink.onclick=()=>{month=new Date(selected+'T00:00:00');page='calendar';render();};

 document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{if(page==='edit'){syncDraft();draft.type=b.dataset.type;}else{type=b.dataset.type;}render();});

}
function updateHome() {

    const home = document.querySelector('.home');
    const active = state.active;

    if (!home) return;

    home.classList.toggle('running', !!active);

    home.querySelectorAll('[data-type]').forEach(button => {
        button.disabled = !!active;
    });

    document.getElementById('clock').textContent =
        C.clock(active ? Date.now() - active.start : 0);

    document.getElementById('measure').textContent =
        active ? '중지' : '시작';

    const started = home.querySelector('.started');

    started.textContent = active
        ? C.time(active.start) + '에 시작'
        : '측정 대기 중';

    home.querySelectorAll('.running-label, .hint')
        .forEach(el => {
            el.setAttribute('aria-hidden', String(!active));
        });

    home.querySelector('.segment')
        .setAttribute('aria-hidden', String(!!active));
}

function home(){const active=state.active;app.innerHTML = header('', true) + `
    <section class="home ${active ? 'running' : ''}">

        ${segment(type, !!active)}

        <div class="running-label"
             aria-hidden="${!active}">

            <span class="badge ${type === 'rest' ? 'rest' : ''}">
                ${label(type)} 중
            </span>

        </div>

        <div class="clock" id="clock">
            ${C.clock(active ? Date.now() - active.start : 0)}
        </div>

        <div class="started">
            ${active
                ? C.time(active.start) + '에 시작'
                : '측정 대기 중'}
        </div>

        <button class="primary" id="measure">
            ${active ? '중지' : '시작'}
        </button>

        <p class="hint" aria-hidden="${!active}">
            중지하면 로그에 자동 저장돼요
        </p>

    </section>
`;

app.querySelector('.segment')
    .setAttribute('aria-hidden', String(!!active));
 document.getElementById('logs').onclick=()=>{selected=C.dayKey(Date.now());page='day';render();};
 document.getElementById('measure').onclick=()=>{if(window.DeviceStore){const active=state.active;const message=DeviceStore.act(active?'stop':type,state.rev||0,active?active.id:'');refreshFromDevice();if(message)notice(message);return;}const now=Date.now();if(state.active){if(now<state.active.start){notice('기기 시간을 확인해 주세요');return;}const result=C.finish(state,now);if(persist(result.state)){updateHome();if(result.discarded)notice('시간이 너무 짧아 기록하지 않았어요');}}else{if(persist({...state,active:{id:now+'-'+Math.random().toString(36).slice(2),type,start:now}}))updateHome();}};
}


function calendar() {

    const y = month.getFullYear();
    const m = month.getMonth();

    const first = new Date(y, m, 1).getDay();
    const count = new Date(y, m + 1, 0).getDate();
    const today = C.dayKey(Date.now());

    let cells = ['일', '월', '화', '수', '목', '금', '토']
        .map(x => `<div class="weekday">${x}</div>`)
        .join('');

    cells += '<div></div>'.repeat(first);

    for (let n = 1; n <= count; n++) {

        const key = C.dayKey(new Date(y, m, n));
        const total = C.totals(state.logs, key);

        cells += `
            <button
                class="day
                    ${key === today ? 'today' : ''}
                    ${key === selected ? 'selected' : ''}"
                data-day="${key}"
                aria-label="${m + 1}월 ${n}일 공부 ${C.duration(total)}">

                <span>${n}</span>

                <span class="total">
                    ${total ? C.duration(total) : ''}
                </span>

            </button>
        `.replace(/(<span class="total">)\s*(.*?)\s*(<\/span>)/gs,
                   '$1$2$3');
    }

    const rows = Math.ceil((first + count) / 7);

    app.innerHTML = header('공부 기록') + `
        <div class="month">

            <button id="prev" aria-label="이전 달">‹</button>

            <span>${y}년 ${m + 1}월</span>

            <button id="next" aria-label="다음 달">›</button>

        </div>

        <div class="calendar"
             style="grid-template-rows: 30px repeat(${rows}, minmax(0, 1fr))">

            ${cells}

        </div>

        <p class="hint calendar-foot">
            날짜 아래에는 총 공부 시간이 표시돼요
        </p>
    `;

    document.getElementById('prev').onclick = () => {
        month = new Date(y, m - 1, 1);
        render();
    };

    document.getElementById('next').onclick = () => {
        month = new Date(y, m + 1, 1);
        render();
    };

    document.querySelectorAll('[data-day]').forEach(button => {
        button.onclick = () => {
            selected = button.dataset.day;
            page = 'day';
            render();
        };
    });
}


function range(log){
    return C.dayKey(log.start)===C.dayKey(log.end)?`${C.time(log.start)} ~ ${C.time(log.end)}`:`${C.dayKey(log.start).slice(5).replace('-','/')} ${C.time(log.start)} ~ ${C.dayKey(log.end).slice(5).replace('-','/')} ${C.time(log.end)}`;}
f
function day() {

    const d = new Date(selected + 'T00:00:00');
    const logs = C.onDay(state.logs, selected);

    const weekdays = [
        '일', '월', '화', '수', '목', '금', '토'
    ];

    const title =
        `${d.getMonth() + 1}월 ${d.getDate()}일 ` +
        `${weekdays[d.getDay()]}요일`;

    const studyTotal = C.totals(state.logs, selected);
    const restTotal = C.totals(state.logs, selected, 'rest');

    app.innerHTML = header(title, false, true) + `

        <div class="summary">

            <span class="summary-label">
                총 공부 시간
            </span>

            <strong>${C.clock(studyTotal)}</strong>

            <small>휴식 ${C.clock(restTotal)}</small>

        </div>

        <div class="cards">

            ${logs.map(l => `
                <button class="card" data-log="${esc(l.id)}">

                    <span class="badge ${l.type === 'rest' ? 'rest' : ''}">
                        ${label(l.type)}
                    </span>

                    <div class="details">

                        <strong>
                            ${C.clock(l.end - l.start)}
                        </strong>

                        <div class="range">
                            ${range(l)}
                        </div>

                        ${l.note ? `
                            <div class="note">${esc(l.note)}</div>
                        ` : ''}

                    </div>

                    <span class="chevron">›</span>

                </button>
            `).join('')}

        </div>

        ${logs.length
            ? '<p class="hint">로그를 누르면 시간과 메모를 수정할 수 있어요</p>'
            : '<div class="empty">아직 기록이 없어요</div>'
        }
    `;

    document.querySelectorAll('[data-log]').forEach(button => {

        button.onclick = () => {

            draft = {
                ...state.logs.find(l => l.id === button.dataset.log)
            };

            page = 'edit';
            render();
        };
    });
}

const inputDate=t=>C.dayKey(t)+'T'+C.time(t)+':'+C.pad(new Date(t).getSeconds());
function syncDraft(){const start=document.getElementById('start'),end=document.getElementById('end');if(start){const a=+new Date(start.value),b=+new Date(end.value);if(a!==Math.floor(draft.start/1000)*1000)draft.start=a;if(b!==Math.floor(draft.end/1000)*1000)draft.end=b;draft.note=document.getElementById('note').value;}}
function check(){syncDraft();const error=C.validate(draft,state.logs,state.active);document.getElementById('error').textContent=error;document.getElementById('save').disabled=!!error;document.getElementById('end').closest('.field').classList.toggle('invalid',!!error);document.getElementById('duration').textContent=Number.isFinite(draft.end-draft.start)?C.duration(draft.end-draft.start):'—';return !error;}
function editor(){app.innerHTML=header('로그 편집')+segment(draft.type)+`<div class="duration" id="duration">${C.duration(draft.end-draft.start)}</div><div class="field"><label for="start">시작</label><input id="start" type="datetime-local" step="1" value="${inputDate(draft.start)}"></div><div class="field"><label for="end">종료</label><input id="end" type="datetime-local" step="1" value="${inputDate(draft.end)}"></div><div class="error" id="error" role="alert"></div><div class="field memo"><label for="note">세부 기록</label><textarea id="note" placeholder="세부 사항을 기록해 주세요">${esc(draft.note)}</textarea></div><button class="primary" id="save">저장</button><button class="delete-log" id="delete-log">로그 삭제</button>`;['start','end','note'].forEach(id=>document.getElementById(id).addEventListener('input',check));document.getElementById('save').onclick=()=>{if(!check())return;if(persist({...state,logs:state.logs.map(l=>l.id===draft.id?{...draft}:l)})){selected=C.dayKey(draft.start);page='day';render();}};document.getElementById("delete-log").onclick=confirmDelete;check();}
function goBack(){const modal=document.getElementById('delete-dialog');if(modal){modal.close();modal.remove();return true;}if(page==='home')return false;page=(page==='edit'||page==='calendar')?'day':'home';draft=null;render();return true;}
window.goBack=goBack;
function confirmDelete(){
 const id=draft.id,dialog=document.createElement('dialog');
 dialog.id='delete-dialog';
 dialog.setAttribute('aria-labelledby','delete-title');
 dialog.innerHTML='<h2 id="delete-title">이 로그를 삭제할까요?</h2><p>삭제한 기록은 되돌릴 수 없어요.</p><div class="dialog-actions"><button id="cancel-delete" autofocus>취소</button><button id="confirm-delete">삭제</button></div>';
 document.body.appendChild(dialog);
 dialog.addEventListener('close',()=>dialog.remove());
 dialog.querySelector('#cancel-delete').onclick=()=>dialog.close();
 dialog.querySelector('#confirm-delete').onclick=()=>{if(persist(C.removeLog(state,id))){dialog.close();draft=null;page='day';render();}};
 dialog.showModal();
}
function ripple(button,x,y){
 if(!button||button.disabled)return;
 const rect=button.getBoundingClientRect(),size=2*Math.hypot(rect.width,rect.height),wave=document.createElement('span');
 wave.className='ripple';wave.setAttribute('aria-hidden','true');
 wave.style.width=wave.style.height=size+'px';
 wave.style.left=(x-rect.left-size/2)+'px';wave.style.top=(y-rect.top-size/2)+'px';
 button.appendChild(wave);setTimeout(()=>wave.remove(),650);
}
document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(b)ripple(b,e.clientX,e.clientY);},{passive:true});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat){const b=e.target.closest('button');if(b){const r=b.getBoundingClientRect();ripple(b,r.left+r.width/2,r.top+r.height/2);}}});
setInterval(()=>{const clock=document.getElementById('clock');if(clock&&state.active)clock.textContent=C.clock(Date.now()-state.active.start);},250);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshFromDevice();if(page==='home')updateHome();}});
render();
