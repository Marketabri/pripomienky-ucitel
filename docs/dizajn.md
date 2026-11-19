# Dizajn

Vzor je `prototyp/diar-prototyp.html` – prevziať z neho CSS premenné a vzhľad.

## Farby (CSS premenné, svetlý / tmavý režim)
- `--bg` pozadie, `--surface` karty, `--sunk` víkendy a vnorené plochy
- `--ink` text, `--muted` vedľajší text, `--line` okraje
- `--accent` modrá – **úlohy**, hlavné tlačidlá
- `--event` tyrkysová – **termíny**
- `--note` oranžová – **poznámky**
- `--school` _doplniť pri implementácii_ – **školské akcie** (odlíšiteľná od ostatných v oboch režimoch)
- `--danger` červená – po termíne, mazanie
- `--marker` žltá – zvýraznenie dneška
- Tmavý režim cez `@media (prefers-color-scheme: dark)`; každá farba musí byť definovaná pre oba režimy.

## Písmo (Google Fonts)
- Nadpisy: Bricolage Grotesque
- Text: Figtree
- Čísla, časy: JetBrains Mono

## Pravidlá
- Typ položky = farebný pásik vľavo (úloha, termín, poznámka, akcia).
- Texty v rozhraní po slovensky, krátke, bez anglických slov.
- Ovládacie prvky min. 34 px vysoké (dotyk v mobile).
- Na mobile sa týždeň zobrazí ako dni pod sebou, od 1100 px ako 7 stĺpcov.
- **Appka sa používa hlavne na mobile** – nové prvky najprv skontroluj na šírke 360–400 px.
  Pravidlá pre mobil (sekcia `@media (max-width:760px)` v `css/style.css`):
  hlavička čo najnižšia (je sticky), polia `.field` majú 16 px (inak iOS pri písaní priblíži stránku),
  ovládacie prvky min. 34 px, editor vychádza zdola ako zásuvka (klávesnica ho neprekryje),
  prvky len pre počítač (Ctrl+V, pretiahnutie myšou) sa skrývajú – trieda `.len-pc`.
- Žiadne `alert()` / `confirm()` – potvrdenie priamo v rozhraní.

## Celkový charakter
Pokojný a čistý (vybrané 19. 11. 2026): málo rámov a tieňov, viac voľného miesta,
silná typografia, farba len ako pásik vľavo pri položke – nie ako plocha.
- Deň v týždni nie je karta, len nadpis s linkou pod ním. Na monitore (od 1100 px) je
  deň jemná karta, aby sa 7 stĺpcov od seba odlíšilo.
- Rozvrh je odsadený zvislou linkou, bez farebného pozadia.
- Číslo týždňa je malým písmom nad dátumom, nie pred ním.
- Žltý marker zostáva len na dnešku a práve prebiehajúcej hodine – inak sa stratí.

## Moje preferencie vzhľadu
_(sem zapisovať, čo sa mi páči / nepáči)_
