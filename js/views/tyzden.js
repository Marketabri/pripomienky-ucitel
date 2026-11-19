// Týždenný prehľad + rozvrh.
import { state } from '../store.js';
import { DL, MG, ymd, addDays, monday, isoWeek, today, typTyzdna } from '../utils/datum.js';
import { IC, itemRow, onDate, isLate, plural } from '../ui.js';
import { lessonsHtml } from '../rozvrh.js';

export function render(ui) {
  const mon = monday(ui.anchor), sun = addDays(mon, 6), t = today();
  const range = mon.getMonth() === sun.getMonth()
    ? `${mon.getDate()}.–${sun.getDate()}. ${MG[sun.getMonth()]} ${sun.getFullYear()}`
    : `${mon.getDate()}. ${MG[mon.getMonth()]} – ${sun.getDate()}. ${MG[sun.getMonth()]} ${sun.getFullYear()}`;
  const all = [...state.polozky.values()];
  const from = ymd(mon), to = ymd(sun);
  const inWeek = all.filter(i => i.datum_od && i.datum_od <= to && (i.datum_do || i.datum_od) >= from);
  const openTasks = inWeek.filter(i => i.typ === 'uloha' && !i.hotovo).length;
  const events = inWeek.filter(i => i.typ === 'termin').length;
  const akcie = inWeek.filter(i => i.typ === 'akcia').length;
  const late = all.filter(isLate).length;
  const hasRozvrh = state.rozvrh.length > 0;
  const seg = v => `<button data-act="rozvrh" data-v="${v}" aria-pressed="${ui.rozvrh === v}">${{ moj: 'Môj', trieda: 'I.C', skryt: 'Skryť' }[v]}</button>`;

  let h = `<div class="navrow"><h2><span class="wk">týždeň ${isoWeek(mon)} · ${typTyzdna(mon)}</span>${range}</h2>
    ${hasRozvrh ? `<span class="seg-label">Rozvrh</span><div class="seg">${seg('moj')}${seg('trieda')}${seg('skryt')}</div>` : ''}
    <button class="iconbtn" data-act="prev" aria-label="Predchádzajúci týždeň">${IC.left}</button>
    <button class="btn" data-act="today">Dnes</button>
    <button class="iconbtn" data-act="next" aria-label="Ďalší týždeň">${IC.right}</button></div>
    <div class="summary"><span><strong>${openTasks}</strong>${plural(openTasks, 'otvorená úloha', 'otvorené úlohy', 'otvorených úloh')}</span><span><strong>${events}</strong>${plural(events, 'termín', 'termíny', 'termínov')}</span><span><strong>${akcie}</strong>${plural(akcie, 'akcia', 'akcie', 'akcií')}</span>${late ? `<span class="late"><strong>${late}</strong>po termíne (záložka Úlohy)</span>` : ''}</div>
    <div class="week">`;
  for (let k = 0; k < 7; k++) {
    const d = addDays(mon, k), s = ymd(d), list = onDate(all, s);
    h += `<section class="day${k > 4 ? ' weekend' : ''}${s === t ? ' today' : ''}">
      <div class="dayhead"><span class="dn">${DL[k]}</span><span class="dd">${d.getDate()}.</span>
      <button class="add" data-act="addOn" data-date="${s}" aria-label="Pridať na ${DL[k]}">${IC.plus}</button></div>
      ${lessonsHtml(s, ui.rozvrh)}
      ${list.length ? list.map(i => itemRow(i)).join('') : (k > 4 ? '<div class="empty-day">voľno</div>' : '')}
    </section>`;
  }
  return h + '</div>';
}
