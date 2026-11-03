# Inhandy — handoff notes

> **For the next Claude:** read this whole file first, then continue from **"Right now"**.
> Update this file at the end of every reply (see "Keeping this file current").
>
> **For Vraj:** on a new Claude account, open this folder (`C:\Users\mevra\money-tracker`)
> in Claude Code and say: *"Read HANDOFF.md and continue from where it left off."*

_Last updated: 2026-11-03_

---

## Right now

**Setting up Supabase so sign-in and saved data become real.** The code is done and pushed
(commit `c88d882`); only the Supabase website setup and the local `.env` file are left.

Where Vraj is in the step-by-step guide:

- ✅ Part 1: created the Supabase account, the organization **Inhandy** (Free plan) and the project
  **inhandy**. The region came out as **Central EU (Frankfurt)** instead of Mumbai; that's fine
  for testing, but it may be worth a Mumbai project before real users.
- ⏳ **Part 2 (current step):** in Supabase, open **SQL Editor**, paste the whole of
  [`supabase/schema.sql`](supabase/schema.sql), click **Run**, and expect *"Success. No rows returned"*.
  Vraj was asked to send a screenshot of the result.
- ⬜ Part 3: **Authentication → URL Configuration**: set **Site URL** to `http://localhost:4322` and
  add `http://localhost:4322/auth/callback` under **Redirect URLs**.
- ⬜ Part 4: from **Project Settings → API**, copy the **anon / publishable** key (never the
  `service_role` / secret key). The Project URL is `https://brpogrvbvethcbaimpgv.supabase.co`.
- ⬜ Then Claude creates `.env` in the project folder (it's git-ignored, never pushed):
  ```
  PUBLIC_SUPABASE_URL=https://brpogrvbvethcbaimpgv.supabase.co
  PUBLIC_SUPABASE_ANON_KEY=<anon key>
  ```
- ⬜ Then Claude checks the table and the `delete_my_account` function respond, restarts the dev
  server so it picks up `.env`, and has Vraj test a real email sign-in on `/login/email`
  (Vraj types their own email; the link should land on `/auth/callback`).

## About Vraj (how to work with them)

- Not a developer. Explain in plain words and **give step-by-step instructions** with exactly
  what to click. Screenshots of Supabase or other sites come in as images; read them and say
  what to click next.
- Builds one piece at a time and picks what's next.
- **Commit and push only when Vraj says so** (usually "Yes, push it"). After finishing work,
  ask whether to commit and push.
- Git identity for this repo (repo-local config only): `vraj-d7 <vraj-d7@users.noreply.github.com>`.
- The repo is **public**: never commit secrets (`.env` is ignored) and keep `designs/` local.

## The project

- **What:** Inhandy, a money app for salaried people in India (salary explained, offer
  face-off, jars/goals, coach chat, autopay scan, ITR, PF, Coach plan). Mascot: **Handy**.
- **Repo:** https://github.com/vraj-d7/money-tracker (public), branch `main`.
- **Designs:** a Claude Design canvas (https://claude.ai/artifact/K6jXm28vNzsc3YYinF7vrv).
  Its files are also in the local `designs/` folder, which is git-ignored. **Every page on the canvas is built.**
- **Stack:** Astro 7 static site, TypeScript, scoped `<style>`, vanilla TS `<script>` islands
  (no framework). Node 24, npm 11.
- **Run it:** `npx astro dev --background --port 4322` (stop: `npx astro dev stop`). Build
  check: `npm run build`. Open in the browser pane with `preview_start` using the **url**
  `http://localhost:4322` (starting it by name launches a different project).

### Where things are

- `src/pages/`: every screen; `src/lib/routes.ts`: every URL in one place.
- `src/layouts/`: `Base` (fonts, offline screen, starts sync), `AppShell` (sidebar / rail /
  phone tab bar), `SheetPage` (dialog-style pages), `HandySplit` (sign-up split).
- `src/components/`: Handy, Logo, AppNav, TabBar, Toast, StatePanel, Celebration,
  OfflineScreen, ConfirmDialog, Checklist, landing sections, coach pieces.
- `src/scripts/`: browser-side logic:
  - `local-state.ts`: `readLocal` / `writeLocal` / `noteChange()`. Everything is saved in localStorage under `inhandy:*`.
  - `profile-store`, `plan-store`, `subscription-store`: the saved data.
  - `backend.ts` (is Supabase configured?), `supabase.ts` (client), `sync.ts` (account sync).
  - `pdf-check.ts`: pdf.js opens the statement in the browser to check the password.
  - `reminder.ts`: `.ics` calendar reminders.
  - `share-card.ts`, `toast.ts`, `petals.ts`.
- `src/styles/global.css`: design tokens (`--ink`, `--paper`, `--mango`, `--violet`, `--coral`,
  `--mint`…), `.btn` variants, `.field`, `.rng`, `.pop-in`, `.boing`, `.petal`.
- `supabase/schema.sql`: the database setup; `.env.example`: the env keys; `README.md`: setup.

### Conventions

- Breakpoints: 1279 (narrow laptop), 1023 (tablet), 639 (phone).
- Anything that writes under `inhandy:*` must go through `writeLocal`, or call `noteChange()`,
  so it syncs to the account.
- Elements with scoped `display` rules need an explicit `[hidden] { display: none }`.
- Be honest in the UI about what's not real yet (test-mode notes, sample results).
- Verify in the browser pane at 375 / 1024 / 1440 px, then clear the `inhandy:*` localStorage keys.

## What works and what's still pretend

Real now:
- Every screen on the design canvas.
- Statement PDF password check, in the browser.
- Calendar reminders.
- Download and restore my data.
- Supabase email sign-in with account sync, **once `.env` is set up**.

Still pretend or test mode ("heavy tasks", roughly in order):
1. Finish connecting Supabase (in progress, see top).
2. Optionally require sign-in for app pages. Right now signed-out use stays in that browser only.
3. Phone code sign-in: needs an SMS provider such as MSG91 or Twilio.
4. Reading real transactions from the statement PDF (results are samples today).
5. AI replies for the Coach chat (built-in replies today).
6. Real payments for the Coach plan (checkout is test mode).
7. Reminders and emails the app sends by itself; a custom email sender (SMTP) for sign-in emails.
8. Hosting the site online (not deployed yet).

## History (newest first)

- `c88d882`: Supabase accounts (email link sign-in, sync, real log out and delete account).
- `5665b09`: PDF password check, calendar reminders, restore data, test-mode notes on sign-in.
- `e0cfa22`: States and errors (404, offline, scan empty state, celebration).
- `17af34b`: Landing page.
- `49da5aa`: Coach plan paywall, test-mode checkout, plan management.
- `0b398a0`: The rest of the app built with Astro.

## Keeping this file current

At the end of **every** reply in this project, update "Right now" (what's happening and the exact
next step), the lists above if anything changed, the "Last updated" date, and the history
when something is committed. Keep secrets (keys, passwords) out of this file.
