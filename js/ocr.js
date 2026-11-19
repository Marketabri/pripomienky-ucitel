// Čítanie textu z fotky (OCR) priamo v prehliadači – fotka sa nikam neposiela.
// Knižnica Tesseract.js sa sťahuje z CDN až pri prvom použití (má cez 10 MB
// aj s jazykovým modelom), aby sa appka zbytočne nespomaľovala.

const CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const JAZYKY = 'slk+ces';   // slovenčina + čeština (diakritika, podobná abeceda)

let kniznica = null;        // prísľub načítania knižnice
let pracovnik = null;       // prísľub pripraveného "workera"

function nacitajKniznicu() {
  if (kniznica) return kniznica;
  kniznica = new Promise((hotovo, chyba) => {
    if (window.Tesseract) return hotovo(window.Tesseract);
    const el = document.createElement('script');
    el.src = CDN;
    el.onload = () => (window.Tesseract ? hotovo(window.Tesseract) : chyba(new Error('nenačítalo sa')));
    el.onerror = () => chyba(new Error('nenačítalo sa'));
    document.head.appendChild(el);
  }).catch((e) => { kniznica = null; throw e; });
  return kniznica;
}

/**
 * Prečíta text z obrázka.
 * @param {Blob|File|string} obrazok  súbor alebo adresa obrázka
 * @param {(percent:number)=>void} napreduj  priebeh 0–100 (na zobrazenie)
 * @returns {Promise<string>} prečítaný text
 */
export async function precitajText(obrazok, napreduj) {
  const Tesseract = await nacitajKniznicu();

  if (!pracovnik) {
    pracovnik = Tesseract.createWorker(JAZYKY, 1, {
      logger: (m) => {
        // 'recognizing text' ide od 0 do 1; sťahovanie modelu má vlastné kroky
        if (napreduj && m.status === 'recognizing text') napreduj(Math.round(m.progress * 100));
        else if (napreduj && typeof m.progress === 'number') napreduj(Math.round(m.progress * 30));
      },
    }).catch((e) => { pracovnik = null; throw e; });
  }

  const w = await pracovnik;
  const { data } = await w.recognize(obrazok);
  return upracText(data.text || '');
}

/** Po OCR zostávajú prázdne riadky a medzery navyše. */
function upracText(t) {
  return t
    .replace(/\r/g, '')
    .split('\n')
    .map((r) => r.replace(/[ \t]+/g, ' ').trim())
    .filter((r, i, pole) => r || (i > 0 && pole[i - 1]))  // nechaj najviac jeden prázdny riadok
    .join('\n')
    .trim();
}

/** Zrozumiteľná hláška namiesto technickej chyby. */
export function chybaOcr(e) {
  const m = (e && e.message) || '';
  if (/nenačítalo|fetch|network/i.test(m)) {
    return 'Nepodarilo sa stiahnuť nástroj na čítanie textu. Skontroluj pripojenie na internet.';
  }
  return 'Text sa z fotky nepodarilo prečítať.';
}
