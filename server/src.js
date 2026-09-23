import express from 'express'
import cors from 'cors'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getAgeQuestionBank } from '../client/src/data/ageQuestionBanks.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const PORT = process.env.PORT || 4000
const stateFile = path.join(__dirname, 'data', 'state.json')
const contentFile = path.join(__dirname, 'data', 'content.json')

app.use(cors())
app.use(express.json({ limit: '250kb' }))

const content = JSON.parse(await fs.readFile(contentFile, 'utf8'))
const { games, chapters, questionsByChapter, achievements, leaderboard } = content

const defaultState = {
  profile: {
    name: 'Oviya', title: 'Proud to Explore India’s Heritage 🇮🇳', level: 12,
    badges: 5, points: 1620, xp: 1620, coins: 1250, streak: 4, progress: 68
  },
  progress: [],
  completedChapters: [],
  savedChapters: []
}

async function readState() {
  try {
    const data = JSON.parse(await fs.readFile(stateFile, 'utf8'))
    return { ...defaultState, ...data, profile: { ...defaultState.profile, ...(data.profile || {}) } }
  } catch {
    return structuredClone(defaultState)
  }
}
async function writeState(state) {
  await fs.writeFile(stateFile, JSON.stringify(state, null, 2))
}
const ADVANCED_QUESTION_INDEXES = new Set([3, 6, 9]) // Q4, Q7, Q10
const CORRECT_POSITION_PATTERNS = [
  [2, 0, 3, 1, 2, 3, 0, 1, 3, 2],
  [1, 3, 0, 2, 3, 1, 2, 0, 1, 3],
  [3, 1, 2, 0, 1, 3, 2, 0, 3, 1],
  [0, 2, 1, 3, 2, 0, 3, 1, 0, 2],
]

function prepareQuestion(question, index, chapterIndex = 0, ageGroup = 'scholar') {
  const sourceAnswers = [...question.answers]
  const correctText = sourceAnswers[question.correct]
  const remaining = sourceAnswers.filter((_, answerIndex) => answerIndex !== question.correct)
  const desiredCorrectIndex =
    CORRECT_POSITION_PATTERNS[chapterIndex % CORRECT_POSITION_PATTERNS.length][index % 10]

  const answers = []
  let remainingIndex = 0
  for (let position = 0; position < 4; position += 1) {
    answers.push(
      position === desiredCorrectIndex
        ? correctText
        : remaining[remainingIndex++]
    )
  }

  const difficulty =
    ageGroup === 'entry'
      ? 'Entry'
      : ageGroup === 'junior'
        ? 'Medium'
        : ADVANCED_QUESTION_INDEXES.has(index)
          ? 'Advanced'
          : 'Medium'

  return {
    ...question,
    difficulty,
    answers,
    correct: desiredCorrectIndex,
  }
}

const publicQuestion = ({ correct, explanation, ...q }) => q

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Heritage Quest API', version: '2.0.0', questions: Object.values(questionsByChapter).flat().length }))

app.get('/api/games', (req, res) => {
  const q = String(req.query.q || '').toLowerCase().trim()
  const category = String(req.query.category || '')
  const difficulty = String(req.query.difficulty || '')
  const out = games.filter(g =>
    (!q || JSON.stringify(g).toLowerCase().includes(q)) &&
    (!category || category === 'All' || g.category === category) &&
    (!difficulty || difficulty === 'All' || g.difficulty === difficulty)
  )
  res.json({ items: out, total: out.length })
})

app.get('/api/games/:slug', (req, res) => {
  const game = games.find(g => g.slug === req.params.slug)
  if (!game) return res.status(404).json({ error: 'Game not found' })
  res.json(game)
})

app.get('/api/chapters', (_req, res) => {
  res.json({ items: chapters.map(c => ({ ...c, questionCount: questionsByChapter[c.slug]?.length || 0 })) })
})

app.get('/api/chapters/:slug', (req, res) => {
  const chapter = chapters.find(c => c.slug === req.params.slug)
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' })
  res.json({ ...chapter, questionCount: questionsByChapter[chapter.slug]?.length || 0 })
})

app.get('/api/chapters/:slug/questions', (req, res) => {
  const chapter = chapters.find(c => c.slug === req.params.slug)
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' })
  const chapterIndex = Math.max(0, chapters.findIndex(item => item.slug === chapter.slug))
  const ageGroup = String(req.query.ageGroup || 'scholar')
  const ageBank = getAgeQuestionBank(chapter.slug, ageGroup)
  const sourceQuestions = ageBank || questionsByChapter[chapter.slug] || []
  const qs = sourceQuestions
    .slice(0, 10)
    .map((question, index) => prepareQuestion(question, index, chapterIndex, ageGroup))
  res.json({ chapter: chapter.title, chapterSlug: chapter.slug, totalQuestions: qs.length, questions: qs.map(publicQuestion) })
})

