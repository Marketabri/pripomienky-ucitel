# Funkcie

Stav: `[x]` hotové v ostrej verzii, `[p]` hotové len v prototype, `[ ]` plánované.

## Typy položiek
- [x] **Úloha** – dá sa odškrtnúť, môže mať termín (dátum, čas). Po termíne sa zvýrazní červeno.
- [x] **Termín** – udalosť v konkrétny deň a čas (porada, rodičovské).
- [x] **Poznámka** – dlhší text, obrázky, dátum nepovinný.
- [x] **Školská akcia** – výlet, súťaž, exkurzia, Erasmus mobilita, olympiáda, iné.
  Môže trvať viac dní (`date_start`–`date_end`), má kategóriu, miesto, triedu/žiakov, poznámku.

## Pridávanie
- [x] Rýchle pole hore: typ + názov + dátum + čas → Enter.
- [x] Tlačidlo „+“ pri každom dni v týždennom prehľade.
- [x] Editor: typ, názov, dátum, čas, text, obrázky, zmazanie s potvrdením (druhé kliknutie).
- [x] Obrázky: tlačidlo (v mobile fotoaparát), Ctrl+V screenshot, pretiahnutie myšou.

- [x] **Zápisok** – rýchla poznámka bez dátumu v Zápisníku; tlačidlom „Zaradiť“ sa z nej stane
  úloha, termín, poznámka alebo akcia s dátumom. Podrobnosti: `docs/zapisnik.md`.

## Zobrazenia (záložky)
- [x] **Týždeň** – Po–Ne, dnešok zvýraznený, číslo týždňa, súhrn (otvorené úlohy, termíny, po termíne).
- [x] V týždni aj **rozvrh**: hodiny dňa pod dátumom, prepínač Môj / I.C / Skryť.
- [x] Viacdňové akcie sa zobrazia v každom dni rozsahu (zatiaľ nie ako súvislý pás).
- [x] **Mesiac** – kalendár, klik na deň → jeho týždeň.
- [x] **Úlohy** – skupiny: Po termíne, Dnes, Tento týždeň, Neskôr, Bez termínu; hotové skryté.
- [x] **Poznámky** – kartičky, najnovšie hore, náhľad prvého obrázka.
- [x] **Akcie** – pripravované a minulé akcie, filter podľa kategórie.
- [ ] **Rozvrh** – celý týždenný rozvrh v tabuľke (môj / I.C).

- [x] Načítanie zmien z druhého zariadenia, keď sa appka vráti do popredia (bez živej synchronizácie).

- [x] **Zápisník** – pole na rýchle písanie, zoznam zápiskov, fotka, čítanie textu z fotky (OCR).

## Ostatné
- [x] Prihlásenie e-mailom a heslom, zostať prihlásená. Registrácia vypnutá.
- [x] Inštalácia ako appka (PWA) na PC aj mobil.
- [x] Export zálohy do JSON (menu ☰). Import zatiaľ nie je.
- [ ] Vyhľadávanie v položkách.
- [ ] Opakované úlohy (každý týždeň, každý mesiac).
- [ ] Prázdniny a voľné dni – v tie dni sa rozvrh nezobrazuje.
- [x] Notifikácie na mobil cez **ntfy**: pripomienka pri položke (rýchle voľby V čase / 15 min / 1 h / deň vopred / ráno o 7:00) + voliteľný ranný súhrn dňa. Pozri `docs/notifikacie.md`.
- [x] Svetlý/tmavý režim podľa systému.
- [x] Zapamätanie naposledy otvorenej záložky (localStorage).
