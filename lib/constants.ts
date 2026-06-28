import type { Move } from './types'

export const MOVE_EMOJI: Record<Move, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
}

export const MOVE_LABEL: Record<Move, string> = {
  rock: 'Rock',
  paper: 'Paper',
  scissors: 'Scissors',
}

export const MOVE_COLOR: Record<Move, string> = {
  rock: 'text-rock',
  paper: 'text-paper',
  scissors: 'text-scissors',
}

export function getOutcome(
  yourMove: Move,
  theirMove: Move
): 'win' | 'loss' | 'tie' {
  if (yourMove === theirMove) return 'tie'
  if (
    (yourMove === 'rock'     && theirMove === 'scissors') ||
    (yourMove === 'paper'    && theirMove === 'rock')     ||
    (yourMove === 'scissors' && theirMove === 'paper')
  ) return 'win'
  return 'loss'
}