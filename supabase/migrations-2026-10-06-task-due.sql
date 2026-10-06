-- Termin (data i godzina) przy zadaniach. Uruchom raz w Supabase → SQL Editor, jeśli baza powstała przed tą zmianą.
alter table public.tasks add column if not exists due_date date;
alter table public.tasks add column if not exists due_time text not null default '';
