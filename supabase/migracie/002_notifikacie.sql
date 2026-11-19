-- 002 – notifikácie na mobil cez ntfy (docs/notifikacie.md)
-- Spustiť v Supabase → SQL Editor (celé naraz). Dá sa spustiť aj opakovane.
-- Ak hlási chybu pri "create extension", zapni pg_cron a pg_net ručne:
--   Database → Extensions → vyhľadaj pg_cron → Enable, to isté pg_net. Potom spusti znova.

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
