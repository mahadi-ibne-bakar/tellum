import { createClient } from './client'
import type { RoundRecord } from '../types'

// Save a single round to the database
// If the user is not signed in, silently does nothing
export async function saveRound(
  mode: 'coach' | 'mirror',
  round: RoundRecord
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('rounds').insert({
    user_id:       user.id,
    mode,
    opponent_move: round.opponentMove,
    your_move:     round.yourMove,
    outcome:       round.outcome,
  })
}

// Load all past rounds for a mode, oldest first
// Returns empty array if not signed in or no history yet
export async function loadHistory(
  mode: 'coach' | 'mirror'
): Promise<RoundRecord[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('rounds')
    .select('opponent_move, your_move, outcome')
    .eq('user_id', user.id)
    .eq('mode', mode)
    .order('played_at', { ascending: true })

  if (error || !data) return []

  return data.map((r) => ({
    opponentMove: r.opponent_move as RoundRecord['opponentMove'],
    yourMove:     r.your_move    as RoundRecord['yourMove'],
    outcome:      r.outcome      as RoundRecord['outcome'],
  }))
}