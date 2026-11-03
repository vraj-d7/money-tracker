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
- ✅ Part 2: Vraj ran [`supabase/schema.sql`](supabase/schema.sql) in the SQL Editor and said it
  was done (no screenshot of the result, so confirm the `user_data` table exists once `.env` is set).
- ✅ Part 3: Site URL is `http://localhost:4322` and Redirect URLs has
  `http://localhost:4322/auth/callback` (confirmed from a screenshot).
- ✅ Part 4: `.env` is created in the project folder with the URL and the **publishable** key.
  It's git-ignored and was never pushed; if it's missing on another machine, Vraj can copy the
  publishable key again from Project Settings → API Keys.
- ✅ Checked from outside: the `user_data` table answers (empty for signed-out visitors),
  `delete_my_account` refuses signed-out callers, and email sign-in is enabled.
- ✅ The dev server was restarted with `.env`; `/login/email` now runs in real mode, with no test-mode button.
- ✅ **First real sign-in worked**: Vraj signed in with their email in Chrome, opened the link
  and reached the app.
- ✅ Authentication → Users lists **two accounts** (Vraj signed in with two different emails).
- ✅ Table Editor → `user_data` has a row per account (one `{}`, one with the profile), and
  shows "4 RLS policies". **Supabase setup is complete and syncing works.**
- Possible tidy-up later: `sync.ts` stores each value as a JSON string inside `data`, so the
  dashboard shows escaped `\"`. Storing parsed values would read better, but sync would need to
  accept both formats.
- ✅ **Task #1 done (not committed yet): screens use the user's own details.**
  - The profile now starts blank (no "Aarav", no sample email or phone). The welcome screen asks
    "What should we call you?" (required; prefilled if phone sign-up already saved a name).
  - Home shows today's real date, the user's name, and their payday countdown, date and expected
    pay from their saved payday and CTC.
  - Plan, Edit plan and SIP use the user's own monthly take-home and next payday. New users start
    with **no goals** (the sample goals were removed).
  - Salary explained opens on the user's CTC and their better tax regime.
  - The sidebar, Me and first-day screens no longer pre-render sample details.
  - Still sample data, now marked with a dashed **SAMPLE** tag: the weekly spends, renewals and
    check-in streak (Home), the Week page, the Sunday recap, and the payday streak (Plan). These
    need real statement reading (heavy task #4).
  - New helpers in `profile-store.ts`: `paydayCycle`, `monthlyInhand`, `shortDate`, `longDate`.
  - Fixed an older bug: `nextPayday` could return a past date when a weekend shift moved a salary
    day across a month boundary. Checked against a brute-force count for all 64 settings over 400 days.
- ⏳ **Next:** ask Vraj whether to commit and push. Then the remaining "before others use it"
  items: **require sign-in** for app pages, and tidy the saved data format. Not touched yet: the
  PF/ITR tools and notifications still use sample content from `src/data/demo-tools.ts` and
  `demo-notifications.ts`.

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

- `2fc6617`: This handoff file and CLAUDE.md.
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
