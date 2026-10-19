-- 006: add "music" to the site's tag set.
alter table public.articles drop constraint if exists articles_tags_check;
alter table public.articles add constraint articles_tags_check
  check (tags <@ array['events', 'life', 'ideas', 'people', 'places', 'music']::text[]);
update public.articles set tags = array['people', 'music']
  where slug = 'michael-karnow-explains-why-every-playlist-needs-exactly-one-abba-song';
update public.articles set tags = array['people', 'life', 'music']
  where slug = 'my-neighbour-plays-the-accordion-at-6-a-m-and-i-ve-started-to-love-it';
