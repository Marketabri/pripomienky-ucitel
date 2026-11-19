-- Kontrola po spustení schema.sql. Spustiť v Supabase → SQL Editor.
-- Očakávaný výsledok: 4 tabuľky, každá so zapnutým RLS a politikou "vlastne".

select tablename as tabulka, rowsecurity as rls_zapnute
from pg_tables
where schemaname = 'public'
order by tablename;

select tablename as tabulka, policyname as politika
from pg_policies
where schemaname = 'public'
order by tablename;

select id as bucket, public as verejny
from storage.buckets
where id = 'obrazky';

select policyname as politika_uloziska
from pg_policies
where schemaname = 'storage' and tablename = 'objects' and policyname like 'obrazky%'
order by policyname;
