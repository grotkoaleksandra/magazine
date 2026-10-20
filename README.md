# Burn Yer Boats — a magazine with an admin

A magazine website hosted on **GitHub Pages**, with **Supabase** for the database, staff logins and
image storage. Staff sign in at `/admin/` to write, edit and publish articles with a rich-text
editor and image uploads.

- **A video magazine** by the members, for the members: the front page is one full-screen story after
  another (video or photo), with a heart count. Story types: Video, Video Essay, Essay, Profile, Interview
- **Menu**: Videos · Stories · Profiles · Manifesto · Marketplace · Search
- **Hero**: the title types itself out, pans down, then the video montage fades in; the title inverts
  against the video. If the browser blocks autoplay (e.g. Safari Low Power Mode) a "tap to play" appears
- **Community**: anyone can join and get a profile (photo, bio). Members like stories, comment (comments
  appear after an editor approves them) and post in the Marketplace (also approved first)
- **Dashboard** (`/admin/`): editors write stories (with video upload), approve comments and marketplace
  posts, and manage story types; admins also manage the team and Site settings (hero video, manifesto)
- **Extras**: an "Are you stupid?" IQ test at `/iq-test/`, search with six broad tags

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
