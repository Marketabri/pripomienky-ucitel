// Okno na pridanie / úpravu položky vrátane obrázkov.
import * as store from './store.js';
import { TYP, KATEGORIE, esc, toast, errText } from './ui.js';

let current = null;
export const currentEditor = () => current;

export function openEditor(item, defaults = {}) {
  if (current) current.close();
  const isNew = !item;
  const d = item
    ? { ...item, obrazky: [...(item.obrazky || [])] }
    : { id: crypto.randomUUID(), typ: 'uloha', nazov: '', text: '', datum_od: '', datum_do: '', cas_od: '', cas_do: '',
        kategoria: '', miesto: '', trieda: '', hotovo: false, obrazky: [], ...defaults };
  const original = new Set(item ? item.obrazky || [] : []);
  const added = new Set();
  // dátum 'YYYY-MM-DD', čas z databázy 'HH:MM:SS' -> 'HH:MM'
  const v = x => esc(x ? String(x).slice(0, /^\d\d:\d\d/.test(x) ? 5 : 10) : '');

  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="edH">
    <h2 id="edH">${isNew ? 'Nová položka' : 'Upraviť'}</h2>
    <div class="types" id="edTypes">${Object.keys(TYP).map(t => `<button type="button" class="chip t-${t}" data-type="${t}" aria-pressed="${d.typ === t}">${TYP[t]}</button>`).join('')}</div>
    <label>Názov<input class="field" id="edTitle" value="${esc(d.nazov)}"></label>
    <div class="row">
      <label>Dátum<input class="field" type="date" id="edDate" value="${v(d.datum_od)}"></label>
      <label data-only="akcia">Do (viac dní)<input class="field" type="date" id="edDateTo" value="${v(d.datum_do)}"></label>
    </div>
    <div class="row">
      <label>Čas od<input class="field" type="time" id="edTime" value="${v(d.cas_od)}"></label>
      <label data-only="termin akcia">Čas do<input class="field" type="time" id="edTimeTo" value="${v(d.cas_do)}"></label>
    </div>
    <div class="row" data-only="akcia">
      <label>Kategória<select class="field" id="edKat"><option value="">—</option>${Object.entries(KATEGORIE).map(([k, n]) => `<option value="${k}"${d.kategoria === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>Trieda<input class="field" id="edTrieda" value="${esc(d.trieda)}" placeholder="napr. I.C"></label>
    </div>
    <label data-only="termin akcia">Miesto<input class="field" id="edMiesto" value="${esc(d.miesto)}"></label>
    <label>Poznámka<textarea class="field" id="edText" placeholder="Podrobnosti, odkazy, čo treba priniesť…">${esc(d.text)}</textarea></label>
    <div class="imgs" id="edImgs"></div>
    <div class="drop"><button type="button" class="btn" id="edAdd">Pridať fotku / screenshot</button><span>alebo Ctrl+V, prípadne pretiahni sem</span><input type="file" id="edFile" accept="image/*" multiple hidden></div>
    <div class="actions">${isNew ? '' : '<button type="button" class="btn danger" id="edDel">Zmazať</button>'}<span class="sp"></span>
      <button type="button" class="btn" id="edCancel">Zrušiť</button><button type="button" class="btn primary" id="edSave">Uložiť</button></div>
  </div>`;
  document.body.appendChild(ov);
  const q = s => ov.querySelector(s);

  const applyType = () => ov.querySelectorAll('[data-only]').forEach(el => { el.hidden = !el.dataset.only.split(' ').includes(d.typ); });
  applyType();
  q('#edTypes').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    d.typ = c.dataset.type;
    ov.querySelectorAll('#edTypes .chip').forEach(x => x.setAttribute('aria-pressed', x === c));
    applyType();
  });

  const drawImgs = async () => {
    const urls = await store.imageUrls(d.obrazky);
    q('#edImgs').innerHTML = d.obrazky.map(p => `<figure><img src="${esc(urls[p])}" alt="Priložený obrázok"><button type="button" class="rm" data-rm="${esc(p)}">Odstrániť</button></figure>`).join('');
  };
  drawImgs();
  q('#edImgs').addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { d.obrazky = d.obrazky.filter(x => x !== rm.dataset.rm); drawImgs(); return; }
    const im = e.target.closest('img');
    if (im) {
      const lb = document.createElement('div');
      lb.className = 'lightbox'; lb.innerHTML = `<img src="${im.src}" alt="">`;
      lb.onclick = () => lb.remove();
      document.body.appendChild(lb);
    }
  });

  const addFiles = async files => {
    const btn = q('#edAdd'); btn.disabled = true; btn.textContent = 'Nahrávam…';
    try {
      const paths = await store.uploadImages(files);
      paths.forEach(p => { added.add(p); d.obrazky.push(p); });
      await drawImgs();
    } catch (e) { toast('Obrázok sa nepodarilo nahrať. ' + (e.message || '')); }
    btn.disabled = false; btn.textContent = 'Pridať fotku / screenshot';
  };
  q('#edAdd').onclick = () => q('#edFile').click();
  q('#edFile').onchange = e => { const f = [...e.target.files]; e.target.value = ''; if (f.length) addFiles(f); };

  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); current = null; };
  const cancel = () => { store.deleteImages([...added]).catch(() => {}); close(); };
  const onKey = e => { if (e.key === 'Escape') cancel(); if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save(); };
  document.addEventListener('keydown', onKey);
  ov.addEventListener('mousedown', e => { if (e.target === ov) cancel(); });
  q('#edCancel').onclick = cancel;

  const save = async () => {
    d.nazov = q('#edTitle').value.trim();
    d.text = q('#edText').value;
    d.datum_od = q('#edDate').value;
    d.cas_od = q('#edTime').value;
    const only = t => t.split(' ').includes(d.typ);
    d.datum_do = only('akcia') ? q('#edDateTo').value : '';
    d.cas_do = only('termin akcia') ? q('#edTimeTo').value : '';
    d.miesto = only('termin akcia') ? q('#edMiesto').value.trim() : '';
    d.kategoria = only('akcia') ? q('#edKat').value : '';
    d.trieda = only('akcia') ? q('#edTrieda').value.trim() : '';
    if (d.datum_do && d.datum_od && d.datum_do < d.datum_od) { toast('Dátum „do“ je skôr ako začiatok.'); return; }
    if (d.datum_do && !d.datum_od) d.datum_od = d.datum_do;
    if (d.typ !== 'uloha') d.hotovo = false;
    if (!d.nazov && !d.text && !d.obrazky.length) { q('#edTitle').focus(); return; }
    const sv = q('#edSave'); sv.disabled = true;
    try {
      await store.save(d);
      const removed = [...original, ...added].filter(p => !d.obrazky.includes(p));
      store.deleteImages(removed).catch(() => {});
      close(); toast('Uložené');
    } catch (e) { sv.disabled = false; toast(errText(e)); }
  };
  q('#edSave').onclick = save;

  const del = q('#edDel');
  if (del) del.onclick = async () => {
    if (!del.classList.contains('armed')) { del.classList.add('armed'); del.textContent = 'Naozaj zmazať?'; return; }
    try {
      await store.remove(d.id);
      store.deleteImages([...original, ...added]).catch(() => {});
      close(); toast('Zmazané');
    } catch (e) { toast(errText(e)); }
  };

  setTimeout(() => q('#edTitle').focus(), 0);
  current = { close, addFiles };
  return current;
}
