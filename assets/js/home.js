'use strict';
// Home view: markup, display updates, and home-specific events.
function home() {
    app.innerHTML = header('공부 시간', true) + `
        <section class="home" data-mode="${type}">
            ${segment(type, !!state.active)}
            <div class="running-label"><span class="running-dot"></span>${label(type)} 중</div>
            <div class="clock" id="clock">00:00:00</div>
            <div class="started"></div>
            <button class="primary" id="measure"></button>
            <p class="hint">중지하면 로그에 자동 저장돼요</p>
        </section>`;
    updateHome();
    $('logs').onclick = () => { selected = C.dayKey(Date.now()); page = 'day'; render(); };
    $('measure').onclick = toggleMeasurement;
}
function updateHome() {
    const view = document.querySelector('.home');
    if (!view) return;
    const active = state.active;
    view.classList.toggle('running', !!active);
    view.querySelectorAll('[data-type]').forEach(button => button.disabled = !!active);
    view.querySelector('.segment').setAttribute('aria-hidden', String(!!active));
    view.querySelectorAll('.running-label,.hint').forEach(el => el.setAttribute('aria-hidden', String(!active)));
    $('clock').textContent = C.clock(active ? Date.now() - active.start : 0);
    $('measure').innerHTML = active ? icon('stop') + '중지' : icon('play') + '시작';
    view.querySelector('.started').textContent = active ? C.time(active.start) + '에 시작' : '측정 대기 중';
}
function toggleMeasurement() {
    if (window.DeviceStore) {
        const active = state.active;
        const message = DeviceStore.act(active ? 'stop' : type, state.rev || 0, active ? active.id : '');
        refreshFromDevice();
        if (message) notice(message);
        return;
    }
    const now = Date.now();
    if (state.active) {
        if (now < state.active.start) { notice('기기 시간을 확인해 주세요'); return; }
        const result = C.finish(state, now);
        if (persist(result.state)) {
            updateHome();
            if (result.discarded) notice('시간이 너무 짧아 기록하지 않았어요');
        }
    } else if (persist({...state, active:{id:now+'-'+Math.random().toString(36).slice(2),type,start:now}})) {
        updateHome();
    }
}
