// Spoločné kúsky rozhrania: ikony, escape, toast, riadok položky, zoradenie.
import { today, fmtWithDay, fmtRange, hhmm } from './utils/datum.js';

export const TYP = {
  uloha: 'Úloha',
  termin: 'Termín',
  akcia: 'Akcia',
  poznamka: 'Poznámka',
};
export const KATEGORIE = {
  vylet: 'Výlet', sutaz: 'Súťaž', exkurzia: 'Exkurzia', erasmus: 'Erasmus',
  olympiada: 'Olympiáda', porada: 'Porada', ine: 'Iné',
};

export const IC = {
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  tick: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  pic: '<svg class="pic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/></svg>',
};

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

export const errText = e => {
  const m = (e && (e.message || e.error_description)) || '';
  if (/fetch|network/i.test(m)) return 'Nie si pripojená na internet. Skús to znova.';
  return 'Nepodarilo sa uložiť' + (m ? ': ' + m : '.');
};

/** 1 úloha, 2–4 úlohy, 0/5+ úloh */
export const plural = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);

export const isLate = i => i.typ === 'uloha' && !i.hotovo && i.datum_od && i.datum_od < today();

/** Položky v daný deň (viacdňové akcie sa ukážu v každom dni rozsahu). */
export function onDate(list, s) {
  return sortItems(list.filter(i => i.datum_od && (i.datum_od === s || (i.datum_do && i.datum_od <= s && s <= i.datum_do))));
}

export function sortItems(list) {
  return list.sort((a, b) =>
    (a.datum_od || '9').localeCompare(b.datum_od || '9') ||
    (a.cas_od || '99').localeCompare(b.cas_od || '99') ||
    String(a.vytvorene).localeCompare(String(b.vytvorene)));
}

export function blank(title, text) {
  return `<div class="blank"><strong>${title}</strong>${text}</div>`;
}

export function itemRow(i, opts = {}) {
  const late = isLate(i);
  const meta = [];
  if (opts.showDate && i.datum_od) meta.push(fmtRange(i.datum_od, i.datum_do));
  else if (i.datum_do && i.datum_do !== i.datum_od) meta.push('do ' + fmtWithDay(i.datum_do));
  if (i.cas_od) meta.push(hhmm(i.cas_od) + (i.cas_do ? '–' + hhmm(i.cas_do) : ''));
  if (i.typ === 'akcia' && i.kategoria) meta.unshift(KATEGORIE[i.kategoria] || i.kategoria);
  else if (i.typ !== 'uloha' && !opts.showDate) meta.unshift(TYP[i.typ]);
  if (i.miesto) meta.push(i.miesto);
  const check = i.typ === 'uloha'
    ? `<span class="check" role="checkbox" aria-checked="${!!i.hotovo}" aria-label="Hotovo" data-act="toggle" data-id="${i.id}">${IC.tick}</span>` : '';
  return `<button class="item t-${i.typ}${i.hotovo ? ' done' : ''}${late ? ' late' : ''}" data-act="open" data-id="${i.id}">${check}<span class="tx"><span class="ti">${esc(i.nazov || '(bez názvu)')}</span>${meta.length ? `<span class="tm">${esc(meta.join(' · '))}${late ? ' · po termíne' : ''}</span>` : ''}</span>${(i.obrazky || []).length ? IC.pic : ''}</button>`;
}
