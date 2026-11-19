// Práca s dátumami. Všetky dátumy v appke sú reťazce 'YYYY-MM-DD' v miestnom čase.

export const DN = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
export const DL = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa'];
export const MN = ['január', 'február', 'marec', 'apríl', 'máj', 'jún', 'júl', 'august', 'september', 'október', 'november', 'december'];
export const MG = ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna', 'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'];

const pad = n => String(n).padStart(2, '0');
export const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const parse = s => { const [a, b, c] = s.split('-').map(Number); return new Date(a, b - 1, c); };
export const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
export const monday = d => addDays(d, -((d.getDay() + 6) % 7));
export const today = () => ymd(new Date());
/** 1 = pondelok … 7 = nedeľa */
export const isoDen = d => ((d.getDay() + 6) % 7) + 1;

export function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const w = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - w);
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - y) / 864e5 + 1) / 7);
}

/**
 * Týždeň v rozvrhu: 'TN' (nepárny) alebo 'TP' (párny).
 * JEDINÉ miesto s týmto pravidlom – ak škola počíta inak, otoč to tu (docs/rozvrh.md).
 */
export const typTyzdna = d => (isoWeek(d) % 2 === 1 ? 'TN' : 'TP');

export const fmtShort = s => { const d = parse(s); return d.getDate() + '. ' + MG[d.getMonth()]; };
export const fmtWithDay = s => { const d = parse(s); return DN[(d.getDay() + 6) % 7] + ' ' + d.getDate() + '. ' + (d.getMonth() + 1) + '.'; };
export const fmtRange = (a, b) => (!b || a === b ? fmtWithDay(a) : fmtWithDay(a) + ' – ' + fmtWithDay(b));
export const hhmm = t => (t ? String(t).slice(0, 5) : '');
