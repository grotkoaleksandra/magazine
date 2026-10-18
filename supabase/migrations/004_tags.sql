-- 004: free-form tags on articles (#food, #warsaw, #thebestof …), stored lowercase without "#".
alter table public.articles add column if not exists tags text[] not null default '{}';
create index if not exists articles_tags_idx on public.articles using gin (tags);
