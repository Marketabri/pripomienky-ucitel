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
- Žiadne `alert()` / `confirm()` – potvrdenie priamo v rozhraní.

## Moje preferencie vzhľadu
_(sem zapisovať, čo sa mi páči / nepáči)_
