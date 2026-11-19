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
import * as zapisnik from './views/zapisnik.js';

const VIEWS = { tyzden, mesiac, ulohy, akcie, poznamky, zapisnik };
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
  if (ui.view === 'zapisnik') { zapisnik.hydrate(viewEl); obnovPad(); }
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
  if (a === 'zaradit') {
    const z = store.state.polozky.get(el.dataset.id);
    // tá istá položka, len už nie zápisok – dostane typ a dátum
    return z && openEditor({ ...z, typ: 'uloha', datum_od: z.datum_od || today() });
  }
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
$('#qTypes').innerHTML = Object.keys(TYP).filter(t => t !== 'zapis').map(t => `<button type="button" class="chip t-${t}" data-type="${t}" aria-pressed="${t === qType}">${TYP[t]}</button>`).join('');
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

/* ---------- zápisník ---------- */
// Rozpísaný zápisok prežije prekreslenie aj zatvorenie appky.
const padObrazky = () => { try { return JSON.parse(recall('pad-obrazky', '[]')) || []; } catch { return []; } };
const pad = {
  text: recall('pad', ''),
  obrazky: padObrazky(),
  subory: [],   // originály súborov držíme len v pamäti (kvôli čítaniu textu)
};
const padZapamataj = () => {
  remember('pad', pad.text);
  remember('pad-obrazky', JSON.stringify(pad.obrazky));
};
let padZaneprazdneny = false;

function obnovPad() {
  const ta = $('#padText');
  if (!ta) return;
  if (ta.value !== pad.text) ta.value = pad.text;
  vykresliPadObrazky();
  $('#padCitaj').hidden = !pad.obrazky.length;
}

function vykresliPadObrazky() {
  const box = $('#padImgs');
  if (!box) return;
  box.hidden = !pad.obrazky.length;
  box.innerHTML = pad.obrazky.map((cesta, i) =>
    `<figure><img data-path="${cesta}" alt="Priložená fotka">` +
    `<button type="button" class="rm" data-padrm="${i}">Odstrániť</button></figure>`).join('');
  zapisnik.hydrate(box);
}

function padStav(text) {
  const el = $('#padStav');
  if (el) el.textContent = text || '';
}

async function padPridajSubory(files) {
  if (!files.length) return;
  padStav('Nahrávam fotku…');
  try {
    const cesty = await store.uploadImages(files);
    pad.obrazky.push(...cesty);
    pad.subory.push(...files);     // originál si držíme kvôli čítaniu textu
    padZapamataj();
    vykresliPadObrazky();
    $('#padCitaj').hidden = false;
    padStav('');
  } catch (e) {
    padStav('');
    toast('Fotku sa nepodarilo nahrať. ' + (e.message || ''));
  }
}

async function padPrecitajText() {
  if (padZaneprazdneny || !pad.obrazky.length) return;
  let zdroj = pad.subory[pad.subory.length - 1];
  if (!zdroj) {
    // po obnovení stránky už súbor v pamäti nie je – použijeme dočasnú adresu z úložiska
    const cesta = pad.obrazky[pad.obrazky.length - 1];
    const urls = await store.imageUrls([cesta]);
    zdroj = urls[cesta];
  }
  if (!zdroj) return;
  padZaneprazdneny = true;
  $('#padCitaj').disabled = true;
  padStav('Pripravujem… (prvýkrát sa sťahuje nástroj, chvíľu to trvá)');
  try {
    const { precitajText } = await import('./ocr.js');
    const text = await precitajText(zdroj, p => padStav('Čítam text… ' + p + ' %'));
    if (!text) {
      toast('Na fotke som nenašiel žiadny text.');
    } else {
      const ta = $('#padText');
      pad.text = (pad.text ? pad.text.trimEnd() + '\n\n' : '') + text;
      padZapamataj();
      if (ta) { ta.value = pad.text; ta.focus(); }
      toast('Text doplnený – skontroluj ho.');
    }
    padStav('');
  } catch (e) {
    padStav('');
    const { chybaOcr } = await import('./ocr.js').catch(() => ({ chybaOcr: () => 'Čítanie textu zlyhalo.' }));
    toast(chybaOcr(e));
  }
  padZaneprazdneny = false;
  const btn = $('#padCitaj');
  if (btn) btn.disabled = false;
}

async function padUloz() {
  const text = pad.text.trim();
  if (!text && !pad.obrazky.length) return;
  const riadky = text.split('\n');
  try {
    await store.save({
      id: crypto.randomUUID(),
      typ: 'zapis',
      nazov: riadky[0].slice(0, 160),
      text: riadky.slice(1).join('\n').trim(),
      datum_od: '', cas_od: '', hotovo: false,
      obrazky: pad.obrazky.slice(),
    });
    pad.text = ''; pad.obrazky = []; pad.subory = [];
    padZapamataj();
    const ta = $('#padText');
    if (ta) { ta.value = ''; ta.focus(); }
    vykresliPadObrazky();
    $('#padCitaj').hidden = true;
    toast('Zapísané');
  } catch (e) {
    toast(errText(e));
  }
}

// formulár sa vykresľuje nanovo, preto obsluha cez delegovanie
viewEl.addEventListener('input', e => {
  if (e.target.id !== 'padText') return;
  pad.text = e.target.value;
  padZapamataj();
});
viewEl.addEventListener('keydown', e => {
  if (e.target.id === 'padText' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    padUloz();
  }
});
viewEl.addEventListener('submit', e => {
  if (e.target.id !== 'padForm') return;
  e.preventDefault();
  padUloz();
});
viewEl.addEventListener('click', e => {
  if (e.target.closest('#padFotka')) return $('#padSubor').click();
  if (e.target.closest('#padCitaj')) return padPrecitajText();
  const rm = e.target.closest('[data-padrm]');
  if (rm) {
    const i = Number(rm.dataset.padrm);
    store.deleteImages([pad.obrazky[i]]).catch(() => {});
    pad.obrazky.splice(i, 1);
    pad.subory.splice(i, 1);
    padZapamataj();
    vykresliPadObrazky();
    $('#padCitaj').hidden = !pad.obrazky.length;
  }
});
viewEl.addEventListener('change', e => {
  if (e.target.id !== 'padSubor') return;
  const files = imagesFrom(e.target.files);
  e.target.value = '';
  padPridajSubory(files);
});

/* ---------- PWA ---------- */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

start();
