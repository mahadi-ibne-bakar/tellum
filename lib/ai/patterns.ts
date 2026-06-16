import type { RoundRecord, PatternBadge } from '../types'
import {
  frequencyModel,
  markovModel,
  outcomesModel,
  streakModel,
  rotationModel,
} from './engine'

const MOVE_ICON: Record<string, string> = {
  rock: '🪨',
  paper: '✋',
  scissors: '✌️',
}

// A pattern only shows on the card once its model is at least this confident
const DETECTION_THRESHOLD = 0.3

export function detectPatterns(history: RoundRecord[]): PatternBadge[] {
  const badges: PatternBadge[] = []

  const freq = frequencyModel(history)
  if (freq.confidence >= DETECTION_THRESHOLD && freq.label) {
    const topMove = Object.entries(freq.distribution).sort((a, b) => b[1] - a[1])[0][0]
    badges.push({ icon: MOVE_ICON[topMove] ?? '🎯', label: freq.label })
  }

  const markov = markovModel(history)
  if (markov.confidence >= DETECTION_THRESHOLD && markov.label) {
    badges.push({ icon: '🔁', label: markov.label })
  }

  const outcomes = outcomesModel(history)
  if (outcomes.confidence >= DETECTION_THRESHOLD && outcomes.label) {
    badges.push({ icon: '↩️', label: outcomes.label })
  }

  const streak = streakModel(history)
  if (streak.confidence >= DETECTION_THRESHOLD && streak.label) {
    badges.push({ icon: '📈', label: streak.label })
  }

  const rotation = rotationModel(history)
  if (rotation.confidence >= DETECTION_THRESHOLD && rotation.label) {
    badges.push({ icon: '🔄', label: rotation.label })
  }

  if (badges.length === 0) {
    badges.push({ icon: '🎲', label: 'Unpredictable — no strong pattern detected yet' })
  }

  return badges
}