app.post('/api/quiz/check-answer', (req, res) => {
  const { chapterSlug, questionId, answerIndex, ageGroup = 'scholar' } = req.body || {}
  const ageBank = getAgeQuestionBank(chapterSlug, String(ageGroup))
  const rawQuestions = ageBank || questionsByChapter[chapterSlug]
  if (!rawQuestions) return res.status(404).json({ error: 'Chapter not found' })
  const questionIndex = rawQuestions.slice(0, 10).findIndex(item => item.id === questionId)
  if (questionIndex < 0) return res.status(404).json({ error: 'Question not found' })
  const chapterIndex = Math.max(0, chapters.findIndex(item => item.slug === chapterSlug))
  const q = prepareQuestion(rawQuestions[questionIndex], questionIndex, chapterIndex, String(ageGroup))
  const selected = Number(answerIndex)
  const isCorrect = selected === q.correct
  const xp = isCorrect
    ? q.difficulty === 'Advanced'
      ? 30
      : q.difficulty === 'Entry'
        ? 10
        : 20
    : 0
  res.json({
    correct: isCorrect,
    correctIndex: q.correct,
    explanation: q.explanation,
    difficulty: q.difficulty,
    xp
  })
})

app.get('/api/achievements', (_req, res) => res.json({ items: achievements }))
app.get('/api/leaderboard', (_req, res) => res.json({ items: leaderboard }))

app.get('/api/profile', async (_req, res) => res.json((await readState()).profile))
app.get('/api/progress', async (_req, res) => {
  const state = await readState()
  res.json({ items: state.progress || [], completedChapters: state.completedChapters || [] })
})

app.post('/api/progress', async (req, res) => {
  const { gameId = 'chapter-quiz', chapterSlug, score = 0, coins = 0, xp = 0, accuracy = 0, completed = false } = req.body || {}
  const state = await readState()
  const entry = {
    id: Date.now(), gameId, chapterSlug: chapterSlug || null,
    score: Number(score) || 0, coins: Number(coins) || 0, xp: Number(xp) || 0,
    accuracy: Number(accuracy) || 0, completed: Boolean(completed), savedAt: new Date().toISOString()
  }
  state.progress = [entry, ...(state.progress || [])].slice(0, 100)
  state.profile.points = (Number(state.profile.points) || 0) + (Number(score) || 0)
  state.profile.xp = (Number(state.profile.xp) || 0) + (Number(xp) || 0)
  state.profile.coins = (Number(state.profile.coins) || 0) + (Number(coins) || 0)
  if (completed && chapterSlug) {
    state.completedChapters = [...new Set([...(state.completedChapters || []), chapterSlug])]
    state.profile.progress = Math.round((state.completedChapters.length / chapters.length) * 100)
  }
  await writeState(state)
  res.status(201).json({ ok: true, entry, profile: state.profile, completedChapters: state.completedChapters })
})

app.get('/api/recommendations', (req, res) => {
  const current = String(req.query.chapter || '')
  const candidates = games.filter(g => g.chapterSlug !== current).slice(0, 3)
  res.json({ items: candidates })
})

app.get('/api/challenges/daily', (_req, res) => {
  const picks = chapters.slice(0, 5).map((chapter, index) => {
    const q = questionsByChapter[chapter.slug][index % questionsByChapter[chapter.slug].length]
    return { chapterSlug: chapter.slug, chapter: chapter.title, ...publicQuestion(q) }
  })
  res.json({ id: 'daily-heritage', title: "Today's Heritage Challenge", rewardXp: 100, totalQuestions: 5, questions: picks })
})

app.get('/api/search', (req, res) => {
  const q = String(req.query.q || '').toLowerCase().trim()
  if (!q) return res.json({ games: [], chapters: [] })
  res.json({
    games: games.filter(g => JSON.stringify(g).toLowerCase().includes(q)).slice(0, 8),
    chapters: chapters.filter(c => JSON.stringify(c).toLowerCase().includes(q)).slice(0, 8)
  })
})

const dist = path.resolve(__dirname, '../client/dist')
try {
  await fs.access(dist)
  app.use(express.static(dist))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(dist, 'index.html'))
  })
} catch {
  // During development Vite serves the frontend on port 5173.
  app.get('/', (_req, res) => res.json({
    ok: true,
    service: 'Heritage Quest API',
    message: 'Backend is running. Open http://localhost:5173 for the website.',
    health: '/api/health'
  }))
}

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Unexpected server error' })
})

app.listen(PORT, () => console.log(`Heritage Quest API running on http://localhost:${PORT}`))
