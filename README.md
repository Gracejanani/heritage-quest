# Heritage Quest

A modern, responsive educational gaming prototype for exploring Indian civilization, history and culture through interactive learning.

**Tagline:** Discover India Through Play!

## Client revision included

- Project branding is **Heritage Quest** throughout the UI, metadata, backend and package names.
- New **Heritage Quest** emblem/logo and favicon included.
- **12 learning chapters**.
- **10 questions per chapter** = **120 total questions**.
- **Supabase email/password registration and login** with student name and date of birth.
- Date of birth automatically selects an age band: **1–5 Entry**, **6–9 Medium**, **10–16 Medium + Advanced**, with a 17+ testing fallback.
- Every question has four mixed answer options, answer validation, a hint and a historical explanation.
- New age-curated temple questions use the client-provided temple reference material.
- English plus all **22 Scheduled Indian languages** are available in the language selector.
- Student profile, quiz progress and gameplay activity are stored in Supabase with a local browser cache for resilience.
- Completing a chapter automatically issues a personalised certificate that can be downloaded or printed and stored privately in Supabase Storage.

## Tech stack

- Frontend: React 18 + Vite + Tailwind CSS
- Routing: React Router
- Icons: Lucide React
- Animations: CSS + canvas-confetti
- Backend: Node.js + Express
- Auth / Database / Storage: Supabase Auth + Postgres + Storage
- Local resilience: per-user localStorage cache
- Backend fallback: Node.js + Express

## Main routes

- `/` Home
- `/games` Game library
- `/games/:slug` Game details
- `/learn` Learning chapters
- `/learn/:slug` Chapter details
- `/play/quiz/:chapterSlug` Interactive 10-question chapter quiz
- `/play/puzzle` Monument puzzle
- `/leaderboard` Leaderboard
- `/achievements` Achievements
- `/profile` Student profile and progress
- `/certificate/:chapterSlug` Completion certificate
- `/about` Mission / SIH concept reference

## Main API routes

- `GET /api/health`
- `GET /api/games`
- `GET /api/games/:slug`
- `GET /api/chapters`
- `GET /api/chapters/:slug`
- `GET /api/chapters/:slug/questions`
- `POST /api/quiz/check-answer`
- `GET /api/leaderboard`
- `GET /api/achievements`
- `GET /api/profile`
- `GET /api/progress`
- `POST /api/progress`
- `GET /api/challenges/daily`
- `GET /api/recommendations`
- `GET /api/search?q=...`


## Supabase setup

The repository includes:

- `supabase/schema.sql` — profiles, content tables, age-aware questions, progress, activity logs, certificates, RLS policies, secure quiz RPCs and certificate Storage policies.
- `client/scripts/seed-supabase.mjs` — imports games, chapters, the existing question bank and the new age-curated temple banks.
- `client/.env.example` — required frontend environment variable names.
- `SUPABASE_SETUP.md` — full setup instructions.

For the requested immediate register-and-enter flow, Supabase Email Auth should have **Confirm email** disabled. If it remains enabled, the student must verify the email before the first login.

## Run locally

From the project root:

```bash
npm install
npm --prefix client install
npm --prefix server install
npm run dev
```

Then open:

- Website: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- API health: `http://localhost:4000/api/health`

The backend root now also explains which URL to open, so `http://localhost:4000` will no longer show a confusing `Cannot GET /` message during development.

## Run frontend and backend separately

Terminal 1:

```bash
cd server
npm install
npm run dev
```

Terminal 2:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## Production build

```bash
npm run build
npm start
```

After `client/dist` exists, Express serves the production React build.

## Age-aware question structure

The registered date of birth determines the student's question level automatically:

- **Ages 1–5 — Little Explorer:** entry-level questions.
- **Ages 6–9 — Young Explorer:** medium-level questions.
- **Ages 10–16 — Heritage Scholar:** medium questions with advanced questions mixed in.
- **Age 17+ — Open Explorer:** full set for teachers, judges and adult testing.

For the scholar/open level, advanced questions are deliberately mixed into the quiz rather than grouped together, and answer positions are shuffled.

The Indian Monuments module also includes dedicated age-curated temple questions built from the client-provided temple references.

## Chapters

1. Ancient India
2. Indus Valley Civilization
3. Maurya Empire
4. Gupta Empire
5. Chola Dynasty
6. Mughal Empire
7. Indian Freedom Movement
8. Indian Monuments
9. Indian Art & Culture
10. Indian Festivals
11. States of India
12. Famous Personalities

## Logo files

- `client/public/heritage-quest-logo.svg`
- Reusable React logo component: `client/src/components/Logo.jsx`

## Important

This is an independent concept prototype inspired by the Smart India Hackathon 2026 problem-statement theme concerning toys and games based on Indian civilization, history and culture. It does not claim official SIH affiliation or endorsement.
