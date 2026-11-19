// Rozvrh hodín v týždennom prehľade (docs/rozvrh.md).
import { state } from './store.js';
import { parse, isoDen, typTyzdna, hhmm, today } from './utils/datum.js';
import { esc } from './ui.js';

/** Platí v daný deň rozvrh? (pracovný deň, v platnosti, nie voľno) */
function volno(s) {
  return state.volne.find(v => v.datum_od <= s && s <= v.datum_do) || null;
}

/** Hodiny pre deň s ('YYYY-MM-DD') a rozvrh 'moj' | 'trieda'. Vráti zoskupené bloky. */
export function lessonsFor(s, ktory) {
  const d = parse(s);
  const den = isoDen(d);
  if (den > 5) return { blocks: [] };
  const off = volno(s);
  if (off) return { blocks: [], off: off.nazov };
  const t = typTyzdna(d);
  const rows = state.rozvrh.filter(r =>
    r.rozvrh === ktory && r.den === den && (r.tyzden === 'vsetky' || r.tyzden === t) &&
    (!r.platne_od || r.platne_od <= s) && (!r.platne_do || s <= r.platne_do));
  if (!rows.length) return { blocks: [] };

  // zoskup podľa hodiny (delené skupiny = viac riadkov v jednej hodine)
  const byHour = new Map();
  for (const r of rows) {
    if (!byHour.has(r.hodina)) byHour.set(r.hodina, []);
    byHour.get(r.hodina).push(r);
  }
  const key = list => list.map(r => [r.predmet, r.trieda, r.ucitel, r.ucebna, r.skupina].join('|')).sort().join('#');
  const hours = [...byHour.keys()].sort((a, b) => a - b);

  // spoj po sebe idúce hodiny s rovnakým obsahom (dvojhodiny)
  const blocks = [];
  for (const h of hours) {
    const list = byHour.get(h);
    const last = blocks[blocks.length - 1];
    if (last && last.to === h - 1 && last.key === key(list)) last.to = h;
    else blocks.push({ from: h, to: h, list, key: key(list) });
  }
  return { blocks };
}

function label(block, ktory) {
  const L = block.list;
  const subjects = [...new Set(L.map(r => r.predmet))];
  if (ktory === 'moj') {
    const r = L[0];
    return `<b>${esc(r.predmet)}</b> ${esc(r.trieda || '')} <span>${esc([r.ucebna, r.skupina].filter(Boolean).join(' · '))}</span>`;
  }
  if (L.length === 1) {
    const r = L[0];
    return `<b>${esc(r.predmet)}</b> <span>${esc([r.ucitel, r.ucebna].filter(Boolean).join(' · '))}</span>`;
  }
  // delená hodina
  return `<b>${esc(subjects.join(' / '))}</b> <span>${esc(L.map(r => r.ucitel).filter(Boolean).join(' / '))}</span>`;
}

function timeRange(b) {
  const a = state.zvonenie.get(b.from), z = state.zvonenie.get(b.to);
  return { od: a ? hhmm(a.cas_od) : '', do: z ? hhmm(z.cas_do) : '' };
}

export function lessonsHtml(s, ktory) {
  if (ktory === 'skryt' || !state.rozvrh.length) return '';
  const { blocks, off } = lessonsFor(s, ktory);
  if (off) return `<div class="lessons"><span class="off">${esc(off)}</span></div>`;
  if (!blocks.length) return '';
  const now = new Date();
  const nowHM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const isToday = s === today();
  return `<div class="lessons">${blocks.map(b => {
    const t = timeRange(b);
    const cur = isToday && t.od && t.od <= nowHM && nowHM < t.do;
    const h = b.from === b.to ? `${b.from}.` : `${b.from}.–${b.to}.`;
    const title = b.list.map(r => [r.predmet, r.skupina, r.ucitel, r.trieda, r.ucebna].filter(Boolean).join(' ')).join('\n');
    return `<div class="lesson${cur ? ' now' : ''}" title="${esc(title)}"><span class="h">${h} ${t.od}</span><span class="s">${label(b, ktory)}</span></div>`;
  }).join('')}</div>`;
}
