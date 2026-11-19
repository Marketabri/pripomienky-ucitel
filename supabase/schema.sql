-- Pripomienky Učiteľ – kompletná schéma
-- Spustiť v Supabase → SQL Editor (celé naraz). Dá sa spustiť aj opakovane.

-- ============ pomocná funkcia: čas poslednej úpravy ============
create or replace function public.nastav_upravene()
returns trigger language plpgsql as $$
begin
  new.upravene = now();
  return new;
end $$;

-- ============ položky ============
create table if not exists public.polozky (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  typ         text not null check (typ in ('uloha','termin','poznamka','akcia')),
  nazov       text not null default '',
  text        text not null default '',
  datum_od    date,
  datum_do    date,
  cas_od      time,
  cas_do      time,
  hotovo      boolean not null default false,
  kategoria   text,
  miesto      text,
  trieda      text,
  obrazky     text[] not null default '{}',
  vytvorene   timestamptz not null default now(),
  upravene    timestamptz not null default now(),
  check (datum_do is null or datum_od is null or datum_do >= datum_od)
);
create index if not exists polozky_user_datum on public.polozky (user_id, datum_od);

drop trigger if exists polozky_upravene on public.polozky;
create trigger polozky_upravene before update on public.polozky
  for each row execute function public.nastav_upravene();

-- ============ rozvrh ============
create table if not exists public.rozvrh (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rozvrh      text not null check (rozvrh in ('moj','trieda')),
  den         smallint not null check (den between 1 and 5),
  hodina      smallint not null check (hodina between 1 and 8),
  predmet     text not null,
  trieda      text,
  ucitel      text,
  ucebna      text,
  skupina     text,
  tyzden      text not null default 'vsetky' check (tyzden in ('vsetky','TN','TP')),
  platne_od   date,
  platne_do   date
);
create index if not exists rozvrh_user on public.rozvrh (user_id, rozvrh, den);

-- ============ zvonenie ============
create table if not exists public.zvonenie (
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  hodina    smallint not null check (hodina between 0 and 10),
  cas_od    time not null,
  cas_do    time not null,
  primary key (user_id, hodina)
);

-- ============ voľné dni / prázdniny ============
create table if not exists public.volne_dni (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nazov     text not null,
  datum_od  date not null,
  datum_do  date not null,
  check (datum_do >= datum_od)
);

-- ============ RLS: každý vidí len svoje ============
alter table public.polozky   enable row level security;
alter table public.rozvrh    enable row level security;
alter table public.zvonenie  enable row level security;
alter table public.volne_dni enable row level security;

drop policy if exists "vlastne" on public.polozky;
create policy "vlastne" on public.polozky for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "vlastne" on public.rozvrh;
create policy "vlastne" on public.rozvrh for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "vlastne" on public.zvonenie;
create policy "vlastne" on public.zvonenie for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "vlastne" on public.volne_dni;
create policy "vlastne" on public.volne_dni for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ úložisko obrázkov (súkromné) ============
insert into storage.buckets (id, name, public)
values ('obrazky', 'obrazky', false)
on conflict (id) do update set public = false;

