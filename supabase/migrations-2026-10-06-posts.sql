-- Planer postów na Instagram. Uruchom raz w Supabase → SQL Editor, jeśli baza powstała przed tą zmianą.

create table if not exists public.posts (
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

alter table public.posts enable row level security;

drop policy if exists "own posts" on public.posts;
create policy "own posts" on public.posts for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

do $$
begin
  alter publication supabase_realtime add table public.posts;
exception
  when duplicate_object then null;
end $$;
