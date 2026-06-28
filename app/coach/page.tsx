'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { predict } from '@/lib/ai/engine'
import type { Move, RoundRecord, OpponentProfile } from '@/lib/types'
import {
  loadHistory,
  saveRound,
  getOpponentProfiles,
  createOpponentProfile,
} from '@/lib/supabase/database'
import { useSettings } from '@/hooks/useSettings'

type GamePhase = 'selecting' | 'playing'
type RoundPhase = 'suggest' | 'input' | 'result'
type Outcome = 'win' | 'loss' | 'tie'

const MOVE_EMOJI: Record<Move, string> = { rock: '✊', paper: '✋', scissors: '✌️' }
const MOVE_LABEL: Record<Move, string> = { rock: 'Rock', paper: 'Paper', scissors: 'Scissors' }
const MOVE_COLOR: Record<Move, string> = {
  rock: 'text-rock',
  paper: 'text-paper',
  scissors: 'text-scissors',
}

function getOutcome(yourMove: Move, theirMove: Move): Outcome {
  if (yourMove === theirMove) return 'tie'
  if (
    (yourMove === 'rock'     && theirMove === 'scissors') ||
    (yourMove === 'paper'    && theirMove === 'rock')     ||
    (yourMove === 'scissors' && theirMove === 'paper')
  ) return 'win'
  return 'loss'
}

