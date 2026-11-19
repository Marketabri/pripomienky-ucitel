# Migrácie

Číslované zmeny databázy: `001_popis.sql`, `002_popis.sql`, ...
Prvý stav databázy vznikol spustením `../schema.sql`, nie migráciou.

Postup pri zmene databázy:
1. Agent vytvorí nový súbor `NNN_popis.sql` a upraví `../schema.sql`.
2. Používateľka vloží obsah súboru do Supabase → SQL Editor a spustí ho.
3. Riadok o zmene sa pridá do `docs/zmeny.md`.
