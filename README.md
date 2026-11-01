# NNN — November 2026

A fixed-window daily challenge for November 1–30, 2026. One mark per local day, a public leaderboard ranked by streaks, private daily clips, and a shareable receipt for every handle.

Built with **Next.js 16 (App Router)**, **Supabase** (Postgres, Auth, Storage), **Tailwind CSS 4**, and deployed on **Vercel**.

---

## What it does

- **Google sign-in only.** Supabase Auth handles OAuth; there are no passwords.
- **One mark per day, today only.** Undo is available until the user's local midnight. No backfill, no editing past days.
- **Per-user timezone, decided server-side.** The browser clock is never trusted. A timezone change is queued and takes effect at the new zone's next local midnight.
- **Streaks.** Missing a day breaks the current streak; the best streak survives. Days before a user joined are excused.
- **Public board.** Handles only, ranked by best streak → current streak → days marked → handle. Only users with at least one mark appear.
- **Private clips.** Stored in a private Supabase Storage bucket, served through short-lived signed URLs. A missing clip shows a placeholder and never blocks a mark.
- **Share page + card.** `/share/<handle>` renders the public record; `/share/<handle>/card` downloads a 1200×630 PNG, and the same design is used for Open Graph.
- **Frozen December.** The challenge is open only while the user's local date is within November 2026. Afterwards everything is read-only; signups remain possible.
- **Hourly reminders.** A Vercel Cron job queries due users and logs a stubbed send. Delivery is intentionally not implemented.

---

## Requirements

- Node.js 20+
- A Supabase project
- A Google Cloud OAuth client
- (Optional) Vercel CLI / a Vercel account for deployment

---

## 1. Install

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` (see [Environment variables](#environment-variables)).

---

## 2. Set up Supabase

### 2.1 Run the migration

Open your Supabase project → **SQL Editor** → paste the contents of:

```
supabase/migrations/20261101000000_init.sql
```

Run it once. It creates:

- `public.profiles`, `public.marks`, `public.reminder_log`
- RLS policies (users can only read their own profile/marks)
- Security-definer RPCs: `onboard`, `set_timezone`, `mark_today`, `unmark_today`, `dashboard_state`, `leaderboard`, `public_profile`, `due_reminders`
- The private `clips` Storage bucket
- Grants (public board functions for `anon`; writes only for `authenticated`; reminders for `service_role`)

Run it once on a fresh project. The function and bucket definitions are replaceable, but the tables and policies are not dropped/recreated — re-running the file will fail on the existing tables. Adapt it if you already have conflicting objects.

### 2.2 Enable Google auth

1. In Google Cloud Console, create an **OAuth 2.0 Client ID** (Web application).
2. Add authorized redirect URIs:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://your-domain.com/auth/callback`
   - Supabase's own callback: `https://<project-ref>.supabase.co/auth/v1/callback`
3. In Supabase → **Authentication → Providers → Google**, enable the provider and paste the Client ID and Secret.
4. In Supabase → **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` for local, your production URL for deploy
   - Redirect URLs: add both `/auth/callback` URLs above

No email/password provider is needed. The app only exposes the Google button.

### 2.3 Upload clips

Clips are **not** served from `/public`. They live in the private `clips` bucket created by the migration.

Upload files through **Supabase Dashboard → Storage → clips** (or the Supabase CLI). The bucket stays private.

Filenames must match:

```
day-01.mp4
day-02.webm
day-14.gif
```

Rules:

- `day-NN` where `NN` is `01`–`30`
- Extension: `mp4`, `webm`, or `gif`
- One file per day; if multiple formats exist, `mp4` wins, then `webm`, then `gif`
- `.gif` is treated as an image; the others as video
- The bucket listing is cached for 60 seconds

A day with no file is fine — the mark still counts and the popup shows a placeholder.

---

## 3. Environment variables

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only. Never prefix with NEXT_PUBLIC_.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=replace-with-a-long-random-string
SUPABASE_CLIPS_BUCKET=clips
```

| Variable | Where it is used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Public project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Public anon key; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Signs clip URLs, lists the bucket, runs the reminder query. **Never** expose it to the client. |
| `NEXT_PUBLIC_SITE_URL` | Metadata, OG, share links | No trailing slash |
| `CRON_SECRET` | `/api/cron/reminders` | Vercel sends `Authorization: Bearer <secret>` |
| `SUPABASE_CLIPS_BUCKET` | Storage helper | Optional; defaults to `clips` |

