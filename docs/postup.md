# Postup práce

## Pri každej úlohe
1. Prečítaj `docs/zmeny.md` (posledné zmeny a nápady).
2. Pri väčšej zmene napíš krátky plán a počkaj na súhlas.
3. Rob malé kroky. Po každom kroku povedz, čo si zmenil a ako to vyskúšať (čo kliknúť).
4. Aktualizuj moduly podľa pravidiel v `CLAUDE.md`.

## Testovanie
- Otvoriť cez PhpStorm (Open in Browser), skontrolovať konzolu prehliadača (F12) – žiadne chyby.
- Vyskúšať na šírke mobilu (F12 → ikona mobilu, šírka 400 px).
- Pri zmene dát: pridať, upraviť, zmazať položku a overiť v Supabase → Table Editor.

## Git a nasadenie
- Commit po každej ucelenej zmene, správa po slovensky, krátko (napr. „Pridaný rozvrh do týždňa“).
- `git push` len keď to používateľka povie. Push na `main` = nová verzia na GitHub Pages.
- Do repozitára nikdy nedávať: heslá, `service_role` kľúč, súbory `.env`, export dát (`zaloha-*.json`).
  Tieto vzory majú byť v `.gitignore`.

## Čo nerobiť
- Nepridávať npm, build nástroje ani frameworky bez súhlasu.
- Nemazať dáta v databáze bez výslovného súhlasu.
- Neupravovať `prototyp/` – je to len vzor.
- Nevymýšľať časy zvonenia, predmety, dátumy akcií ani prázdnin – pýtať sa.
