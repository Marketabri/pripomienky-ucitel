// Mesačný kalendár. Klik na deň otvorí jeho týždeň.
import { state } from '../store.js';
import { DN, MN, MG, ymd, addDays, monday, today } from '../utils/datum.js';
import { IC, esc, onDate } from '../ui.js';

export function render(ui) {
  const first = new Date(ui.anchor.getFullYear(), ui.anchor.getMonth(), 1);
  const start = monday(first), t = today();
  const all = [...state.polozky.values()].filter(i => i.typ !== 'poznamka' || i.datum_od);
  let h = `<div class="navrow"><h2>${MN[first.getMonth()]} ${first.getFullYear()}</h2>
    <button class="iconbtn" data-act="prev" aria-label="Predchádzajúci mesiac">${IC.left}</button>
    <button class="btn" data-act="today">Dnes</button>
    <button class="iconbtn" data-act="next" aria-label="Ďalší mesiac">${IC.right}</button></div><div class="month">`;
  h += DN.map(d => `<div class="mh">${d}</div>`).join('');
  for (let k = 0; k < 42; k++) {
    const d = addDays(start, k), s = ymd(d), list = onDate(all, s);
    if (k === 35 && d.getMonth() !== first.getMonth()) break;
    h += `<button class="cell${d.getMonth() !== first.getMonth() ? ' out' : ''}${s === t ? ' today' : ''}" data-act="gotoWeek" data-date="${s}" aria-label="${d.getDate()}. ${MG[d.getMonth()]}, ${list.length} položiek">
      <span class="n">${d.getDate()}</span>
      ${list.slice(0, 3).map(i => `<span class="lbl t-${i.typ}${i.hotovo ? ' done' : ''}">${esc(i.nazov)}</span>`).join('')}
      ${list.length > 3 ? `<span class="more">+${list.length - 3}</span>` : ''}</button>`;
  }
  return h + '</div>';
}
