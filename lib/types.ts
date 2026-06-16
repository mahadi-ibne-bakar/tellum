export type Move = 'rock' | 'paper' | 'scissors'
export type Outcome = 'win' | 'loss' | 'tie'

export interface RoundRecord {
  opponentMove: Move
  yourMove: Move
  outcome: Outcome
}

export interface Prediction {
  suggestedMove: Move
  predictedOpponent: Move
  confidence: number       // 0 to 1
  reason: string           // human-readable explanation
  distribution: {
    rock: number
    paper: number
    scissors: number
  }
}

export interface OpponentProfile {
  id: string
  name: string
  created_at: string
}

export interface PatternBadge {
  icon: string
  label: string
}