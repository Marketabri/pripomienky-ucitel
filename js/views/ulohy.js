// Zoznam úloh podľa termínu.
import { state } from '../store.js';
import { ymd, addDays, monday, today } from '../utils/datum.js';
import { itemRow, sortItems, blank } from '../ui.js';

export function render(ui) {
  const t = today(), wkEnd = ymd(addDays(monday(new Date()), 6));
  const tasks = sortItems([...state.polozky.values()].filter(i => i.typ === 'uloha'));
  const open = tasks.filter(i => !i.hotovo), done = tasks.filter(i => i.hotovo);
  const groups = [
    ['Po termíne', 'late', open.filter(i => i.datum_od && i.datum_od < t)],
    ['Dnes', '', open.filter(i => i.datum_od === t)],
    ['Tento týždeň', '', open.filter(i => i.datum_od && i.datum_od > t && i.datum_od <= wkEnd)],
    ['Neskôr', '', open.filter(i => i.datum_od && i.datum_od > wkEnd)],
    ['Bez termínu', '', open.filter(i => !i.datum_od)],
  ];
  let h = `<div class="navrow"><h2>Úlohy</h2><button class="btn" data-act="toggleDone">${ui.showDone ? 'Skryť hotové' : `Zobraziť hotové (${done.length})`}</button></div>`;
  if (!open.length) h += blank('Všetko máš hotové', 'Novú úlohu napíš do poľa hore a stlač Enter.');
  for (const [name, cls, list] of groups) {
    if (list.length) h += `<div class="group ${cls}"><h3>${name} · ${list.length}</h3><div class="list">${list.map(i => itemRow(i, { showDate: true })).join('')}</div></div>`;
  }
  if (ui.showDone && done.length) {
    h += `<div class="group"><h3>Hotové · ${done.length}</h3><div class="list">${done.slice().reverse().map(i => itemRow(i, { showDate: true })).join('')}</div></div>`;
  }
  return h;
}
