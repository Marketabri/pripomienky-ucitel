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
