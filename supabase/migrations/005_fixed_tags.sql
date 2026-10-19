-- 005: a fixed, site-wide set of five broad tags.
-- Any tag outside the set is dropped from existing articles, then the set is enforced.
update public.articles
  set tags = array(select t from unnest(tags) t where t in ('events', 'life', 'ideas', 'people', 'places'));
alter table public.articles drop constraint if exists articles_tags_check;
alter table public.articles add constraint articles_tags_check
  check (tags <@ array['events', 'life', 'ideas', 'people', 'places']::text[]);
