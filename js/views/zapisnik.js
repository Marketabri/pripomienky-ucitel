// Zápisník: miesto na rýchle poznámky, ktoré sa neskôr zaradia pod dátum.
// Zápisok je položka typu 'zapis' bez dátumu. Keď dostane dátum a iný typ,
// zo zápisníka zmizne a objaví sa v týždni a v kalendári.

import { state, imageUrls } from '../store.js';
import { fmtWithDay, today, ymd, addDays } from '../utils/datum.js';
import { esc, blank, IC } from '../ui.js';

/** Zápisky, najnovší hore. */
export const zapisky = () => [...state.polozky.values()]
  .filter(i => i.typ === 'zapis')
  .sort((a, b) => String(b.vytvorene).localeCompare(String(a.vytvorene)));

/** 'dnes 14:20', 'včera 9:05', inak 'Po 17. 11.' */
function kedy(zapis) {
  const d = new Date(zapis.vytvorene);
  if (Number.isNaN(d.getTime())) return '';
  const den = ymd(d);
  const cas = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  if (den === today()) return 'dnes ' + cas;
  if (den === ymd(addDays(new Date(), -1))) return 'včera ' + cas;
  return fmtWithDay(den) + ' ' + cas;
}

export function render() {
  const zoznam = zapisky();

  let h = `<div class="navrow"><h2>Zápisník</h2></div>

  <form class="pad" id="padForm">
    <textarea class="field pad-text" id="padText" rows="3"
      placeholder="Napíš rýchlu poznámku… (uložíš aj cez Ctrl+Enter)" aria-label="Rýchla poznámka"></textarea>
    <div class="pad-imgs" id="padImgs" hidden></div>
    <div class="pad-row">
      <button class="btn" type="button" id="padFotka" title="Fotka alebo screenshot">
        ${IC.pic.replace('class="pic"', '')}<span class="len-pc">Fotka</span>
      </button>
      <button class="btn" type="button" id="padCitaj" hidden>Prečítať text z fotky</button>
      <span class="pad-stav" id="padStav"></span>
      <button class="btn primary" type="submit" id="padUloz">Uložiť</button>
      <input type="file" id="padSubor" accept="image/*" multiple hidden>
    </div>
  </form>`;

  if (!zoznam.length) {
    return h + blank('Zápisník je prázdny',
      'Sem si hoď myšlienku, kým ju nezabudneš. Dátum jej dáš neskôr tlačidlom Zaradiť.');
  }

  return h + `<div class="zapisky">${zoznam.map(z => {
    const obr = (z.obrazky || []).length;
    const text = z.text || z.nazov || '';
    return `<article class="zapis">
      <div class="zapis-kedy">${esc(kedy(z))}</div>
      <div class="zapis-telo">
        <button class="zapis-text" data-act="open" data-id="${z.id}" title="Upraviť">
          ${obr ? `<img data-path="${esc(z.obrazky[0])}" alt="" loading="lazy">` : ''}
          <span>${esc(text) || '<i>(bez textu)</i>'}</span>
          ${obr > 1 ? `<span class="zapis-viac">+${obr - 1} obr.</span>` : ''}
        </button>
        <button class="btn zapis-zarad" data-act="zaradit" data-id="${z.id}">Zaradiť</button>
      </div>
    </article>`;
  }).join('')}</div>`;
}

/** Po vykreslení doplní dočasné adresy obrázkov (bucket je súkromný). */
export async function hydrate(root) {
  const imgs = [...root.querySelectorAll('img[data-path]')];
  if (!imgs.length) return;
  const urls = await imageUrls(imgs.map(i => i.dataset.path));
  imgs.forEach(i => { if (urls[i.dataset.path]) i.src = urls[i.dataset.path]; });
}
