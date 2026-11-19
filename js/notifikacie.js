// Nastavenie notifikácií cez ntfy (docs/notifikacie.md).
import * as store from './store.js';
import { esc, toast, errText } from './ui.js';

const randomTopic = () => {
  const a = 'abcdefghijkmnpqrstuvwxyz23456789';
  const b = crypto.getRandomValues(new Uint8Array(20));
  return 'diar-' + [...b].map(x => a[x % a.length]).join('');
};

async function testSend(topic) {
  const res = await fetch('https://ntfy.sh', {
    method: 'POST',
    body: JSON.stringify({ topic, title: 'Môj diár', message: 'Skúšobná notifikácia – funguje to 👍', tags: ['white_check_mark'] }),
  });
  if (!res.ok) throw new Error('ntfy odpovedal ' + res.status);
}

export function openNotifikacie() {
  if (!store.state.notifOk) {
    toast('Najprv spusti v Supabase migráciu supabase/migracie/002_notifikacie.sql.');
    return;
  }
  const n = store.state.nastavenia || {};
  let topic = n.ntfy_topic || '';
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="nfH">
    <h2 id="nfH">Notifikácie do mobilu</h2>
    <ol class="steps">
      <li>Do mobilu si nainštaluj aplikáciu <b>ntfy</b> (App Store / Google Play, zadarmo).</li>
      <li>${topic ? 'Tvoj kanál je pripravený:' : 'Klikni na <b>Vytvoriť kanál</b>.'}</li>
      <li>V aplikácii ntfy ťukni na <b>+</b>, vlož názov kanála a ťukni <b>Subscribe</b>.</li>
      <li>Klikni na <b>Poslať skúšku</b> – do mobilu by mala prísť notifikácia.</li>
    </ol>
    <div class="row">
      <label>Kanál (názov pre ntfy)<input class="field mono" id="nfTopic" value="${esc(topic)}" readonly></label>
    </div>
    <div class="actions">
      <button type="button" class="btn" id="nfNew">${topic ? 'Nový kanál' : 'Vytvoriť kanál'}</button>
      <button type="button" class="btn" id="nfCopy" ${topic ? '' : 'disabled'}>Kopírovať</button>
      <button type="button" class="btn" id="nfTest" ${topic ? '' : 'disabled'}>Poslať skúšku</button>
    </div>
    <p class="hint-sm">Názov kanála je ako heslo – kto ho pozná, vidí tvoje pripomienky. Nikomu ho neposielaj.
      Ak ho zmeníš, treba ho v ntfy pridať znova.</p>
    <label class="checkrow"><input type="checkbox" id="nfRanny" ${n.ranny_suhrn ? 'checked' : ''}> Ranný súhrn dňa (termíny, akcie, úlohy na dnes, úlohy po termíne)</label>
    <div class="row"><label>Čas ranného súhrnu<input class="field" type="time" id="nfCas" value="${esc((n.ranny_cas || '06:45').slice(0, 5))}"></label></div>
    <div class="actions"><span class="sp"></span><button type="button" class="btn" id="nfClose">Zrušiť</button><button type="button" class="btn primary" id="nfSave">Uložiť</button></div>
  </div>`;
  document.body.appendChild(ov);
  const q = s => ov.querySelector(s);
  const close = () => ov.remove();
  ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
  q('#nfClose').onclick = close;

  let armed = false;
  q('#nfNew').onclick = () => {
    if (topic && !armed) { armed = true; q('#nfNew').textContent = 'Naozaj nový? (starý prestane fungovať)'; return; }
    topic = randomTopic();
    q('#nfTopic').value = topic;
    q('#nfCopy').disabled = false; q('#nfTest').disabled = false;
    q('#nfNew').textContent = 'Nový kanál'; armed = false;
  };
  q('#nfCopy').onclick = async () => {
    try { await navigator.clipboard.writeText(topic); toast('Skopírované'); }
    catch { q('#nfTopic').select(); toast('Označené – skopíruj Ctrl+C'); }
  };
  q('#nfTest').onclick = async () => {
    try { await testSend(topic); toast('Odoslané – pozri mobil'); }
    catch (e) { toast('Nepodarilo sa odoslať: ' + e.message); }
  };
  q('#nfSave').onclick = async () => {
    try {
      await store.saveNastavenia({
        ntfy_topic: topic || null,
        ranny_suhrn: q('#nfRanny').checked,
        ranny_cas: q('#nfCas').value || '06:45',
      });
      close(); toast('Notifikácie uložené');
    } catch (e) { toast(errText(e)); }
  };
}
