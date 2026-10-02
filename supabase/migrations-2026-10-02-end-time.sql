-- Godzina zakończenia sesji. Uruchom raz w Supabase → SQL Editor, jeśli baza powstała przed tą zmianą.
alter table public.sessions add column if not exists end_time text not null default '';
