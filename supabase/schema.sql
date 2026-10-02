-- Wklej całość w Supabase → SQL Editor → Run.

create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  email text not null default '',
  instagram text not null default '',
  role text not null check (role in ('model', 'stylist', 'makeup')),
  created_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  session_date date not null,
  start_time text not null default '',
  end_time text not null default '',
  location text not null default '',
  description text not null default '',
  status text not null default 'planned' check (status in ('planned', 'confirmed', 'done')),
  created_at timestamptz not null default now()
);

create table public.session_people (
  session_id uuid not null references public.sessions (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (session_id, person_id)
);

-- Każdy zalogowany użytkownik widzi i zmienia wyłącznie swoje wiersze.
alter table public.people enable row level security;
alter table public.sessions enable row level security;
alter table public.session_people enable row level security;

create policy "own people" on public.people for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own sessions" on public.sessions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own session_people" on public.session_people for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Zmiany na żywo między urządzeniami.
alter publication supabase_realtime add table public.people, public.sessions, public.session_people;
