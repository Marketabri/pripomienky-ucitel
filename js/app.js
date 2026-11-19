// Štart appky: prihlásenie, záložky, rýchle pridanie, vkladanie obrázkov.
import { sb, configOk, currentUser, login, logout } from './supabase.js';
import * as store from './store.js';
import { parse, addDays, today, fmtShort } from './utils/datum.js';
import { TYP, blank, toast, errText } from './ui.js';
import { openEditor, currentEditor } from './editor.js';
import { openNotifikacie } from './notifikacie.js';
import * as tyzden from './views/tyzden.js';
import * as mesiac from './views/mesiac.js';
import * as ulohy from './views/ulohy.js';
import * as akcie from './views/akcie.js';
import * as poznamky from './views/poznamky.js';

const VIEWS = { tyzden, mesiac, ulohy, akcie, poznamky };
const $ = s => document.querySelector(s);
const viewEl = $('#view');

const remember = (k, v) => { try { localStorage.setItem('diar-' + k, v); } catch {} };
const recall = (k, d) => { try { return localStorage.getItem('diar-' + k) || d; } catch { return d; } };

const ui = {
  view: VIEWS[recall('view', 'tyzden')] ? recall('view', 'tyzden') : 'tyzden',
  anchor: new Date(),
  rozvrh: recall('rozvrh', 'moj'),
  showDone: false,
  kategoria: '',
};

/* ---------- vykreslenie ---------- */
function render() {
  document.querySelectorAll('.tabs [data-view]').forEach(b => b.setAttribute('aria-selected', b.dataset.view === ui.view));
  if (!store.state.loaded) { viewEl.innerHTML = blank('Načítavam diár…', 'Chvíľku strpenia.'); return; }
  viewEl.innerHTML = VIEWS[ui.view].render(ui);
  if (ui.view === 'poznamky') poznamky.hydrate(viewEl);
}
store.onChange(render);

/* ---------- prihlásenie ---------- */
async function start() {
  if (!configOk) {
    document.body.innerHTML = '<div class="login"><div class="login-card"><h1>Chýba nastavenie</h1><p>Doplň <b>SUPABASE_ANON_KEY</b> v súbore <code>js/config.js</code>.</p></div></div>';
    return;
  }
  const user = await currentUser();
  if (user) showApp(user); else showLogin();
  sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') showLogin(); });
}

function showLogin() {
  $('#app').hidden = true;
  $('#login').hidden = false;
  $('#loginEmail').focus();
}

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('#loginBtn'), err = $('#loginErr');
  btn.disabled = true; err.hidden = true;
  try {
    const user = await login($('#loginEmail').value.trim(), $('#loginPass').value);
    $('#loginPass').value = '';
    showApp(user);
  } catch (ex) {
    err.textContent = /invalid/i.test(ex.message) ? 'Nesprávny e-mail alebo heslo.' : 'Prihlásenie zlyhalo: ' + ex.message;
    err.hidden = false;
  }
  btn.disabled = false;
});

async function showApp(user) {
  $('#login').hidden = true;
  $('#app').hidden = false;
  render();
  try { await store.init(user.id); }
  catch (e) { viewEl.innerHTML = blank('Diár sa nepodarilo načítať', 'Skontroluj pripojenie a obnov stránku. ' + (e.message || '')); }
}

// keď sa appka vráti do popredia (napr. z mobilu), načítaj zmeny z druhého zariadenia
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && store.state.loaded && !currentEditor()) store.reload().catch(() => {});
});

