# Money Tracker

Inhandy, a money app for salaried people, built with [Astro](https://docs.astro.build).

## Getting started

```
npm install
npm run dev
```

## Designs

Screens are built from the Inhandy design canvas. A local `designs/` folder holds
its source (`*.dc.html`, plus `canvas.json` listing the pages and screen sizes) for
reference while building; it is not part of the build and is kept out of the repo.

## Data

Sample numbers live in `src/data/`. Anything the user changes (profile, plan, goals,
checklists) is saved in the browser's localStorage under `inhandy:*` keys. When
someone signs in, `src/scripts/sync.ts` copies those keys to their account in
Supabase and keeps devices in step (the last change wins).

Without Supabase keys the app runs in **test mode**: sign-in is simulated and data
stays in the browser.

## Going live (Cloudflare)

`wrangler.jsonc`, `.node-version` and `public/_headers` hold the settings. In Cloudflare, import
this repository with the build command `npm run build` and add `PUBLIC_SUPABASE_URL` and
`PUBLIC_SUPABASE_ANON_KEY` as **build** variables (they're read during the build). Then, in
Supabase's **URL Configuration**, set **Site URL** to the live address and add
`<live address>/auth/callback` under **Redirect URLs**. Keep the localhost entry so
sign-in still works in development.

## Accounts (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates the
   `user_data` table, the rules that let each person see only their own row, and the
   function behind "Delete my account".
3. In **Authentication → URL Configuration**, set **Site URL** to where the app runs
   (e.g. `http://localhost:4321`) and add `<that address>/auth/callback` under
   **Redirect URLs**. Add your live site's address too once it's deployed.
4. Copy `.env.example` to `.env` and fill in **Project URL** and the **anon public**
   key from **Project settings → API**. The anon key is safe in the browser; the
   table rules protect the data. Never put the `service_role` key here.
5. Restart the dev server.

People sign in with an emailed link. Supabase's built-in email sender only allows a
few emails an hour, which is fine for testing; connect your own email service
(Authentication → Emails → SMTP) before real users sign up. Phone codes aren't live
yet.
