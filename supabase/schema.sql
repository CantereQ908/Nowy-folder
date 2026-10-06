-- Wklej całość w Supabase → SQL Editor → Run.

create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  email text not null default '',
  instagram text not null default '',
  role text not null check (role in ('model', 'stylist', 'makeup')),
  note text not null default '',
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

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete cascade,
  parent_id uuid references public.tasks (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  due_date date,
  due_time text not null default '',
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  publish_date date,
  publish_time text not null default '',
  format text not null default 'post' check (format in ('post', 'carousel', 'reel', 'story')),
  status text not null default 'idea' check (status in ('idea', 'ready', 'published')),
  caption text not null default '',
  hashtags text not null default '',
  person_ids uuid[] not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- Każdy zalogowany użytkownik widzi i zmienia wyłącznie swoje wiersze.
alter table public.people enable row level security;
alter table public.sessions enable row level security;
alter table public.session_people enable row level security;
alter table public.tasks enable row level security;
alter table public.posts enable row level security;

create policy "own people" on public.people for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own sessions" on public.sessions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own session_people" on public.session_people for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own tasks" on public.tasks for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own posts" on public.posts for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Zmiany na żywo między urządzeniami.
alter publication supabase_realtime add table public.people, public.sessions, public.session_people, public.tasks, public.posts;
