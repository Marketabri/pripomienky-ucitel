# Architektúra

## Technológie
- **Čisté HTML + CSS + JavaScript (ES moduly)**, žiadny build, žiadny npm, žiadny framework.
  Súbory sa dajú otvoriť a upravovať priamo v PhpStorme.
- **Supabase** (bezplatný plán): databáza Postgres, prihlásenie (e-mail + heslo), úložisko obrázkov.
  Knižnica `@supabase/supabase-js` v2 sa načíta z CDN (jsDelivr, pevná verzia, nie `@latest`).
- **Hosting: GitHub Pages** – zadarmo, stránka je dostupná z počítača aj mobilu.
- **PWA**: `manifest.webmanifest` + jednoduchý `sw.js`, aby sa dala nainštalovať ako appka s ikonou na plochu (PC aj mobil).

## Štruktúra priečinkov (cieľová)
```
index.html              – kostra stránky, prihlasovacie okno, záložky
manifest.webmanifest    – PWA (názov, ikony, farby)
sw.js                   – service worker, cache len pre súbory appky (nie dáta)
css/style.css           – všetky štýly, farby ako CSS premenné
js/config.js            – SUPABASE_URL a publishable/anon kľúč (nie tajné, chránia ich pravidlá RLS)
js/supabase.js          – vytvorenie klienta, prihlásenie/odhlásenie
js/store.js             – jediné miesto, ktoré číta/zapisuje do databázy a úložiska
js/app.js               – štart, prihlásenie, záložky, rýchle pridanie, Ctrl+V / pretiahnutie obrázkov
js/ui.js                – spoločné: ikony, toast, riadok položky, zoradenie, názvy typov a kategórií
js/rozvrh.js            – výpočet a vykreslenie hodín pre deň (TN/TP, dvojhodiny, delené skupiny)
js/editor.js            – okno na úpravu položky + obrázky (vloženie, pretiahnutie, foto)
js/views/tyzden.js      – týždenný prehľad (+ rozvrh cez js/rozvrh.js)
js/views/mesiac.js      – mesačný kalendár
js/views/ulohy.js       – zoznam úloh podľa termínov
js/views/poznamky.js    – kartičky poznámok
js/views/akcie.js       – školské akcie
js/utils/datum.js       – práca s dátumami (slovenské názvy, týždeň, ISO číslo týždňa)
icons/                  – ikony PWA (192, 512 px)
supabase/schema.sql     – kompletná schéma
supabase/migracie/      – číslované zmeny databázy (001_..., 002_...)
docs/                   – moduly návodu pre agenta
prototyp/               – pôvodný prototyp, needitovať (len ako vzor)
```

## Pravidlá
- Všetok prístup k dátam ide cez `js/store.js`. Views nevolajú Supabase priamo.
- Žiadne tajné kľúče v kóde. Nikdy nepoužívaj `service_role` kľúč vo frontende.
- Obrázky sú v súkromnom buckete; zobrazujú sa cez dočasné podpísané URL (`createSignedUrl`).
- Pred nahraním zmenšiť obrázok na max. 2000 px dlhšej strany, JPEG 0.85 (ako v prototype).
- Appka musí fungovať na šírke mobilu (~400 px) aj na veľkom monitore.
- Lokálne testovanie: PhpStorm → pravý klik na `index.html` → Open in Browser
  (ES moduly nefungujú cez `file://`, treba vstavaný server PhpStormu).
- V Supabase → Authentication → URL Configuration pridať adresu GitHub Pages aj `http://localhost:63342`.

## Prototyp vs. ostrá verzia
Prototyp (`prototyp/diar-prototyp.html`) ukladal cez `window.claude.use("db")` a `use("assets")` –
to funguje len vnútri Claude. V ostrej verzii sa to nahrádza volaniami Supabase v `js/store.js`.
Zvyšok správania (zobrazenia, editor, vkladanie screenshotov cez Ctrl+V) sa preberá.
