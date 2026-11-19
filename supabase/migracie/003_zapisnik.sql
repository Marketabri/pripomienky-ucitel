-- 003 – zápisník: nový typ položky `zapis`
-- Rýchly zápisok je obyčajná položka bez dátumu. Keď jej dáš dátum a iný typ
-- (úloha / termín / poznámka / akcia), zo zápisníka zmizne a objaví sa v kalendári.
-- Spustiť v Supabase → SQL Editor.

alter table public.polozky drop constraint if exists polozky_typ_check;
alter table public.polozky add  constraint polozky_typ_check
  check (typ in ('uloha','termin','poznamka','akcia','zapis'));

-- zápisky sa vyberajú podľa typu a času vzniku (najnovší hore)
create index if not exists polozky_zapis
  on public.polozky (user_id, vytvorene desc)
  where typ = 'zapis';