export default function CoachMode() {
  // ── Profile selection state ───────────────────────────────────────────────
  const [gamePhase,    setGamePhase]    = useState<GamePhase>('selecting')
  const [profiles,     setProfiles]     = useState<OpponentProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<OpponentProfile | null>(null)
  const [newName,      setNewName]      = useState('')
  const [showNewInput, setShowNewInput] = useState(false)
  const [loadingProfiles, setLoadingProfiles] = useState(true)

  // ── Game state ────────────────────────────────────────────────────────────
  const [round,           setRound]          = useState(1)
  const [score,           setScore]          = useState({ you: 0, them: 0, ties: 0 })
  const [roundPhase,      setRoundPhase]     = useState<RoundPhase>('suggest')
  const [history,         setHistory]        = useState<RoundRecord[]>([])
  const [lastOpponentMove, setLastOpponentMove] = useState<Move | null>(null)
  const [outcome,         setOutcome]        = useState<Outcome | null>(null)
  const { settings } = useSettings()

  const prediction   = useMemo(() => predict(history), [history])
  const isLearning = prediction.confidence < settings.confidenceThreshold
  const confidencePct = Math.round(prediction.confidence * 100)

  // Load profiles on mount
  useEffect(() => {
    getOpponentProfiles().then((p) => {
      setProfiles(p)
      setLoadingProfiles(false)
    })
  }, [])

  // Auto-advance after result
  useEffect(() => {
    if (roundPhase !== 'result') return
    const t = setTimeout(() => {
      setRound((r) => r + 1)
      setLastOpponentMove(null)
      setOutcome(null)
      setRoundPhase('suggest')
    }, 1800)
    return () => clearTimeout(t)
  }, [roundPhase])

  // ── Profile handlers ──────────────────────────────────────────────────────

  async function handleSelectProfile(profile: OpponentProfile) {
    setSelectedProfile(profile)
    const h = await loadHistory('coach', profile.id)
    setHistory(h)
    setGamePhase('playing')
  }

  async function handleCreateProfile() {
    if (!newName.trim()) return

    const profile = await createOpponentProfile(newName.trim())

    // If signed in: profile saved to Supabase, use it
    // If not signed in: createOpponentProfile returns null — create a local-only profile
    const resolvedProfile: OpponentProfile = profile ?? {
      id: `local-${Date.now()}`,
      name: newName.trim(),
      created_at: new Date().toISOString(),
    }

    // Only add to the visible list if it was actually saved to the database
    if (profile) setProfiles((prev) => [profile, ...prev])

    setSelectedProfile(resolvedProfile)
    setHistory([])
    setGamePhase('playing')
  }

  function handleQuickPlay() {
    setSelectedProfile(null)
    setHistory([])
    setGamePhase('playing')
  }

  // ── Game handler ──────────────────────────────────────────────────────────

  function handleOpponentMove(move: Move) {
    const result = getOutcome(prediction.suggestedMove, move)

    const record: RoundRecord = {
      opponentMove: move,
      yourMove:     prediction.suggestedMove,
      outcome:      result,
    }

    setHistory((prev) => [...prev, record])
    saveRound('coach', record, selectedProfile?.id)

    setLastOpponentMove(move)
    setOutcome(result)
    setScore((prev) => ({
      you:  result === 'win'  ? prev.you  + 1 : prev.you,
      them: result === 'loss' ? prev.them + 1 : prev.them,
      ties: result === 'tie'  ? prev.ties + 1 : prev.ties,
    }))
    setRoundPhase('result')
  }

  const OUTCOME_TEXT: Record<Outcome, string> = {
    win:  '✅ You won that round',
    loss: '❌ They got that one',
    tie:  '🤝 Tie',
  }
  const OUTCOME_COLOR: Record<Outcome, string> = {
    win:  'text-green-400',
    loss: 'text-red-400',
    tie:  'text-zinc-400',
  }

  // ── Profile selector screen ───────────────────────────────────────────────

  if (loadingProfiles) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    )
  }

  if (gamePhase === 'selecting') {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
        <header className="flex items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <Link href="/" className="font-display font-bold text-lg hover:text-accent transition-colors">
            ← Tellum
          </Link>
        </header>

        <main className="flex-1 flex flex-col px-6 py-10 w-full max-w-sm mx-auto gap-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-2"
          >
            <h1 className="font-display text-2xl font-bold">Who are you playing against?</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Tellum learns each person separately
            </p>
          </motion.div>

          {/* Existing profiles */}
          {profiles.map((profile, i) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => handleSelectProfile(profile)}
                className="flex-1 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-accent text-left transition-all active:scale-95"
              >
                <p className="font-medium">{profile.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Continue →</p>
              </button>
              <Link
                href={`/coach/profile/${profile.id}`}
                className="px-4 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 hover:border-accent hover:text-accent transition-all"
              >
                Card
              </Link>
            </motion.div>
          ))}

          {/* New opponent */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: profiles.length * 0.05 }}
          >
            {/* Quick play — no profile needed */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              onClick={handleQuickPlay}
              className="w-full p-4 rounded-2xl bg-accent/5 border border-accent/20 hover:border-accent text-left transition-all active:scale-95"
            >
              <p className="font-medium text-accent">Quick game</p>
              <p className="text-xs text-zinc-500 mt-0.5">No opponent tracking — just play</p>
            </motion.button>            
            {!showNewInput ? (
              <button
                onClick={() => setShowNewInput(true)}
                className="w-full py-4 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-sm text-zinc-500 hover:border-accent hover:text-accent transition-all"
              >
                + New opponent
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  autoFocus
                  placeholder="Their name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  onClick={handleCreateProfile}
                  disabled={!newName.trim()}
                  className="w-full py-3 rounded-xl bg-accent text-white font-semibold hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-40"
                >
                  Start →
                </button>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    )
  }

  // ── Game screen ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">

      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <button
          onClick={() => setGamePhase('selecting')}
          className="font-display font-bold text-lg hover:text-accent transition-colors"
        >
          ← {selectedProfile?.name ?? 'Coach Mode'}
        </button>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="text-zinc-400">Round {round}</span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <span className="text-accent font-bold">{score.you}</span>
            <span className="text-zinc-400 text-xs">vs</span>
            <span className="font-bold">{score.them}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-8">

        <AnimatePresence mode="wait">
          <motion.div
            key={`${roundPhase}-${round}`}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="text-center"
          >
            {roundPhase === 'result' && outcome && lastOpponentMove ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className={`text-7xl ${MOVE_COLOR[prediction.suggestedMove]}`}>
                      {MOVE_EMOJI[prediction.suggestedMove]}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">You</p>
                  </div>
                  <span className="text-xl text-zinc-400">vs</span>
                  <div className="text-center">
                    <div className={`text-7xl ${MOVE_COLOR[lastOpponentMove]}`}>
                      {MOVE_EMOJI[lastOpponentMove]}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{selectedProfile?.name ?? 'Them'}</p>
                  </div>
                </div>
                <p className={`text-xl font-semibold ${OUTCOME_COLOR[outcome]}`}>
                  {OUTCOME_TEXT[outcome]}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-zinc-400 tracking-widest uppercase mb-6">
                  {roundPhase === 'suggest' ? 'Play this' : 'You played'}
                </p>

                <div className={`text-[120px] leading-none ${MOVE_COLOR[prediction.suggestedMove]}`}>
                  {MOVE_EMOJI[prediction.suggestedMove]}
                </div>

                <p className={`font-display text-4xl font-bold mt-3 ${MOVE_COLOR[prediction.suggestedMove]}`}>
                  {MOVE_LABEL[prediction.suggestedMove]}
                </p>

                <div className="mt-5 flex flex-col items-center gap-2">
                  {isLearning ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                      Learning {selectedProfile?.name ?? 'opponent'}...
                    </div>
                  ) : (
                    <>
                      {settings.showConfidence && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-xs font-medium text-accent">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                            {confidencePct}% confident
                        </div>
                      )}
                      {settings.showReason && prediction.reason && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs text-center leading-relaxed mt-1">
                            {prediction.reason}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {roundPhase === 'suggest' && (
              <motion.button
                key="played"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                onClick={() => setRoundPhase('input')}
                className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-lg hover:bg-indigo-500 active:scale-95 transition-all"
              >
                I played it →
              </motion.button>
            )}

            {roundPhase === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  What did {selectedProfile?.name ?? 'they'} throw?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(['rock', 'paper', 'scissors'] as Move[]).map((move) => (
                    <button
                      key={move}
                      onClick={() => handleOpponentMove(move)}
                      className="flex flex-col items-center gap-2 py-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-accent active:scale-95 transition-all"
                    >
                      <span className={`text-3xl ${MOVE_COLOR[move]}`}>
                        {MOVE_EMOJI[move]}
                      </span>
                      <span className="text-xs font-medium text-zinc-500">
                        {MOVE_LABEL[move]}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>
    </div>
  )
}