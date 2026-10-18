# Margins — a magazine with an admin

A magazine website hosted on **GitHub Pages**, with **Supabase** for the database, staff logins and
image storage. Staff sign in at `/admin/` to write, edit and publish articles with a rich-text
editor and image uploads.

- **Public site**: front page with a lead story, sections, article pages, search
- **Admin** (`/admin/`): articles list, editor (drafts, publish/unpublish, cover image, inline
  images, lead story), sections, and a Team page to approve new writers
- **How it works**: the site is plain static files (a Next.js static export). The visitor's browser
  talks to Supabase directly. Supabase Row Level Security (`supabase/schema.sql`) makes sure only
  approved staff can see drafts, write articles or upload images.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (the free tier is fine).
2. **Create the database**: in the dashboard open **SQL Editor → New query**, paste all of
   [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
3. **Connect GitHub Pages to Supabase**: in this repo on GitHub go to
   **Settings → Secrets and variables → Actions → Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL`: your Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the publishable (anon) key

   Both come from Supabase **Project Settings → API**. They are meant to be public.
4. **Re-run the deploy** (Actions → Deploy to GitHub Pages → Run workflow) or push any change.
5. In Supabase **Authentication → URL Configuration**, set the **Site URL** to your Pages address
   (e.g. `https://username.github.io/magazine/`) so email confirmation links come back to the site.
6. Open `/admin/` on the site and choose **Create account**.
   **The first account becomes the admin.** Later accounts start as *pending*; approve them on the
   **Team** page.

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
