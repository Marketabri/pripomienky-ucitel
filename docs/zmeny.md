# Denník zmien a nápady

## Ďalší krok
1. Založiť Supabase projekt, spustiť `supabase/schema.sql`, vypnúť registráciu, vytvoriť účet.
2. ~~Postaviť ostrú verziu~~ hotové – doplniť kľúč do `js/config.js` a vyskúšať.
3. Spustiť `supabase/rozvrh-data.sql` (rozvrhy sú už prepísané v `docs/rozvrh.md`).
4. ~~Pridať školské akcie a rozvrh do týždňa~~ hotové (v kóde).
5. GitHub repozitár + GitHub Pages + PWA ikonka.

## Nápady (backlog)
- Notifikácie cez ntfy
- Opakované úlohy
- Vyhľadávanie
- Import zálohy
- Viacdňové akcie ako súvislý pás v týždni
- Živá synchronizácia medzi zariadeniami (Supabase Realtime)

## Denník
| dátum | zmena |
|---|---|
| 2026-11-19 | Založený git repozitár, prvý commit. Zmazaný nepoužívaný `js/views/spolocne.js` (nahradil ho `js/ui.js`). Overené: syntax všetkých modulov, importy a exporty sedia, súbory sa načítajú cez lokálny server. |
| 2026-11-19 | Ostrá verzia: index.html, css/, js/ (prihlásenie, Supabase, obrázky v súkromnom buckete, týždeň s rozvrhom Môj/I.C/Skryť, mesiac, úlohy, akcie, poznámky, export zálohy), PWA (manifest, sw.js, ikony). Otestované s falošnou databázou. |
| 2026-11-19 | Rozvrh: hodiny obmedzené na 1–8 (schema.sql + migrácia 001). Do `js/config.js` doplnená adresa Supabase projektu. Pridaný `supabase/kontrola.sql` a priečinok `supabase/migracie/`. Opravená politika úložiska `obrazky_upravit` (doplnené `with check`). |
| 2026-11-18 | Prepísané rozvrhy (môj + I.C) a zvonenie, pridaný `rozvrh-data.sql`, stĺpec `skupina`, týždne TN/TP. |
| 2026-11-18 | Založený projekt: CLAUDE.md, moduly v docs/, schema.sql, prototyp z Claude. |
