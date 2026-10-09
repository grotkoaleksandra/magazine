-- Magazine schema for Supabase.
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.

-- ─────────────────────────────────────────────────────────────
-- Profiles: one row per login. Role decides who can use the admin.
--   admin  → can write articles and manage the team
--   editor → can write articles
--   pending → signed up but not yet approved (no admin access)
-- The very first account created becomes admin automatically.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  display_name text,
  role text not null default 'pending' check (role in ('admin', 'editor', 'pending')),
  created_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor'));
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case when exists (select 1 from profiles) then 'pending' else 'admin' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins may change anyone's role (including their own).
create or replace function public.guard_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_role_change on public.profiles;
create trigger guard_role_change
  before update on public.profiles
  for each row execute function public.guard_role_change();

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by staff" on public.profiles;
create policy "Profiles are readable by staff" on public.profiles
  for select using (public.is_staff() or id = auth.uid());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- Author names shown on public article pages.
create or replace view public.authors with (security_invoker = false) as
  select id, display_name from public.profiles where role in ('admin', 'editor');
grant select on public.authors to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Categories (sections of the magazine)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "Categories are public" on public.categories;
create policy "Categories are public" on public.categories for select using (true);

drop policy if exists "Staff manage categories" on public.categories;
create policy "Staff manage categories" on public.categories
  for all using (public.is_staff()) with check (public.is_staff());

insert into public.categories (name, slug, position) values
  ('Culture', 'culture', 1),
  ('Style', 'style', 2),
  ('Ideas', 'ideas', 3),
  ('Travel', 'travel', 4)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Articles
-- ─────────────────────────────────────────────────────────────
create table if not exists public.articles (
  id bigint generated always as identity primary key,
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  body text not null default '',
  cover_image_url text,
  category_id bigint references public.categories on delete set null,
  author_id uuid references public.profiles on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_published_idx on public.articles (status, published_at desc);

alter table public.articles enable row level security;

drop policy if exists "Published articles are public" on public.articles;
create policy "Published articles are public" on public.articles
  for select using (status = 'published' or public.is_staff());

drop policy if exists "Staff manage articles" on public.articles;
create policy "Staff manage articles" on public.articles
  for all using (public.is_staff()) with check (public.is_staff());

-- ─────────────────────────────────────────────────────────────
-- Image storage: a public "media" bucket that only staff can upload to.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "Media is public" on storage.objects;
create policy "Media is public" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "Staff upload media" on storage.objects;
create policy "Staff upload media" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_staff());

drop policy if exists "Staff update media" on storage.objects;
create policy "Staff update media" on storage.objects
  for update using (bucket_id = 'media' and public.is_staff());

drop policy if exists "Staff delete media" on storage.objects;
create policy "Staff delete media" on storage.objects
  for delete using (bucket_id = 'media' and public.is_staff());
