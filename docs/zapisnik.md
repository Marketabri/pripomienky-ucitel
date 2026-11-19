# Zápisník

Miesto na rýchle poznámky, ktoré sa zatriedia neskôr. Hodíš tam myšlienku, kým ju nezabudneš,
a keď je čas, dáš jej dátum a typ.

## Ako to funguje
- Záložka je posledná, má ikonu ceruzky (šesť názvov sa na telefón nezmestí).
- Hore je pole na písanie. Uloží sa tlačidlom **Uložiť** alebo cez **Ctrl+Enter**.
- Pod tým sú zápisky, najnovší hore, s časom vzniku (`dnes 14:20`, `včera 9:05`).
- Kliknutím na zápisok sa otvorí editor a text sa dá prepísať.
- Tlačidlo **Zaradiť** otvorí editor s predvoleným typom *úloha* a dnešným dátumom.
  Po uložení zápisok zo Zápisníka zmizne a objaví sa v týždni a v kalendári.
  Nič sa nekopíruje – tej istej položke sa len zmení typ.

## Ako je to uložené
Zápisok je riadok v tabuľke `polozky` s `typ = 'zapis'` a bez dátumu.
Prvý riadok textu ide do `nazov`, zvyšok do `text` – aby mala položka názov,
keď sa z nej neskôr stane úloha alebo termín.

Rozpísaný (ešte neuložený) zápisok sa drží v `localStorage` pod kľúčmi
`diar-pad` (text) a `diar-pad-obrazky` (cesty k nahratým fotkám).
Fotky sa nahrávajú hneď pri výbere, preto sa musia pamätať aj po zatvorení appky –
inak by zostali v úložisku bez položky, ktorá na ne odkazuje.

## Čítanie textu z fotky (OCR)
- Knižnica **Tesseract.js** z CDN, jazyky `slk+ces`. Modul `js/ocr.js` sa načíta
  až pri prvom kliknutí na **Prečítať text z fotky** (má cez 10 MB aj s jazykovým modelom).
- Všetko beží v telefóne, fotka sa nikam neposiela.
- Prečítaný text sa **pripojí** pod to, čo je už napísané – neprepíše to.
- Funguje na tlačenom texte (papier, výveska, premietané). **Rukou písaný text číta zle** –
  to je obmedzenie technológie, nie nastavenia.
- Pri prvom použití treba internet (najlepšie wifi), potom si to prehliadač drží v pamäti.

## Čo sa ešte dá doplniť
- Zaradenie viacerých zápiskov naraz.
- Hľadanie v zápiskoch.
- Automatické rozpoznanie dátumu v texte („v piatok", „12.12.") a jeho ponúknutie pri zaradení.
