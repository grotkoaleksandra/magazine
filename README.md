# Margins — a magazine with an admin

A magazine website built with **Next.js** and **Supabase**. Staff sign in at `/admin` to write,
edit and publish articles with a rich-text editor and image uploads.

- **Public site**: front page with a lead story, section pages, article pages, search
- **Admin** (`/admin`): articles list, editor (drafts, publish/unpublish, cover image, inline images,
  lead story), sections, and a team page to approve new writers
- **Supabase** stores everything: Postgres for articles, Auth for logins, Storage for images.
  Row Level Security makes drafts and writing available to staff only.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).
2. **Create the database**: in the dashboard open **SQL Editor → New query**, paste the contents
   of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
3. **Add your keys**: copy `.env.example` to `.env.local` and fill in the values from
   **Project Settings → API** (the Project URL and the publishable / anon key).
4. **Run it**:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000/admin/login and choose **Create account**.
   **The first account becomes the admin.** Later accounts start as *pending*; approve them on
   the **Team** page.

> Supabase asks new users to confirm their email by default. To skip that while testing, turn off
> **Authentication → Sign In / Providers → Email → Confirm email**.

## Deploying (GitHub → Vercel)

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) choose **Add New → Project**, import the repo.
3. Add the two environment variables from `.env.local`, then **Deploy**.
4. In Supabase → **Authentication → URL Configuration**, set the Site URL to your Vercel URL.

## Customising

- Magazine name and tagline: `src/lib/site.ts`
- Colours and fonts: `src/app/globals.css` (`:root` variables) and `src/app/layout.tsx`
- Admin styles: `src/app/admin/admin.css`
