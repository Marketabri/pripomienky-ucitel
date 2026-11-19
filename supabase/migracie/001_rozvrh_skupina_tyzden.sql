-- 001 – rozvrh: delené hodiny a označenie týždňa TN/TP
-- Spustiť LEN ak si už predtým spustila staršiu verziu schema.sql
-- (bez stĺpca `skupina`, s týždňom 'A'/'B' a hodinami 0–10).
-- Ak spúšťaš aktuálny schema.sql prvý raz, táto migrácia nie je potrebná –
-- spustiť sa však dá bezpečne aj tak, nič nepokazí.

-- nový stĺpec na delené hodiny (napr. 1/3, Anj1, T2)
alter table public.rozvrh add column if not exists skupina text;

-- hodiny 1–8 namiesto 0–10
alter table public.rozvrh drop constraint if exists rozvrh_hodina_check;
alter table public.rozvrh add  constraint rozvrh_hodina_check
  check (hodina between 1 and 8);

-- týždeň: 'TN' (nepárny) a 'TP' (párny) namiesto 'A' / 'B'
alter table public.rozvrh drop constraint if exists rozvrh_tyzden_check;
update public.rozvrh set tyzden = 'TN' where tyzden = 'A';
update public.rozvrh set tyzden = 'TP' where tyzden = 'B';
alter table public.rozvrh add  constraint rozvrh_tyzden_check
  check (tyzden in ('vsetky','TN','TP'));