/* ---------- menu ---------- */
const menuPop = $('#menuPop');
$('#menuBtn').addEventListener('click', () => { menuPop.hidden = !menuPop.hidden; $('#menuBtn').setAttribute('aria-expanded', !menuPop.hidden); });
document.addEventListener('click', e => { if (!e.target.closest('.menu')) menuPop.hidden = true; });
$('#notifBtn').addEventListener('click', () => { menuPop.hidden = true; openNotifikacie(); });
$('#logoutBtn').addEventListener('click', async () => { menuPop.hidden = true; await logout(); });
$('#exportBtn').addEventListener('click', () => {
  menuPop.hidden = true;
  const blob = new Blob([store.exportJson()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `zaloha-diar-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Záloha stiahnutá');
});

/* ---------- záložky a akcie v obsahu ---------- */
$('.tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-view]'); if (!b) return;
  ui.view = b.dataset.view; remember('view', ui.view); render();
});

viewEl.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act;
  if (a === 'toggle') {
    e.stopPropagation();
    const it = store.state.polozky.get(el.dataset.id);
    if (it) store.patch(it.id, { hotovo: !it.hotovo }).catch(ex => toast(errText(ex)));
    return;
  }
  if (a === 'open') return openEditor(store.state.polozky.get(el.dataset.id));
  if (a === 'addOn') return openEditor(null, { typ: qType === 'poznamka' ? 'uloha' : qType, datum_od: el.dataset.date });
  if (a === 'newNote') return openEditor(null, { typ: 'poznamka' });
  if (a === 'newAkcia') return openEditor(null, { typ: 'akcia', kategoria: ui.kategoria, datum_od: today() });
  if (a === 'gotoWeek') { ui.anchor = parse(el.dataset.date); ui.view = 'tyzden'; remember('view', 'tyzden'); return render(); }
  if (a === 'today') { ui.anchor = new Date(); return render(); }
  if (a === 'prev' || a === 'next') {
    const s = a === 'prev' ? -1 : 1;
    ui.anchor = ui.view === 'mesiac' ? new Date(ui.anchor.getFullYear(), ui.anchor.getMonth() + s, 1) : addDays(ui.anchor, 7 * s);
    return render();
  }
  if (a === 'toggleDone') { ui.showDone = !ui.showDone; return render(); }
  if (a === 'rozvrh') { ui.rozvrh = el.dataset.v; remember('rozvrh', ui.rozvrh); return render(); }
  if (a === 'kat') { ui.kategoria = el.dataset.k; return render(); }
});

/* ---------- rýchle pridanie ---------- */
let qType = 'uloha';
const qDate = $('#qDate');
const PLACEHOLDER = { uloha: 'Čo treba urobiť? napr. Odovzdať známky I.C', termin: 'Aký termín? napr. Rodičovské združenie', akcia: 'Aká akcia? napr. Exkurzia Volkswagen', poznamka: 'Názov poznámky' };
$('#qTypes').innerHTML = Object.keys(TYP).map(t => `<button type="button" class="chip t-${t}" data-type="${t}" aria-pressed="${t === qType}">${TYP[t]}</button>`).join('');
function setQType(t) {
  qType = t;
  document.querySelectorAll('#qTypes .chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.type === t));
  $('#qTitle').placeholder = PLACEHOLDER[t];
  if (t === 'poznamka') qDate.value = ''; else if (!qDate.value) qDate.value = today();
}
$('#qTypes').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) setQType(c.dataset.type); });
setQType('uloha');

$('#quick').addEventListener('submit', async e => {
  e.preventDefault();
  const nazov = $('#qTitle').value.trim(); if (!nazov) return;
  try {
    await store.save({ id: crypto.randomUUID(), typ: qType, nazov, text: '', datum_od: qDate.value, cas_od: $('#qTime').value, hotovo: false, obrazky: [] });
    $('#qTitle').value = ''; $('#qTime').value = '';
    toast('Pridané: ' + TYP[qType].toLowerCase());
  } catch (ex) { toast(errText(ex)); }
});

/* ---------- obrázky: tlačidlo, Ctrl+V, pretiahnutie ---------- */
async function newWithImages(files, nazov) {
  const ed = openEditor(null, { typ: 'poznamka', nazov: nazov || '', datum_od: today() });
  await ed.addFiles(files);
}
$('#qPhoto').addEventListener('click', () => $('#qFile').click());
$('#qFile').addEventListener('change', e => {
  const files = [...e.target.files]; e.target.value = ''; if (!files.length) return;
  newWithImages(files, $('#qTitle').value.trim()); $('#qTitle').value = '';
});
const imagesFrom = list => [...(list || [])].filter(f => f.type.startsWith('image/'));
document.addEventListener('paste', e => {
  if ($('#app').hidden) return;
  const files = imagesFrom(e.clipboardData?.files); if (!files.length) return;
  e.preventDefault();
  const ed = currentEditor();
  if (ed) ed.addFiles(files); else newWithImages(files, 'Screenshot ' + fmtShort(today()));
});
let dragDepth = 0;
const hasFiles = e => [...(e.dataTransfer?.types || [])].includes('Files');
document.addEventListener('dragenter', e => { if (hasFiles(e)) { dragDepth++; document.body.classList.add('dragging'); } });
document.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) document.body.classList.remove('dragging'); });
document.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
document.addEventListener('drop', e => {
  dragDepth = 0; document.body.classList.remove('dragging');
  if ($('#app').hidden) return;
  const files = imagesFrom(e.dataTransfer?.files); if (!files.length) return;
  e.preventDefault();
  const ed = currentEditor();
  if (ed) ed.addFiles(files); else newWithImages(files, 'Obrázok ' + fmtShort(today()));
});

/* ---------- PWA ---------- */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

start();
