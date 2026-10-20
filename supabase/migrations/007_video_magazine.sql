-- 007: video magazine. Story types instead of sections, video stories, moderated comments,
-- likes, a moderated marketplace, an editable manifesto, and public member profiles.

-- ── Video stories ───────────────────────────────────────────
alter table public.articles add column if not exists video_url text;

-- ── Story types replace the old sections ────────────────────
insert into public.categories (name, slug, position) values
  ('Video', 'video', 1), ('Video Essay', 'video-essay', 2), ('Essay', 'essay', 3),
  ('Profile', 'profile', 4), ('Interview', 'interview', 5)
on conflict (slug) do update set name = excluded.name, position = excluded.position;

-- ── Members no longer submit stories (the editors commission them) ──
drop policy if exists "Members create own posts" on public.articles;
drop policy if exists "Members edit own unpublished posts" on public.articles;
drop policy if exists "Members delete own posts" on public.articles;

-- ── Every member has a public profile (name, photo, bio) ────
create or replace view public.authors with (security_invoker = false) as
  select p.id, p.display_name, p.bio, p.avatar_url, p.role from public.profiles p;
grant select on public.authors to anon, authenticated;

-- ── Comments: visible once an editor approves them ──────────
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  article_id bigint not null references public.articles on delete cascade,
  author_id uuid not null references public.profiles on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);
create index if not exists comments_article_idx on public.comments (article_id, created_at);
alter table public.comments enable row level security;
drop policy if exists "Read comments" on public.comments;
create policy "Read comments" on public.comments
  for select using (status = 'approved' or author_id = auth.uid() or public.is_staff());
drop policy if exists "Members write comments" on public.comments;
create policy "Members write comments" on public.comments
  for insert to authenticated with check (author_id = auth.uid() and status = 'pending');
drop policy if exists "Staff moderate comments" on public.comments;
create policy "Staff moderate comments" on public.comments
  for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "Delete own or any as staff" on public.comments;
create policy "Delete own or any as staff" on public.comments
  for delete using (author_id = auth.uid() or public.is_staff());

-- ── Likes (hearts): one per member per story, counts are public ──
create table if not exists public.likes (
  article_id bigint not null references public.articles on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);
alter table public.likes enable row level security;
drop policy if exists "Likes are public" on public.likes;
create policy "Likes are public" on public.likes for select using (true);
drop policy if exists "Like as yourself" on public.likes;
create policy "Like as yourself" on public.likes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Unlike your own" on public.likes;
create policy "Unlike your own" on public.likes for delete using (user_id = auth.uid());

-- ── Marketplace: members post, editors approve ──────────────
create table if not exists public.listings (
  id bigint generated always as identity primary key,
  author_id uuid not null references public.profiles on delete cascade,
  kind text not null default 'for-sale' check (kind in ('for-sale', 'for-rent', 'services', 'events', 'other')),
  title text not null check (char_length(title) between 1 and 140),
  body text not null default '' check (char_length(body) <= 4000),
  price text not null default '',
  location text not null default '',
  contact text not null default '',
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);
create index if not exists listings_status_idx on public.listings (status, created_at desc);
alter table public.listings enable row level security;
drop policy if exists "Read listings" on public.listings;
create policy "Read listings" on public.listings
  for select using (status = 'approved' or author_id = auth.uid() or public.is_staff());
drop policy if exists "Members post listings" on public.listings;
create policy "Members post listings" on public.listings
  for insert to authenticated with check (author_id = auth.uid() and status = 'pending');
drop policy if exists "Edit own pending listing" on public.listings;
create policy "Edit own pending listing" on public.listings
  for update using (author_id = auth.uid() and status = 'pending') with check (author_id = auth.uid() and status = 'pending');
drop policy if exists "Staff moderate listings" on public.listings;
create policy "Staff moderate listings" on public.listings
  for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "Delete own or any as staff" on public.listings;
create policy "Delete own or any as staff" on public.listings
  for delete using (author_id = auth.uid() or public.is_staff());

-- ── Manifesto text, editable in Site settings ───────────────
insert into public.settings (key, value) values ('manifesto', '') on conflict (key) do nothing;
