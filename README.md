# Heritage Quest

A modern, responsive educational gaming prototype for exploring Indian civilization, history and culture through interactive learning.

**Tagline:** Discover India Through Play!

## Client revision included

- Project branding is **Heritage Quest** throughout the UI, metadata, backend and package names.
- New **Heritage Quest** emblem/logo and favicon included.
- **12 learning chapters**.
- **10 questions per chapter** = **120 total questions**.
- Questions are only **Medium** and **Advanced** difficulty.
- Every question has four options, answer validation, a hint and a historical explanation.
- Correct answers earn XP; advanced questions earn more XP.
- Chapter completion, score, XP, coins, accuracy, review answers and progress saving are implemented.
- Login and Sign Up pages are intentionally excluded.

## Tech stack

- Frontend: React 18 + Vite + Tailwind CSS
- Routing: React Router
- Icons: Lucide React
- Animations: CSS + canvas-confetti
- Backend: Node.js + Express
- Persistence: localStorage + JSON-backed demo state on the Node server

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
- `/profile` Explorer profile
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

## Question structure

Each chapter currently contains exactly **10 questions**, satisfying the client's 10–15 question requirement. The distribution is designed as approximately:

- 6 Medium
- 4 Advanced

Questions focus on historical reasoning, evidence, comparison, context, causation and interpretation rather than only simple recall.

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