-- súbory sa ukladajú ako <user_id>/<nazov-suboru>
drop policy if exists "obrazky_citat" on storage.objects;
create policy "obrazky_citat" on storage.objects for select to authenticated
  using (bucket_id = 'obrazky' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "obrazky_nahrat" on storage.objects;
create policy "obrazky_nahrat" on storage.objects for insert to authenticated
  with check (bucket_id = 'obrazky' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "obrazky_upravit" on storage.objects;
create policy "obrazky_upravit" on storage.objects for update to authenticated
  using (bucket_id = 'obrazky' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "obrazky_zmazat" on storage.objects;
create policy "obrazky_zmazat" on storage.objects for delete to authenticated
  using (bucket_id = 'obrazky' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- NOTIFIKÁCIE (z migrácie 002) – vyžaduje rozšírenia pg_cron a pg_net
-- ============================================================
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- ============ pripomienka pri položke ============
alter table public.polozky add column if not exists pripomenut_o timestamptz;
alter table public.polozky add column if not exists pripomienka_odoslana timestamptz;
create index if not exists polozky_pripomienky on public.polozky (pripomenut_o)
  where pripomienka_odoslana is null;

-- ============ nastavenia (jeden riadok na používateľa) ============
create table if not exists public.nastavenia (
  user_id        uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  ntfy_topic     text,
  ranny_suhrn    boolean not null default false,
  ranny_cas      time not null default '06:45',
  posledny_suhrn date
);
alter table public.nastavenia enable row level security;
drop policy if exists "vlastne" on public.nastavenia;
create policy "vlastne" on public.nastavenia for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ odoslanie jednej správy ============
create or replace function public.ntfy_posli(topic text, nadpis text, sprava text, znacky text[] default '{}')
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://ntfy.sh',
    body := jsonb_build_object(
      'topic', topic,
      'title', nadpis,
      'message', sprava,
      'tags', to_jsonb(znacky),
      'click', 'https://marketabri.github.io/pripomienky-ucitel/'
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
end $$;

-- ============ beží každú minútu ============
create or replace function public.posli_pripomienky()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  r record;
  n record;
  teraz timestamp := now() at time zone 'Europe/Bratislava';
  dnes date := (now() at time zone 'Europe/Bratislava')::date;
  txt text;
  riadky text[];
begin
  -- 1) pripomienky pri položkách (staršie ako 12 h sa už neposielajú, len označia)
  for r in
    select p.*, s.ntfy_topic
    from polozky p join nastavenia s on s.user_id = p.user_id
    where p.pripomienka_odoslana is null and p.pripomenut_o <= now()
  loop
    if r.ntfy_topic is not null and r.pripomenut_o > now() - interval '12 hours' then
      txt := concat_ws(' · ',
        case when r.datum_od is not null then to_char(r.datum_od, 'DD.MM.') end,
        case when r.cas_od is not null then to_char(r.cas_od, 'HH24:MI') end,
        nullif(r.miesto, ''));
      if coalesce(r.text, '') <> '' then txt := concat_ws(E'\n', nullif(txt, ''), left(r.text, 300)); end if;
      perform ntfy_posli(r.ntfy_topic, coalesce(nullif(r.nazov, ''), 'Pripomienka'),
        coalesce(nullif(txt, ''), 'Pripomienka z diára'),
        array[case r.typ when 'uloha' then 'white_check_mark' when 'termin' then 'date' when 'akcia' then 'school' else 'memo' end]);
    end if;
    update polozky set pripomienka_odoslana = now() where id = r.id;
  end loop;

  -- 2) ranný súhrn dňa (raz denne po nastavenom čase)
  for n in
    select * from nastavenia
    where ranny_suhrn and ntfy_topic is not null
      and teraz::time >= ranny_cas
      and (posledny_suhrn is null or posledny_suhrn < dnes)
  loop
    riadky := '{}';
    select riadky || coalesce(array_agg(concat_ws(' ', to_char(cas_od, 'HH24:MI'), nazov) order by cas_od nulls first), '{}')
      into riadky from polozky
      where user_id = n.user_id and typ = 'termin' and datum_od = dnes;
    select riadky || coalesce(array_agg('Akcia: ' || nazov order by datum_od), '{}')
      into riadky from polozky
      where user_id = n.user_id and typ = 'akcia' and dnes between datum_od and coalesce(datum_do, datum_od);
    select riadky || coalesce(array_agg('☐ ' || nazov order by cas_od nulls last), '{}')
      into riadky from polozky
      where user_id = n.user_id and typ = 'uloha' and not hotovo and datum_od = dnes;
    select riadky || coalesce(array_agg('Po termíne: ' || nazov order by datum_od), '{}')
      into riadky from polozky
      where user_id = n.user_id and typ = 'uloha' and not hotovo and datum_od < dnes;

    if array_length(riadky, 1) > 0 then
      perform ntfy_posli(n.ntfy_topic, 'Dnes ' || to_char(dnes, 'DD.MM.'), array_to_string(riadky, E'\n'), array['sunrise']);
    end if;
    update nastavenia set posledny_suhrn = dnes where user_id = n.user_id;
  end loop;
end $$;

-- funkcie smie spúšťať len databáza (plánovač), nie appka ani návštevník
revoke all on function public.posli_pripomienky() from public, anon, authenticated;
revoke all on function public.ntfy_posli(text, text, text, text[]) from public, anon, authenticated;

-- ============ plánovač: každú minútu ============
select cron.unschedule(jobid) from cron.job where jobname = 'diar-pripomienky';
select cron.schedule('diar-pripomienky', '* * * * *', 'select public.posli_pripomienky()');
