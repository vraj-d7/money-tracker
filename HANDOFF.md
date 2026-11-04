# Inhandy — handoff notes

> **For the next Claude:** read this whole file first, then continue from **"Right now"**.
> Update this file at the end of every reply (see "Keeping this file current").
>
> **For Vraj:** on a new Claude account, open this folder (`C:\Users\mevra\money-tracker`)
> in Claude Code and say: *"Read HANDOFF.md and continue from where it left off."*

_Last updated: 2026-11-04_

---

## Reminder for Vraj

**Test a real bank statement** once the site is online (Vraj's request): scan one at `/app/scan`,
then check Home and the Week page. Bring this up again after going live. The reader has only been
tested on generated statements.

## Right now

**Putting the site online with Cloudflare** (Vraj chose it over Netlify) (see the end of this section for where it stands).

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
- ✅ **Task #1 done and pushed (`32d0098`): screens use the user's own details.**
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
- ✅ **Task #2 done and pushed (`ef8a8c6`): sign-in is required** when Supabase keys are set.
  - `/app/*` and `/welcome` send signed-out visitors to `/login/email?next=…`. There's a fast check
    in Base's `<head>` (is a session saved?) and a second check at the end of the page (is the
    session still valid?). The second check is skipped while offline.
  - `/login` (phone) redirects to `/login/email` in real mode; the "Use my mobile number" link is
    hidden and the email page's close button goes to the landing page.
  - After sign-in, returning people go back to the page they wanted (`inhandy-next` in
    localStorage, same-site paths only); new accounts go to onboarding. A signed-in visit to
    `/login/email` goes straight in.
  - Test mode (no keys) is unchanged: everything stays open.
  - Constants are in `src/scripts/backend.ts`: `SIGNED_IN_PATHS`, `authStorageKey`, `NEXT_KEY`, `safeNext`.
- ✅ **Task #3 done and pushed (`d4f5d98`): saved data is readable.** `sync.ts` now writes
  `user_data.data` as format 2 (`{"_format": 2, "profile": {…}, "plan": {…}}`, real JSON values).
  Rows without `_format` (the old JSON-string-per-value style) still load. An account converts the
  next time it saves anything. Tested round trips for both formats.
- ✅ All three "before others use it" items are done.
- ✅ **Statement reading, stage 1 (pushed, `5f69ca9`):** the Autopay scan reads real statements.
  - `src/lib/statement.ts` holds the pure logic. `parseTransactions(lines)` finds rows that start
    with a date; it works out money in vs out from the column headings, Cr/Dr tags or the running
    balance; and it joins wrapped descriptions. `findAutopays(txns)` finds payees charged the same
    amount (±5%) in 2+ months at most about twice a month, plus anything with a NACH, ACH,
    e-mandate or autopay marker. It flags price rises ≥ ₹10, and it knows about 30 brands
    (`KNOWN`), with bills, SIPs, EMIs and rent marked "usually worth keeping".
  - `src/scripts/statement-read.ts`: pdf.js text → lines of cells → transactions (replaces the
    old `pdf-check.ts`). It handles password errors and "no transactions" (e.g. scanned photos).
  - `src/scripts/scan-store.ts`: the found autopays are saved as `inhandy:scan:subs` (synced to
    the account). The **raw transactions stay on the device** in `inhandy-device:statement`, which
    is never synced; they're cleared on log out and by Delete statements. "Scan a sample
    statement" (no file) still shows the sample list, with a SAMPLE note.
  - The Scan page renders results from a `<template>`; the cancel guide and the sidebar badge
    use the same list. The privacy promises were reworded to "Your PDF never leaves this device".
  - Tested with three generated statement layouts (HDFC-style with wrapped narrations, SBI-style,
    and no headings with Cr/Dr). All 64 transactions were read correctly in each, and exactly the 7
    planted autopays were found. The generator is not in the repo.
    **Not yet tested on a real bank PDF.** Vraj should try their own statement; it stays in their
    browser. If something is missed, ask what the row looks like (not the PDF itself).
- ✅ **Statement reading, stage 2 (pushed, `f872b38`):** Home, Week and the Sunday recap show real spends.
  - `src/lib/spending.ts` (pure): `latestWeek` picks the week to show; `categorize`, `methodOf`,
    `weeklyPlan` and `upcomingRenewals` do the rest. `scan-store.ts` adds `realWeek()` and
    `realRenewals()`, which pages call in their scripts. They return null until there's a real
    scan, and the sample content and SAMPLE tags stay in that case.
  - Which week: the latest Monday-to-Sunday with spends. If the statement ends mid-week and that
    isn't the current week, it uses the last full week, so a stub doesn't look like a very cheap
    week. The title is "This week" only when it's the current week, otherwise "Week of 19 Oct".
  - Spends leave out rent, SIPs, EMIs, insurance and bills (`KNOWN` entries with `keep`), because
    the jars cover those. The weekly plan is what's left after the jars, ÷ (52/12).
  - Renewals assume a monthly repeat from `lastCharged` (new field on found autopays). They're
    synced, so they also work on other devices. Spends need the device-only transactions.
    Anyone who scanned before this change needs to rescan to get `lastCharged`.
  - Sunday "Move to jar" is now real: it moves the real leftover, creates an Emergency fund goal if
    there is none (the old code silently did nothing once sample goals were removed), and moves
    only once per week (`inhandy:sunday:moved`). With sample data the button just says Next.
  - Still SAMPLE: check-in streaks (Home, Sunday) and the payday streak (Plan), because nothing
    tracks them yet. Removed a false line on the Week page about tapping a spend to re-categorise.
  - Tested: 19 logic checks with fixed dates, plus the full flow in the browser (Home, Week, Sunday,
    phone width) with a generated statement and a stand-in session. **Still not tested on a real
    bank PDF; Vraj chose to skip that for now.** The test scripts are not in the repo.
