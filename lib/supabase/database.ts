import { createClient } from './client'
import type { RoundRecord, OpponentProfile } from '../types'

// ── Rounds ────────────────────────────────────────────────────────────────────

export async function saveRound(
  mode: 'coach' | 'mirror',
  round: RoundRecord,
  opponentProfileId?: string
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('rounds').insert({
    user_id:              user.id,
    mode,
    opponent_move:        round.opponentMove,
    your_move:            round.yourMove,
    outcome:              round.outcome,
    opponent_profile_id:  opponentProfileId ?? null,
  })
}

export async function loadHistory(
  mode: 'coach' | 'mirror',
  opponentProfileId?: string
): Promise<RoundRecord[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('rounds')
    .select('opponent_move, your_move, outcome')
    .eq('user_id', user.id)
    .eq('mode', mode)
    .order('played_at', { ascending: true })

  if (opponentProfileId) {
    query = query.eq('opponent_profile_id', opponentProfileId)
  }

  const { data, error } = await query
  if (error || !data) return []

  return data.map((r) => ({
    opponentMove: r.opponent_move as RoundRecord['opponentMove'],
    yourMove:     r.your_move    as RoundRecord['yourMove'],
    outcome:      r.outcome      as RoundRecord['outcome'],
  }))
}

// ── Opponent profiles ─────────────────────────────────────────────────────────

export async function getOpponentProfiles(): Promise<OpponentProfile[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('opponent_profiles')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function createOpponentProfile(
  name: string
): Promise<OpponentProfile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('opponent_profiles')
    .insert({ user_id: user.id, name })
    .select('id, name, created_at')
    .single()

  return data ?? null
}

export async function getOpponentProfile(id: string): Promise<OpponentProfile | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('opponent_profiles')
    .select('id, name, created_at')
    .eq('id', id)
    .single()

  return data ?? null
}