-- 003: site settings (e.g. the front-page hero video), editable by admins.
create table if not exists public.settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

drop policy if exists "Settings are public" on public.settings;
create policy "Settings are public" on public.settings for select using (true);

drop policy if exists "Admins manage settings" on public.settings;
create policy "Admins manage settings" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());
