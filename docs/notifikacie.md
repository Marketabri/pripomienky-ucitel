# Notifikácie (ntfy)

Notifikácie do mobilu idú cez **ntfy.sh** (zadarmo, appka ntfy pre iPhone aj Android).
Odosiela ich **databáza sama** – appka nemusí byť otvorená.

## Ako to funguje
1. Pri položke sa v editore nastaví **Pripomenúť** (dátum a čas) → stĺpec `polozky.pripomenut_o`.
2. V Supabase beží plánovač **pg_cron** každú minútu: `select public.posli_pripomienky()`.
3. Funkcia nájde položky, kde `pripomenut_o <= now()` a `pripomienka_odoslana is null`,
   pošle správu cez **pg_net** na `https://ntfy.sh` (JSON: topic, title, message, tags, click)
   a nastaví `pripomienka_odoslana = now()`.
4. Pripomienky staršie ako 12 h sa neposielajú (napr. keď sa projekt prebudí po uspaní), len sa označia.
5. **Ranný súhrn** (voliteľný): raz denne po `nastavenia.ranny_cas` (čas Europe/Bratislava)
   pošle termíny, akcie, úlohy na dnes a úlohy po termíne. Prázdny deň = žiadna správa.

## Nastavenie (používateľka)
- Menu ☰ → **Notifikácie** → Vytvoriť kanál → v appke ntfy „+“ → vložiť názov kanála → Poslať skúšku.
- Názov kanála (`nastavenia.ntfy_topic`) je náhodný a funguje ako heslo. Nie je v kóde ani na GitHube.

## Pravidlá pre agenta
- Zmena času pripomienky v editore vynuluje `pripomienka_odoslana` (rieši `js/store.js`).
- Ak migrácia 002 nie je spustená, appka beží ďalej bez pripomienok (`state.notifOk = false`).
- Text notifikácie skladá SQL funkcia `posli_pripomienky()` – úpravy textu robiť tam (migrácia + schema.sql).
- Kontrola, či plánovač beží: `select * from cron.job_run_details order by start_time desc limit 5;`
- Kontrola odoslaných požiadaviek: `select * from net._http_response order by created desc limit 5;`

## Obmedzenia
- Presnosť cca ±1 minúta.
- Keď je Supabase projekt uspatý (7 dní bez používania), nič sa neposiela.
- Obsah notifikácie (názov úlohy) prechádza cez verejný server ntfy.sh – nič citlivé do názvov.
