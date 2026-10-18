# Burn Yer Boats — a magazine with an admin

A magazine website hosted on **GitHub Pages**, with **Supabase** for the database, staff logins and
image storage. Staff sign in at `/admin/` to write, edit and publish articles with a rich-text
editor and image uploads.

- **Public site**: front page with a lead story, sections, article pages, search
- **Front page**: full-screen video hero. The title types itself out, then settles at the bottom and
  switches between light and dark text to stay readable over the video
- **Tags & search** (`/search/`): every article can have tags like `#food #warsaw #thebestof`. Readers
  filter by clicking tags (they combine), by section, or by typing text and `#tags` into the search box
- **Members' Board** (`/members/`): anyone can join and write posts; editors approve them before they go
  live. Every contributor gets a profile page with photo and bio
- **Dashboard** (`/admin/`): members see their own posts and profile. Editors and admins can publish
  anywhere, review members' posts, mark any number of articles as Featured, and manage sections.
  Admins also manage the team and upload the hero video in Site settings
- **How it works**: the site is plain static files (a Next.js static export). The visitor's browser
  talks to Supabase directly. Supabase Row Level Security (`supabase/schema.sql`) makes sure only
  approved staff can see drafts, write articles or upload images.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (the free tier is fine).
2. **Create the database**: in the dashboard open **SQL Editor → New query**, paste all of
   [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. Then do the same, in order, for each
   file in [`supabase/migrations/`](supabase/migrations).
3. **Connect GitHub Pages to Supabase**: in this repo on GitHub go to
   **Settings → Secrets and variables → Actions → Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL`: your Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the publishable (anon) key

   Both come from Supabase **Project Settings → API**. They are meant to be public.
4. **Re-run the deploy** (Actions → Deploy to GitHub Pages → Run workflow) or push any change.
5. In Supabase **Authentication → URL Configuration**, set the **Site URL** to your Pages address
   (e.g. `https://username.github.io/magazine/`) so email confirmation links come back to the site.
6. Open `/admin/` on the site and choose **Create account**.
   **The first account becomes the admin.** Everyone after that joins as a *member*; promote people
   to editor or admin on the **Team** page.

## Working on it locally

```bash
cp .env.example .env.local   # then fill in the two values
npm install
npm run dev
```

Open http://localhost:3000.

## Customising

- Magazine name and tagline: `src/lib/site.ts`
- Colours and fonts: `src/app/globals.css` (`:root` variables) and `src/app/layout.tsx`
- Admin styles: `src/app/admin/admin.css`
