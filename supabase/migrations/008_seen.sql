-- 008: remember which stories each member has already seen, so the front page can show unseen ones first
-- on any device. (Visitors who aren't logged in are remembered in their browser only.)
create table if not exists public.seen (
  user_id uuid not null references public.profiles on delete cascade,
  article_id bigint not null references public.articles on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (user_id, article_id)
);
alter table public.seen enable row level security;
drop policy if exists "Members read their own seen list" on public.seen;
create policy "Members read their own seen list" on public.seen for select using (user_id = auth.uid());
drop policy if exists "Members add to their own seen list" on public.seen;
create policy "Members add to their own seen list" on public.seen for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Members clear their own seen list" on public.seen;
create policy "Members clear their own seen list" on public.seen for delete using (user_id = auth.uid());
