# Denník zmien a nápady

## Ďalší krok
1. ~~Supabase projekt, schéma, vypnutá registrácia, účet~~ hotové
   (overené cez API: tabuľky existujú, RLS chráni dáta, registrácia vypnutá).
2. ~~Postaviť ostrú verziu~~ hotové – kľúč v `js/config.js` je doplnený a funguje.
3. ~~Spustiť `supabase/rozvrh-data.sql`~~ hotové.
4. ~~Pridať školské akcie a rozvrh do týždňa~~ hotové (v kóde).
5. ~~GitHub repozitár + GitHub Pages + PWA ikonka~~ hotové.
6. Vyskúšať appku na počítači aj mobile: prihlásenie, pridanie úlohy/termínu/poznámky,
   obrázok (Ctrl+V aj fotka z mobilu), rozvrh v týždni, export zálohy.
7. Spustiť `supabase/migracie/002_notifikacie.sql`, nainštalovať ntfy do mobilu, nastaviť v appke (☰ → Notifikácie), commit + push.
8. Doplniť plné názvy predmetov a prázdniny (`volne_dni`) – pozri `docs/rozvrh.md`.
9. Spustiť `supabase/migracie/003_zapisnik.sql` (bez nej sa zápisok neuloží).

## Adresy
- Appka: https://marketabri.github.io/pripomienky-ucitel/
- Repozitár (verejný): https://github.com/Marketabri/pripomienky-ucitel
- Supabase projekt: https://niiwcbetbbgkkdzslyse.supabase.co

Repozitár je verejný (GitHub Pages to na bezplatnom pláne vyžadujú), preto
`docs/rozvrh.md` a `supabase/rozvrh-data.sql` sú v `.gitignore` a zostávajú len v počítači.

## Nápady (backlog)
- Opakované úlohy
- Vyhľadávanie
- Import zálohy
- Viacdňové akcie ako súvislý pás v týždni
- Živá synchronizácia medzi zariadeniami (Supabase Realtime)

## Denník
| dátum | zmena |
|---|---|
| 2026-11-19 | Notifikácie: migrácia 002 (pripomenut_o, tabuľka nastavenia, pg_cron + pg_net, ranný súhrn), pole Pripomenúť v editore, zvonček pri položke, menu ☰ → Notifikácie, `docs/notifikacie.md`. Otestované SQL na testovacej databáze a appka s falošnou databázou. |
| 2026-11-19 | **Zápisník** (nová záložka s ikonou ceruzky): pole na rýchle písanie, zoznam zápiskov, tlačidlo „Zaradiť“ (dá zápisku typ a dátum), fotka a čítanie textu z fotky cez Tesseract.js. Nový typ položky `zapis` – **treba spustiť migráciu `003_zapisnik.sql`**. Popis v `docs/zapisnik.md`. |
| 2026-11-19 | Nový vzhľad „pokojnejšie a čistejšie“: dni bez kariet (len nadpis s linkou), položky bez plochy, rozvrh odsadený linkou, číslo týždňa nad dátumom, jemnejšie pozadie a tiene, menej rámov. Charakter zapísaný do `docs/dizajn.md`. |
| 2026-11-19 | Úpravy pre mobil (hlavné zariadenie): nižšia hlavička, dátum a čas vedľa seba, polia 16 px (bez priblíženia na iOS), ovládacie prvky min. 34 px, editor ako zásuvka zdola, skrytá nápoveda o Ctrl+V, prázdne dni bez zbytočnej výšky, rešpektovanie safe-area v PWA. |
| 2026-11-19 | Databáza nasadená v Supabase. Overené cez API: 4 tabuľky existujú, RLS neprihlásenému nič nevydá, registrácia vypnutá, prihlásenie e-mailom zapnuté. |
| 2026-11-19 | GitHub: verejný repozitár `Marketabri/pripomienky-ucitel`, zapnuté GitHub Pages (appka beží na adrese vyššie). Rozvrhy (`docs/rozvrh.md`, `supabase/rozvrh-data.sql`) pridané do `.gitignore` – zostávajú len lokálne. |
| 2026-11-19 | Založený git repozitár, prvý commit. Zmazaný nepoužívaný `js/views/spolocne.js` (nahradil ho `js/ui.js`). Overené: syntax všetkých modulov, importy a exporty sedia, súbory sa načítajú cez lokálny server. |
| 2026-11-19 | Ostrá verzia: index.html, css/, js/ (prihlásenie, Supabase, obrázky v súkromnom buckete, týždeň s rozvrhom Môj/I.C/Skryť, mesiac, úlohy, akcie, poznámky, export zálohy), PWA (manifest, sw.js, ikony). Otestované s falošnou databázou. |
| 2026-11-19 | Rozvrh: hodiny obmedzené na 1–8 (schema.sql + migrácia 001). Do `js/config.js` doplnená adresa Supabase projektu. Pridaný `supabase/kontrola.sql` a priečinok `supabase/migracie/`. Opravená politika úložiska `obrazky_upravit` (doplnené `with check`). |
| 2026-11-18 | Prepísané rozvrhy (môj + I.C) a zvonenie, pridaný `rozvrh-data.sql`, stĺpec `skupina`, týždne TN/TP. |
| 2026-11-18 | Založený projekt: CLAUDE.md, moduly v docs/, schema.sql, prototyp z Claude. |
