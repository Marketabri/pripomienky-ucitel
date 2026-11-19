# Databáza (Supabase)

Kompletné SQL je v `supabase/schema.sql`. Tento súbor je prehľad.

## Bezpečnosť
- Používateľ je len jeden. Účet sa vytvorí ručne v Supabase (Authentication → Users → Add user).
- **Registrácia vypnutá**: Authentication → Sign In / Providers → vypnúť „Allow new users to sign up“.
- Na každej tabuľke je zapnuté **RLS**: riadok vidí a mení len jeho vlastník (`user_id = auth.uid()`).
- Bucket `obrazky` je **súkromný**. Súbory sa ukladajú do priečinka `<user_id>/...`,
  pravidlá dovolia prístup len k vlastnému priečinku.
- Vo frontende sa používa len publishable (anon) kľúč. `service_role` kľúč nikdy nie je v kóde ani na GitHube.

## Tabuľky

### `polozky` – úlohy, termíny, poznámky, školské akcie
| stĺpec | typ | poznámka |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | vlastník, predvolene `auth.uid()` |
| typ | text | `uloha`, `termin`, `poznamka`, `akcia` |
| nazov | text | |
| text | text | podrobnosti |
| datum_od | date | null = bez termínu |
| datum_do | date | len pre viacdňové akcie |
| cas_od, cas_do | time | |
| hotovo | boolean | len pre úlohy |
| kategoria | text | pri akciách: vylet, sutaz, exkurzia, erasmus, olympiada, ine |
| miesto | text | |
| trieda | text | napr. I.C |
| obrazky | text[] | cesty v buckete `obrazky` |
| pripomenut_o | timestamptz | kedy poslať notifikáciu (null = nie) |
| pripomienka_odoslana | timestamptz | kedy bola odoslaná (null = ešte nie) |
| vytvorene, upravene | timestamptz | `upravene` sa nastavuje triggerom |

### `rozvrh` – opakujúce sa hodiny
| stĺpec | typ | poznámka |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | vlastník |
| rozvrh | text | `moj` alebo `trieda` |
| den | smallint | 1 = pondelok … 5 = piatok |
| hodina | smallint | číslo vyučovacej hodiny (1–8); dvojhodina = 2 riadky |
| predmet | text | |
| trieda | text | pri mojom rozvrhu: ktorú triedu učím |
| ucitel | text | pri rozvrhu triedy: kto učí |
| ucebna | text | |
| skupina | text | napr. 1/3, Anj1, T2 (delené hodiny) |
| tyzden | text | `vsetky`, `TN` (nepárny), `TP` (párny) |
| platne_od, platne_do | date | rozvrh sa môže počas roka zmeniť |

### `zvonenie` – časy hodín
| hodina | smallint PK spolu s user_id |
| cas_od, cas_do | time |

### `volne_dni` – prázdniny a voľné dni (rozvrh sa vtedy nezobrazuje)
| datum_od, datum_do | date |
| nazov | text |

### `nastavenia` – jeden riadok na používateľa
| stĺpec | typ | poznámka |
|---|---|---|
| user_id | uuid | PK |
| ntfy_topic | text | názov kanála ntfy (tajný) |
| ranny_suhrn | boolean | posielať ranný súhrn |
| ranny_cas | time | čas súhrnu (Europe/Bratislava) |
| posledny_suhrn | date | aby sa súhrn poslal len raz denne |

### Funkcie a plánovač
- `ntfy_posli(topic, nadpis, sprava, znacky)` – odošle správu cez pg_net.
- `posli_pripomienky()` – každú minútu (pg_cron job `diar-pripomienky`). Podrobnosti: `docs/notifikacie.md`.

## Migrácie
Každá zmena databázy = nový súbor `supabase/migracie/NNN_popis.sql`
a zároveň úprava `schema.sql`, aby schema vždy popisovala aktuálny stav.
SQL spúšťa používateľka v Supabase → SQL Editor. Agent jej presne napíše, čo vložiť.
