// Jediné miesto, ktoré číta a zapisuje do databázy a úložiska (docs/architektura.md).
import { sb } from './supabase.js';

const BUCKET = 'obrazky';
let uid = null;
const listeners = new Set();

export const state = {
  polozky: new Map(),   // id -> položka
  rozvrh: [],           // riadky tabuľky rozvrh
  zvonenie: new Map(),  // hodina -> {cas_od, cas_do}
  volne: [],            // voľné dni
  nastavenia: null,     // riadok z tabuľky nastavenia (notifikácie)
  notifOk: false,       // je spustená migrácia 002 (notifikácie)?
  loaded: false,
};

export const onChange = fn => listeners.add(fn);
const emit = () => listeners.forEach(fn => fn());

export async function init(userId) {
  uid = userId;
  await reload();
}

/** Načíta všetko znova (pri štarte a keď sa appka vráti do popredia). */
export async function reload() {
  const [p, r, z, v, n] = await Promise.all([
    sb.from('polozky').select('*'),
    sb.from('rozvrh').select('*'),
    sb.from('zvonenie').select('*'),
    sb.from('volne_dni').select('*'),
    sb.from('nastavenia').select('*').maybeSingle(),
  ]);
  const err = p.error || r.error || z.error || v.error;
  if (err) throw err;
  state.polozky = new Map(p.data.map(i => [i.id, i]));
  state.rozvrh = r.data;
  state.zvonenie = new Map(z.data.map(x => [x.hodina, x]));
  state.volne = v.data;
  // bez migrácie 002 tabuľka neexistuje – appka funguje ďalej, len bez pripomienok
  state.notifOk = !n.error;
  state.nastavenia = n.error ? null : n.data;
  state.loaded = true;
  emit();
}

const clean = it => {
  const o = { ...it };
  delete o.vytvorene; delete o.upravene; delete o.user_id;
  if (!state.notifOk) { delete o.pripomenut_o; delete o.pripomienka_odoslana; }
  else {
    // zmenený čas pripomienky = poslať znova
    const ms = x => (x ? new Date(x).getTime() : null);
    const old = state.polozky.get(o.id);
    if (!o.pripomenut_o) { o.pripomenut_o = null; o.pripomienka_odoslana = null; }
    else if (!old || ms(old.pripomenut_o) !== ms(o.pripomenut_o)) o.pripomienka_odoslana = null;
  }
  for (const k of ['datum_od', 'datum_do', 'cas_od', 'cas_do', 'kategoria', 'miesto', 'trieda']) if (o[k] === '') o[k] = null;
  return o;
};

export async function save(item) {
  const { data, error } = await sb.from('polozky').upsert(clean(item)).select().single();
  if (error) throw error;
  state.polozky.set(data.id, data);
  emit();
  return data;
}

export async function patch(id, fields) {
  const { data, error } = await sb.from('polozky').update(fields).eq('id', id).select().single();
  if (error) throw error;
  state.polozky.set(data.id, data);
  emit();
}

export async function remove(id) {
  const { error } = await sb.from('polozky').delete().eq('id', id);
  if (error) throw error;
  state.polozky.delete(id);
  emit();
}

/* ---------- obrázky ---------- */

async function shrink(file) {
  const ok = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  if (ok.includes(file.type) && file.size < 1.5e6) return file;
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', 0.85));
  } catch { return file; }
}

/** Nahrá obrázky, vráti ich cesty v buckete. */
export async function uploadImages(files) {
  const out = [];
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    const blob = await shrink(f);
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/gif' ? 'gif' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${uid}/${crypto.randomUUID()}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || 'image/jpeg' });
    if (error) throw error;
    out.push(path);
  }
  return out;
}

export async function deleteImages(paths) {
  if (!paths.length) return;
  await sb.storage.from(BUCKET).remove(paths);
}

const urlCache = new Map(); // cesta -> {url, exp}
/** Dočasné adresy obrázkov (bucket je súkromný). */
export async function imageUrls(paths) {
  const now = Date.now();
  const need = paths.filter(p => !(urlCache.get(p)?.exp > now));
  if (need.length) {
    const { data } = await sb.storage.from(BUCKET).createSignedUrls(need, 3600);
    (data || []).forEach(d => { if (d.signedUrl) urlCache.set(d.path, { url: d.signedUrl, exp: now + 50 * 60e3 }); });
  }
  return Object.fromEntries(paths.map(p => [p, urlCache.get(p)?.url || '']));
}

/* ---------- nastavenia notifikácií ---------- */
export async function saveNastavenia(fields) {
  const { data, error } = await sb.from('nastavenia').upsert({ ...(state.nastavenia || {}), ...fields, user_id: uid }).select().single();
  if (error) throw error;
  state.nastavenia = data;
  emit();
  return data;
}

/* ---------- záloha ---------- */
export function exportJson() {
  return JSON.stringify({
    exportovane: new Date().toISOString(),
    polozky: [...state.polozky.values()],
    rozvrh: state.rozvrh,
    zvonenie: [...state.zvonenie.values()],
    volne_dni: state.volne,
  }, null, 2);
}
