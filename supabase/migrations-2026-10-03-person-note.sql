-- Notatka przy osobie. Uruchom raz w Supabase → SQL Editor, jeśli baza powstała przed tą zmianą.
alter table public.people add column if not exists note text not null default '';
