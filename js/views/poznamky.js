// Kartičky poznámok s náhľadom prvého obrázka.
import { state, imageUrls } from '../store.js';
import { fmtShort } from '../utils/datum.js';
import { esc, blank, IC } from '../ui.js';

export function render() {
  const notes = [...state.polozky.values()].filter(i => i.typ === 'poznamka')
    .sort((a, b) => String(b.upravene).localeCompare(String(a.upravene)));
  let h = `<div class="navrow"><h2>Poznámky</h2><button class="btn" data-act="newNote">${IC.plus.replace('<svg', '<svg width="16" height="16"')}Nová poznámka</button></div>`;
  if (!notes.length) return h + blank('Zatiaľ žiadne poznámky', 'Prepni hore na „Poznámka“, alebo vlož screenshot cez Ctrl+V.');
  return h + `<div class="notes">${notes.map(n => `<button class="note" data-act="open" data-id="${n.id}">
    ${(n.obrazky || [])[0] ? `<img data-path="${esc(n.obrazky[0])}" alt="" loading="lazy">` : ''}
    <h4>${esc(n.nazov || '(bez názvu)')}</h4>${n.text ? `<p>${esc(n.text)}</p>` : ''}
    <span class="meta">${n.datum_od ? fmtShort(n.datum_od) : ''}${n.datum_od && (n.obrazky || []).length ? ' · ' : ''}${(n.obrazky || []).length ? n.obrazky.length + ' obr.' : ''}</span></button>`).join('')}</div>`;
}

/** Po vykreslení doplní adresy obrázkov (sú súkromné, adresa je dočasná). */
export async function hydrate(root) {
  const imgs = [...root.querySelectorAll('img[data-path]')];
  if (!imgs.length) return;
  const urls = await imageUrls(imgs.map(i => i.dataset.path));
  imgs.forEach(i => { if (urls[i.dataset.path]) i.src = urls[i.dataset.path]; });
}
