# Pripomienky Učiteľ – hlavný návod pre agenta

Osobný diár učiteľky: úlohy, termíny, poznámky so screenshotmi a fotkami,
školské akcie (výlety, súťaže, exkurzie, Erasmus) a rozvrhy (môj + trieda I.C).
Používa ho jedna osoba na dvoch zariadeniach: počítač + mobil.

## Ako so mnou hovoriť
- Komunikuj po slovensky, stručne a vecne. Bez zbytočných úvodov.
- Pred väčšou zmenou (nová tabuľka, zmena štruktúry, mazanie dát) najprv napíš plán v 3–5 bodoch a počkaj na súhlas.
- Malé úpravy (text, farba, oprava chyby) rob rovno.
- Nikdy si nevymýšľaj údaje (časy zvonenia, predmety, dátumy akcií). Ak chýbajú, opýtaj sa.

## Moduly (podrobnosti sú v samostatných súboroch)
Hlavný súbor drž krátky. Všetko podrobné patrí do modulov v `docs/`.

@docs/architektura.md
@docs/funkcie.md
@docs/databaza.md
@docs/postup.md

Čítaj podľa potreby (nie sú načítané automaticky):
- `docs/rozvrh.md` – rozvrh hodín, zvonenie, týždeň TN/TP. Čítaj pri práci s rozvrhom.
- `docs/dizajn.md` – farby, písmo, pravidlá vzhľadu. Čítaj pri úprave vzhľadu.
- `docs/zmeny.md` – denník zmien a zoznam nápadov. Čítaj na začiatku novej úlohy.
- `prototyp/diar-prototyp.html` – pôvodný funkčný prototyp z Claude. Vzor pre správanie a vzhľad.
- `supabase/schema.sql` – tabuľky, pravidlá prístupu, úložisko obrázkov.

## Udržiavanie modulov (dôležité)
- Keď pridáš alebo zmeníš funkciu, uprav `docs/funkcie.md` (sekcia Hotové / Plánované).
- Keď zmeníš databázu, uprav `supabase/schema.sql` aj `docs/databaza.md` a napíš novú migráciu do `supabase/migracie/`.
- Po každej dokončenej úlohe pridaj riadok do `docs/zmeny.md` (dátum, čo sa zmenilo).
- Keď používateľka povie „toto si zapamätaj“ alebo „takto to chcem vždy“, zapíš to do príslušného modulu, nie sem.
- Nový modul (napr. `docs/notifikacie.md`) vytvor, keď téma presiahne cca 30 riadkov, a pridaj odkaz do zoznamu vyššie.
