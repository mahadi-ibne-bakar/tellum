import type { Move, RoundRecord, Prediction } from '../types'

type Distribution = { rock: number; paper: number; scissors: number }

interface ModelOutput {
  distribution: Distribution
  confidence: number   // 0–1, based on how much data this model has
  label: string        // human-readable reason shown in the UI
}

const MOVES: Move[] = ['rock', 'paper', 'scissors']
const COUNTER: Record<Move, Move> = {
  rock: 'paper',
  paper: 'scissors',
  scissors: 'rock',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function uniform(): ModelOutput {
  return {
    distribution: { rock: 1 / 3, paper: 1 / 3, scissors: 1 / 3 },
    confidence: 0,
    label: '',
  }
}

function topMove(d: Distribution): Move {
  return (Object.entries(d) as [Move, number][]).reduce(
    (best, [move, prob]) => (prob > d[best] ? move : best),
    'rock' as Move
  )
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ── Model 1: Frequency ───────────────────────────────────────────────────────
// Tracks overall move distribution. Are they a Rock-heavy player?

export function frequencyModel(history: RoundRecord[]): ModelOutput {

  if (history.length < 3) return uniform()

  const counts = { rock: 0, paper: 0, scissors: 0 }
  for (const r of history) counts[r.opponentMove]++

  const n = history.length
  const distribution: Distribution = {
    rock: counts.rock / n,
    paper: counts.paper / n,
    scissors: counts.scissors / n,
  }

  const top = topMove(distribution)
  const pct = Math.round(distribution[top] * 100)

  return {
    distribution,
    confidence: Math.min(n / 15, 0.8),
    label: pct > 40 ? `${cap(top)} bias — throws it ${pct}% of the time` : '',
  }
}

// ── Model 2: Markov ──────────────────────────────────────────────────────────
// Tracks what they throw after each specific move.
// "After Rock, they throw Paper 70% of the time."

export function markovModel(history: RoundRecord[]): ModelOutput {
  if (history.length < 4) return uniform()

  const lastMove = history[history.length - 1].opponentMove
  const counts = { rock: 0, paper: 0, scissors: 0 }
  let total = 0

  for (let i = 0; i < history.length - 1; i++) {
    if (history[i].opponentMove === lastMove) {
      counts[history[i + 1].opponentMove]++
      total++
    }
  }

  if (total < 2) return uniform()

  const distribution: Distribution = {
    rock: counts.rock / total,
    paper: counts.paper / total,
    scissors: counts.scissors / total,
  }

  const top = topMove(distribution)
  const pct = Math.round(distribution[top] * 100)

  return {
    distribution,
    confidence: Math.min(total / 6, 0.9),
    label: `After ${cap(lastMove)}, they throw ${cap(top)} ${pct}% of the time`,
  }
}

// ── Model 3: Outcomes ────────────────────────────────────────────────────────
// Tracks what they throw after winning, losing, or tying.
// "After losing, they almost always switch to Rock."

export function outcomesModel(history: RoundRecord[]): ModelOutput {
  if (history.length < 4) return uniform()

  // Convert our outcome to their outcome
  const flip = (o: 'win' | 'loss' | 'tie'): 'win' | 'loss' | 'tie' =>
    o === 'win' ? 'loss' : o === 'loss' ? 'win' : 'tie'

  const theirLast = flip(history[history.length - 1].outcome)
  const counts = { rock: 0, paper: 0, scissors: 0 }
  let total = 0

  for (let i = 1; i < history.length; i++) {
    if (flip(history[i - 1].outcome) === theirLast) {
      counts[history[i].opponentMove]++
      total++
    }
  }

  if (total < 2) return uniform()

  const distribution: Distribution = {
    rock: counts.rock / total,
    paper: counts.paper / total,
    scissors: counts.scissors / total,
  }

  const top = topMove(distribution)
  const pct = Math.round(distribution[top] * 100)
  const word =
    theirLast === 'win' ? 'winning' : theirLast === 'loss' ? 'losing' : 'tying'

  return {
    distribution,
    confidence: Math.min(total / 5, 0.85),
    label: `After ${word}, they lean toward ${cap(top)} (${pct}%)`,
  }
}

// ── Model 4: Streaks ─────────────────────────────────────────────────────────
// Detects when they repeat the same move 2+ times in a row.
// People usually switch after a streak.

export function streakModel(history: RoundRecord[]): ModelOutput {
  if (history.length < 3) return uniform()

  const last = history[history.length - 1].opponentMove
  let streak = 1

  for (let i = history.length - 2; i >= 0; i--) {
    if (history[i].opponentMove === last) streak++
    else break
  }

  if (streak < 2) return uniform()

  // Penalise repeating — spread probability to the other two moves
  const dist: Distribution = { rock: 0.45, paper: 0.45, scissors: 0.45 }
  dist[last] = 0.1
  const others = MOVES.filter((m) => m !== last)
  others.forEach((m) => { dist[m] = 0.45 })

  return {
    distribution: dist,
    confidence: Math.min((streak - 1) / 3, 0.8),
    label: `${streak}-throw ${cap(last)} streak — switch is likely`,
  }
}

// ── Model 5: Rotation ────────────────────────────────────────────────────────
// Detects if they cycle through moves in order (R→P→S or R→S→P).

export function rotationModel(history: RoundRecord[]): ModelOutput {
  if (history.length < 5) return uniform()

  const cw: Move[] = ['rock', 'paper', 'scissors']
  const ccw: Move[] = ['rock', 'scissors', 'paper']

  let cwHits = 0
  let ccwHits = 0

  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1].opponentMove
    const curr = history[i].opponentMove
    if (curr === cw[(cw.indexOf(prev) + 1) % 3]) cwHits++
    if (curr === ccw[(ccw.indexOf(prev) + 1) % 3]) ccwHits++
  }

  const n = history.length - 1
  const cwRate = cwHits / n
  const ccwRate = ccwHits / n

  if (cwRate < 0.6 && ccwRate < 0.6) return uniform()

  const rotation = cwRate >= ccwRate ? cw : ccw
  const last = history[history.length - 1].opponentMove
  const predicted = rotation[(rotation.indexOf(last) + 1) % 3]
  const rate = Math.round(Math.max(cwRate, ccwRate) * 100)

  const dist: Distribution = { rock: 0.1, paper: 0.1, scissors: 0.1 }
  dist[predicted] = 0.8

  return {
    distribution: dist,
    confidence: Math.max(cwRate, ccwRate) * 0.95,
    label: `Rotates ${cwRate >= ccwRate ? 'clockwise' : 'counterclockwise'} — ${rate}% consistent`,
  }
}

