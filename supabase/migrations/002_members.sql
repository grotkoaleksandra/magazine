-- 002: open membership, Members' Board with review queue, multiple featured articles.
-- Already applied to the live project. A fresh install only needs schema.sql (which includes this).

-- ── Roles: anyone who signs up becomes a member ─────────────
alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'member' where role = 'pending';
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'editor', 'member'));
alter table public.profiles alter column role set default 'member';
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists avatar_url text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case when exists (select 1 from profiles) then 'member' else 'admin' end
  );
  return new;
end;
$$;

-- ── Articles: magazine pieces vs. Members' Board posts, plus a review state ──
alter table public.articles add column if not exists kind text not null default 'magazine';
alter table public.articles drop constraint if exists articles_kind_check;
alter table public.articles add constraint articles_kind_check check (kind in ('magazine', 'member'));
alter table public.articles drop constraint if exists articles_status_check;
alter table public.articles add constraint articles_status_check check (status in ('draft', 'pending', 'published'));

drop policy if exists "Published articles are public" on public.articles;
drop policy if exists "Read articles" on public.articles;
create policy "Read articles" on public.articles
  for select using (status = 'published' or public.is_staff() or author_id = auth.uid());

-- "Staff manage articles" (from schema.sql) still lets admins/editors do anything.

-- Members may write Board posts and submit them for review, but never publish or feature them.
drop policy if exists "Members create own posts" on public.articles;
create policy "Members create own posts" on public.articles
  for insert to authenticated
  with check (author_id = auth.uid() and kind = 'member' and status in ('draft', 'pending') and featured = false);

drop policy if exists "Members edit own unpublished posts" on public.articles;
create policy "Members edit own unpublished posts" on public.articles
  for update to authenticated
  using (author_id = auth.uid() and status in ('draft', 'pending'))
  with check (author_id = auth.uid() and kind = 'member' and status in ('draft', 'pending') and featured = false);

drop policy if exists "Members delete own posts" on public.articles;
create policy "Members delete own posts" on public.articles
  for delete to authenticated using (author_id = auth.uid());

-- ── Public author info: staff, plus members with at least one published post ──
create or replace view public.authors with (security_invoker = false) as
  select p.id, p.display_name, p.bio, p.avatar_url, p.role
  from public.profiles p
  where p.role in ('admin', 'editor')
     or exists (select 1 from public.articles a where a.author_id = p.id and a.status = 'published');
grant select on public.authors to anon, authenticated;

-- ── Images: members upload into their own folder (media/<user id>/...) ──
drop policy if exists "Staff upload media" on storage.objects;
drop policy if exists "Users upload media" on storage.objects;
create policy "Users upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (public.is_staff() or (storage.foldername(name))[1] = auth.uid()::text));

drop policy if exists "Staff update media" on storage.objects;
drop policy if exists "Users update media" on storage.objects;
create policy "Users update media" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (public.is_staff() or (storage.foldername(name))[1] = auth.uid()::text));

drop policy if exists "Staff delete media" on storage.objects;
drop policy if exists "Users delete media" on storage.objects;
create policy "Users delete media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (public.is_staff() or (storage.foldername(name))[1] = auth.uid()::text));
