'use strict';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label = type => type === 'study' ? '공부' : '휴식';
const icons = {
    back: '<path d="M15 18 9 12 15 6"/>',
    logs: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8 M8 12h8 M8 16h5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18 M8 3v4 M16 3v4"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    play: '<path d="m8 5 12 7-12 7Z" fill="currentColor" stroke="none"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" stroke="none"/>'
};
function icon(name) {
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
}
function iconButton(id, name, text, cls = '') {
    return `<button id="${id}" class="icon-button ${cls}" aria-label="${text}">${icon(name)}</button>`;
}
function header(title, home = false, calendarLink = false) {
    return `<header class="page-header ${home ? 'home-header' : ''}">
        ${home ? '' : iconButton('back', 'back', '뒤로', 'back')}
        <h1>${esc(title)}</h1>
        ${home ? iconButton('logs','logs','로그 보기','log-link') : calendarLink ? iconButton('calendar-link','calendar','캘린더','log-link') : ''}
    </header>`;
}
function segment(value, locked = false) {
    return `<div class="segment" data-mode="${value}" role="group" aria-label="기록 종류">
        ${['study','rest'].map(t => `<button data-type="${t}" class="${value === t ? 'selected' : ''}" aria-pressed="${value === t}" ${locked ? 'disabled' : ''}>${label(t)}</button>`).join('')}
    </div>`;
}
function notice(text) {
    document.querySelectorAll('.notice').forEach(el => el.remove());
    const el = document.createElement('div');
    el.className = 'notice';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(),250); },2600);
}
function ripple(button, x, y) {
    if (!button || button.disabled) return;
    const rect = button.getBoundingClientRect();
    const size = 2 * Math.hypot(rect.width, rect.height);
    const wave = document.createElement('span');
    wave.className = 'ripple';
    wave.setAttribute('aria-hidden','true');
    wave.style.width = wave.style.height = size + 'px';
    wave.style.left = (x - rect.left - size / 2) + 'px';
    wave.style.top = (y - rect.top - size / 2) + 'px';
    button.appendChild(wave);
    setTimeout(() => wave.remove(),650);
}
function bindTouchFeedback() {
    document.addEventListener('pointerdown', e => {
        const button = e.target.closest('button');
        if (button) ripple(button,e.clientX,e.clientY);
    },{passive:true});
    document.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
            const button = e.target.closest('button');
            if (button) { const r = button.getBoundingClientRect(); ripple(button,r.left+r.width/2,r.top+r.height/2); }
        }
    });
}