// ── Ensemble Predictor ───────────────────────────────────────────────────────
// Combines all five models, weighted by their confidence.
// The more data a model has, the more it influences the final prediction.

export function predict(history: RoundRecord[]): Prediction {
  // No data yet — return a random suggestion
  if (history.length === 0) {
    const rand = MOVES[Math.floor(Math.random() * 3)]
    return {
      suggestedMove: rand,
      predictedOpponent: rand,
      confidence: 0,
      reason: '',
      distribution: { rock: 1 / 3, paper: 1 / 3, scissors: 1 / 3 },
    }
  }

  const models = [
    frequencyModel(history),
    markovModel(history),
    outcomesModel(history),
    streakModel(history),
    rotationModel(history),
  ]

  // Weight each model by its confidence score
  const totalWeight = models.reduce((sum, m) => sum + m.confidence, 0)

  let combined: Distribution

  if (totalWeight === 0) {
    combined = { rock: 1 / 3, paper: 1 / 3, scissors: 1 / 3 }
  } else {
    combined = { rock: 0, paper: 0, scissors: 0 }
    for (const model of models) {
      const w = model.confidence / totalWeight
      combined.rock += model.distribution.rock * w
      combined.paper += model.distribution.paper * w
      combined.scissors += model.distribution.scissors * w
    }
  }

  const predictedOpponent = topMove(combined)
  const suggestedMove = COUNTER[predictedOpponent]

  // Confidence = how far the top probability is above random (0.33)
  const topProb = combined[predictedOpponent]
  const confidence = Math.max((topProb - 1 / 3) / (2 / 3), 0)

  // Show the reason from the most confident model that has one
  const bestModel = models
    .filter((m) => m.label)
    .reduce(
      (best, m) => (m.confidence > best.confidence ? m : best),
      { confidence: 0, label: 'Reading the pattern...' }
    )

  return {
    suggestedMove,
    predictedOpponent,
    confidence,
    reason: bestModel.label,
    distribution: combined,
  }
}