- ⏳ **Going live (current step):** `wrangler.jsonc`, `.node-version` and `public/_headers` are pushed (`a8b6d41`) and a fresh copy builds.
  Vraj signed in on the live site with email: it works (step 5 done). Pushed (`7edea30`): Home now asks for a first name when none is saved (older accounts, or Skip on the welcome screen), and `loadProfile` clears leftover sample details ("Aarav R.", sample email and phone) from old saves. Confirmed: pushing to `main` redeploys the live site automatically. Next: step 6, the real statement test.
  **First deploy succeeded on Cloudflare** (project `inhandy`, Workers, both build variables set).
  The live address is now **https://inhandy.vraj-d7.workers.dev** (subdomain changed so Vraj’s email name is out of it). It loads, the PDF worker is served as JavaScript, and `/app` redirects to email sign-in. Steps 2, 3 and 4 below are done (Supabase Site URL and redirect are set; localhost kept). Step 5, the first real sign-in, is done too. The toggles on that Cloudflare page look off, yet the address works.
  Steps left:
  2. Vraj creates a free Cloudflare account and imports `vraj-d7/money-tracker` (Workers & Pages), build command `npm run build`.
  3. Before deploying, add **build** variables `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` (the
     publishable key, same values as the local `.env`). Without them the live site runs in test mode.
  4. In Supabase → URL Configuration: set Site URL to the live address and add
     `<live address>/auth/callback`; keep the localhost redirect for development.
  5. Check the live site: real sign-in, `/app` gate, 404 page, PDF worker loads.
  6. **Then remind Vraj to test a real statement.**
- **Coach (pushed, `c438238`):** replies are still built-in, not AI, but `lib/coach.ts` now takes the item and price from the question (`parseAfford`, `parseAmount`), asks for the price if missing, and uses the user's own numbers (`scripts/coach-facts.ts`): pay, jars, payday, and latest week if scanned. The fake opening chat and sample spend chart (`SpendChart`) are gone; the side panel shows real pay and jars. Fun money is the monthly jar, not what's left this month, since balances aren't tracked.
- **Edit plan (pushed, `a132809`):** each jar has a rupee box as well as the slider. Typed amounts are stored as an exact share of take-home, so `state.jars` percentages can now be decimals; display them rounded. If the CTC changes, jars scale with it. The slider still tops out at 50% and moves in 1% steps; the box allows up to the full take-home.
- **Honest content pass (pushed, `3d9eb60`):** PF corner and Email HR carry a `SampleBanner` (no real PF data source exists). Notifications are real (`scripts/notifications.ts`): payday within 7 days, renewals within 7 days from a real scan, and the Sunday recap on Sun/Mon, all following the Me page toggles; in-app only, no phone or email alerts. `demo-notifications.ts` is gone and nav badges start hidden. Streaks are real (`lib/streaks.ts`): finishing the Sunday recap records `inhandy:checkins`; Plan has an "I filled my jars this month" button that records `inhandy:payday:filled`. The Me page PF notification toggle currently does nothing.
- **AI coach: on hold (Vraj's decision).** Revisit if the site gets more traffic; the coach keeps its built-in replies until then. A working version, tested only with simulated answers, is saved on Vraj's main computer as a git stash (`git stash list`; bring it back with `git stash pop`). It isn't on GitHub. It holds the worker, the daily limit SQL and the chat wiring. Going live would also need an Anthropic key, as a Cloudflare secret, and a model choice (Haiku 5.5 is the cheapest Claude model).
- **Motion (pushed, `d33d852`):** Lenis smooth wheel scrolling on every page (`scripts/smooth-scroll.ts`; touch stays native; a ResizeObserver re-measures because pages rebuild after load, without which Lenis can refuse to scroll). Page changes cross-fade with native CSS `@view-transition` in `global.css` (chosen over Astro's ClientRouter, which would stop page scripts re-running). Landing sections reveal on scroll (`.reveal` in `pages/index.astro`); app pages don't, so numbers aren't delayed. All off with reduced motion. Safari/Firefox support for page transitions varies; they simply switch instantly. Restoring the AI stash may conflict in `package.json` now that `lenis` is added.
- **Hero card fix (not committed yet):** the labels overlapped their amounts on small laptop widths; `.legend` is now one column from just above 1023px to 1365px.
- Later options: AI coach (see above), phone sign-in, payments, own email sender (SMTP;
  Supabase's built-in one only allows a few emails an hour, so do this before real users). The PF/ITR
  tools and notifications still use sample content from `src/data/demo-tools.ts` and `demo-notifications.ts`.

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
  - `statement-read.ts` + `lib/statement.ts`: read statement PDFs in the browser; `scan-store.ts`: scan results.
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

- `d33d852`: Lenis, page transitions, landing reveals.
- `3d9eb60`: Sample banners on PF, real notifications and streaks.
- `a132809`: Rupee boxes on Edit plan.
- `c438238`: Coach uses the asked item and the user's own numbers.
- `7edea30`: Home asks for a missing first name; old sample details cleared.
- `a8b6d41`: Cloudflare settings for going live.
- `f872b38`: Real spends and renewals on Home, Week and Sunday (stage 2).
- `5f69ca9`: Read real bank statements to find autopays (stage 1).
- `d4f5d98`: Synced data stored as readable JSON (format 2).
- `ef8a8c6`: Require sign-in for the app when Supabase is set up.
- `32d0098`: Screens use the user's own details; SAMPLE tags; payday date fix.
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