> **Warning:** the service-role key bypasses RLS. Keep it in server-side environment variables only. Never rename it to `NEXT_PUBLIC_*`, and never import it into a client component.

If Supabase variables are missing, the public pages still render with empty data so you can work on the UI. Auth, marking, and clips require a configured project.

---

## 4. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run typecheck
npm run build
```

---

## 5. Reminders (stubbed)

`GET /api/cron/reminders` is protected by `CRON_SECRET` and scheduled hourly in `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }]
}
```

Each run:

1. Calls the `due_reminders()` RPC (users whose local hour is 20:00, who have not marked, and who have not been logged today).
2. Inserts a row into `reminder_log` (`unique (user_id, local_date)` prevents duplicates).
3. Calls `sendReminderStub()`, which only logs to the server console.

To wire a real sender later, replace the stub in `src/lib/reminders.ts`. Do not move deduplication out of the database.

For manual testing:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders
```

---

## 6. Deploy to Vercel

1. Push the repository to GitHub/GitLab.
2. Import the project into Vercel.
3. Add all environment variables from `.env.local` to the Vercel project (Production and Preview).
4. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
5. Add the production `/auth/callback` URL to Supabase redirect URLs and Google OAuth. Preview deployments use their own `*.vercel.app` origin, so add a wildcard redirect (or only test sign-in on the production domain).
6. Deploy. Vercel picks up `vercel.json` and registers the hourly cron.
7. In Vercel → Project → Cron Jobs, confirm the job is listed. Vercel injects `CRON_SECRET` as the bearer token when the variable exists.

After the first deploy, verify:

- Google sign-in returns to `/auth/callback` and lands on `/onboarding`
- A handle can be claimed
- Marking today works and the popup plays (or shows a placeholder)
- The board and `/share/<handle>` render
- `/share/<handle>/card` downloads a PNG

---

## How the rules are enforced

| Rule | Where |
| --- | --- |
| Day = November day in the user's timezone | `mark_today`, `dashboard_state`, `leaderboard` (SQL) |
| No backfill / today only | `mark_today` derives the day from the server clock; `unmark_today` only deletes today's local date |
| Duplicate marks impossible | `primary key (user_id, challenge_day)` + `on conflict do nothing` |
| Streaks | `private.user_streaks` (gaps-and-islands) |
| Board ordering | `public.leaderboard()` |
| Public data limited to handles/stats | `public_profile()` returns no email, name, or avatar |
| Private clips | Private bucket + service-role signed URLs; `/api/clip/*` checks auth and mark ownership |
| Timezone changes | `set_timezone` queues `pending_timezone_at`; `activate_timezone` applies it at the new zone's next midnight |
| Reminder dedupe | `reminder_log unique (user_id, local_date)` |

The month is never flipped by a cron job. Open/closed state is derived from the current date in code/SQL, so December is read-only automatically.

---

## Project structure

```
src/
  app/
    api/
      auth/login, auth/signout
      clip/[day], clip/today        # signed clip access
      cron/reminders                # hourly stub
      mark                          # POST / DELETE today
    auth/callback                   # Supabase OAuth exchange
    dashboard/                      # private dashboard + actions
    leaderboard/                    # public board
    login/, onboarding/
    share/[handle]/                 # public record, OG image, PNG card
  components/                       # UI (grid, popup, table, etc.)
  lib/
    board.ts, clips.ts, challenge.ts, format.ts, validation.ts
    supabase/ (server, public, admin clients)
supabase/migrations/                # schema, RLS, RPCs, storage bucket
```

---

## Notes and limits

- Handles are immutable after onboarding. There is no rename flow.
- Clips are not transcoded. Upload browser-friendly `mp4`/`webm` (or `gif`).
- There is no moderation UI; the handle blocklist is intentionally small and lives in both `src/lib/validation.ts` and the SQL migration.
- No PWA, push notifications, analytics, payments, or admin panel.
- `src/proxy.ts` refreshes Supabase sessions and guards `/dashboard` and `/onboarding`.
- The public leaderboard's phase badge uses UTC; ranking and marking use each user's server-side timezone.
