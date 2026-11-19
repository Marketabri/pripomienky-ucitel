// Školské akcie: výlety, súťaže, exkurzie, Erasmus…
import { state } from '../store.js';
import { today } from '../utils/datum.js';
import { itemRow, sortItems, blank, KATEGORIE, IC } from '../ui.js';

export function render(ui) {
  const t = today();
  let akcie = sortItems([...state.polozky.values()].filter(i => i.typ === 'akcia'));
  if (ui.kategoria) akcie = akcie.filter(i => i.kategoria === ui.kategoria);
  const upcoming = akcie.filter(i => !i.datum_od || (i.datum_do || i.datum_od) >= t);
  const past = akcie.filter(i => i.datum_od && (i.datum_do || i.datum_od) < t).reverse();
  const chips = ['', ...Object.keys(KATEGORIE)].map(k =>
    `<button class="chip t-akcia" data-act="kat" data-k="${k}" aria-pressed="${(ui.kategoria || '') === k}">${k ? KATEGORIE[k] : 'Všetky'}</button>`).join('');

  let h = `<div class="navrow"><h2>Školské akcie</h2><button class="btn" data-act="newAkcia">${IC.plus.replace('<svg', '<svg width="16" height="16"')}Nová akcia</button></div>
    <div class="types">${chips}</div>`;
  if (!upcoming.length && !past.length) {
    return h + blank('Zatiaľ žiadne akcie', 'Pridaj výlet, súťaž alebo exkurziu tlačidlom „Nová akcia“.');
  }
  if (upcoming.length) h += `<div class="group"><h3>Pripravované · ${upcoming.length}</h3><div class="list">${upcoming.map(i => itemRow(i, { showDate: true })).join('')}</div></div>`;
  if (past.length) h += `<div class="group"><h3>Minulé · ${past.length}</h3><div class="list">${past.map(i => itemRow(i, { showDate: true })).join('')}</div></div>`;
  return h;
}
