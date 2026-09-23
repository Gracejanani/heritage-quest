# Heritage Quest — Supabase setup

The frontend is now wired for Supabase Auth, Postgres, progress/activity storage, and private certificate storage.

## 1. Create or choose a Supabase project

Use one Supabase project for Heritage Quest.

## 2. Apply the database schema

Open the Supabase SQL editor and run:

`supabase/schema.sql`

This creates:

- student profiles linked to Supabase Auth
- games, chapters and question-bank tables
- age-band question support
- quiz progress
- gameplay activity logs
- completion certificates
- private certificate Storage bucket
- Row Level Security policies

## 3. Allow register-and-enter behavior

In Supabase Dashboard → Authentication → Providers → Email:

- keep Email provider enabled
- for the requested immediate registration flow, turn **Confirm email** off

If Confirm email stays on, registration still works, but the student must verify the email before the first login.

## 4. Add frontend environment variables

Create `client/.env.local` locally:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Never put the service-role key in any `VITE_` variable.

For Vercel, add the same two variables in Project Settings → Environment Variables and redeploy.

## 5. Seed the content into Supabase

The script imports the existing games, chapters, 120-question bank, and the new age-curated temple question banks.

From `client/`:

```bash
npm install
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY \
npm run seed:supabase
```

On Windows PowerShell:

```powershell
$env:VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
npm run seed:supabase
```

The service-role key is only for this trusted local seed command. Do not commit it and do not expose it to the browser.

## 6. Age bands

The registered date of birth determines the quiz level automatically:

- Ages 1–5: **Little Explorer** — entry-level questions
- Ages 6–9: **Young Explorer** — medium questions
- Ages 10–16: **Heritage Scholar** — medium + advanced questions
- 17+: **Open Explorer** — full question set for teachers/judges/adult testing

The Temple/Monuments chapter includes new age-curated questions created from the client-provided temple reference materials.

## 7. Languages

The language selector now contains English plus all 22 Scheduled Indian languages. English, Tamil and Hindi retain curated interface strings; the additional languages use the project's runtime translation layer and cached translations.

## 8. Certificates

After a chapter is completed, the result screen exposes **Download Certificate**.

The certificate:

- uses the logged-in student's name
- uses the completed task/chapter name
- shows the completion date
- has a unique certificate ID when Supabase is available
- downloads as a PNG
- can be printed/saved as PDF
- is also uploaded to the private Supabase `certificates` bucket
