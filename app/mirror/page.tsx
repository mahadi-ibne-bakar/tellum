'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { predict } from '@/lib/ai/engine'
import type { Move, RoundRecord } from '@/lib/types'
import { MOVE_EMOJI, MOVE_LABEL, MOVE_COLOR } from '@/lib/constants'
import { loadHistory, saveRound } from '@/lib/supabase/database'
import { useSettings } from '@/hooks/useSettings'

type GameState = 'observing' | 'revealing' | 'confronting'
type RoundPhase = 'choose' | 'result'
type Outcome = 'win' | 'loss' | 'tie'

const OUTCOME_TEXT: Record<Outcome, string> = {
  win:  '✅ You won that round',
  loss: '❌ Tellum called it',
  tie:  '🤝 Tie',
}
const OUTCOME_COLOR: Record<Outcome, string> = {
  win:  'text-green-400',
  loss: 'text-red-400',
  tie:  'text-zinc-400',
}

function randomMove(): Move {
  return (['rock', 'paper', 'scissors'] as Move[])[Math.floor(Math.random() * 3)]
}

// Outcome from the user's perspective
function getUserOutcome(userMove: Move, aiMove: Move): Outcome {
  if (userMove === aiMove) return 'tie'
  if (
    (userMove === 'rock'     && aiMove === 'scissors') ||
    (userMove === 'paper'    && aiMove === 'rock')     ||
    (userMove === 'scissors' && aiMove === 'paper')
  ) return 'win'
  return 'loss'
}

// How many rounds before the reveal can trigger
const REVEAL_MIN_ROUNDS = 8

export default function MirrorMode() {
  const [gameState,    setGameState]    = useState<GameState>('observing')
  const [roundPhase,   setRoundPhase]   = useState<RoundPhase>('choose')
  const [round,        setRound]        = useState(1)
  const [score,        setScore]        = useState({ you: 0, ai: 0, ties: 0 })
  const [history,      setHistory]      = useState<RoundRecord[]>([])
  const [lastUserMove, setLastUserMove] = useState<Move | null>(null)
  const [lastAiMove,   setLastAiMove]   = useState<Move | null>(null)
  const [outcome,      setOutcome]      = useState<Outcome | null>(null)
  const [loading, setLoading] = useState(true)
  const { settings } = useSettings()

  // The AI is always learning from the user's moves in the background
  const aiPrediction = useMemo(() => predict(history), [history])

  // Trigger the dramatic reveal when confidence is high enough
    useEffect(() => {
    if (
        gameState === 'observing' &&
        history.length >= REVEAL_MIN_ROUNDS &&
        aiPrediction.confidence >= settings.confidenceThreshold
    ) {
        const t = setTimeout(() => setGameState('revealing'), 0)
        return () => clearTimeout(t)
    }
    }, [aiPrediction.confidence, history.length, gameState, settings.confidenceThreshold])

  // Auto-advance after showing the result
  useEffect(() => {
    if (roundPhase !== 'result') return
    const t = setTimeout(() => {
      setRound((r) => r + 1)
      setLastUserMove(null)
      setLastAiMove(null)
      setOutcome(null)
      setRoundPhase('choose')
    }, 1800)
    return () => clearTimeout(t)
  }, [roundPhase])

  useEffect(() => {
    loadHistory('mirror').then((h) => {
      setHistory(h)
      setLoading(false)
    })
  }, [])

  function handleUserMove(userMove: Move) {
    // Phase 1: AI plays randomly. Phase 3: AI plays its prediction.
    const aiMove =
      gameState === 'confronting' ? aiPrediction.suggestedMove : randomMove()

    const result    = getUserOutcome(userMove, aiMove)
    const aiOutcome: Outcome =
      result === 'win' ? 'loss' : result === 'loss' ? 'win' : 'tie'

    // Record as if user is the "opponent" the AI is studying
    setHistory((prev) => [
      ...prev,
      { opponentMove: userMove, yourMove: aiMove, outcome: aiOutcome },
    ])
    saveRound('mirror', { opponentMove: userMove, yourMove: aiMove, outcome: aiOutcome })

    setLastUserMove(userMove)
    setLastAiMove(aiMove)
    setOutcome(result)
    setScore((prev) => ({
      you:  result === 'win'  ? prev.you  + 1 : prev.you,
      ai:   result === 'loss' ? prev.ai   + 1 : prev.ai,
      ties: result === 'tie'  ? prev.ties + 1 : prev.ties,
    }))
    setRoundPhase('result')
  }

  const confidencePct = Math.round(aiPrediction.confidence * 100)

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Loading history...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">

      {/* ── Dramatic reveal overlay ───────────────────────────────────────── */}
      <AnimatePresence>
        {gameState === 'revealing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-50 px-8 text-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-zinc-400 text-lg tracking-wide"
            >
              I&apos;ve been watching you.
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="font-display text-4xl font-bold text-white mt-4 max-w-sm leading-tight"
            >
              I think I know how you play.
            </motion.h1>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8, duration: 0.5 }}
              onClick={() => setGameState('confronting')}
              className="mt-12 px-8 py-3 rounded-full bg-accent text-white font-semibold hover:bg-indigo-500 active:scale-95 transition-all"
            >
              Prove it →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <Link
          href="/"
          className="font-display font-bold text-lg hover:text-accent transition-colors"
        >
          ← Tellum
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="text-zinc-400">Round {round}</span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <span className="text-accent font-bold">{score.you}</span>
            <span className="text-zinc-400 text-xs">vs</span>
            <span className="font-bold">{score.ai}</span>
          </div>
        </div>
      </header>

      {/* ── Game area ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${roundPhase}-${round}`}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm"
          >

            {/* Result screen — same for both phases */}
            {roundPhase === 'result' && outcome && lastUserMove && lastAiMove ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className={`text-7xl ${MOVE_COLOR[lastUserMove]}`}>
                      {MOVE_EMOJI[lastUserMove]}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">You</p>
                  </div>
                  <span className="text-xl text-zinc-400">vs</span>
                  <div className="text-center">
                    <div className={`text-7xl ${MOVE_COLOR[lastAiMove]}`}>
                      {MOVE_EMOJI[lastAiMove]}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">Tellum</p>
                  </div>
                </div>
                <p className={`text-xl font-semibold ${OUTCOME_COLOR[outcome]}`}>
                  {OUTCOME_TEXT[outcome]}
                </p>
              </div>

            ) : gameState === 'confronting' ? (
              /* Phase 3 — AI shows its prediction BEFORE you pick */
              <div className="flex flex-col items-center gap-6">
                <div className="w-full p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-accent/30 text-center">
                  <p className="text-xs text-zinc-500 tracking-widest uppercase mb-3">
                    I predict you&apos;ll throw
                  </p>
                  <div className={`text-6xl ${MOVE_COLOR[aiPrediction.predictedOpponent]}`}>
                    {MOVE_EMOJI[aiPrediction.predictedOpponent]}
                  </div>
                  <p className={`font-display text-xl font-bold mt-1 ${MOVE_COLOR[aiPrediction.predictedOpponent]}`}>
                    {MOVE_LABEL[aiPrediction.predictedOpponent]}
                  </p>
                  {settings.showConfidence && (
                  <p className="mt-3 text-xs font-medium text-accent">
                      So I&apos;m playing {MOVE_LABEL[aiPrediction.suggestedMove]} · {confidencePct}% sure
                  </p>
                  )}
                 {settings.showReason && aiPrediction.reason && (
                  <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
                      {aiPrediction.reason}
                  </p>
                  )}
                </div>

                <div className="w-full">
                  <p className="text-center text-sm text-zinc-500 mb-4">
                    Prove me wrong
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {(['rock', 'paper', 'scissors'] as Move[]).map((move) => (
                      <button
                        key={move}
                        onClick={() => handleUserMove(move)}
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
                </div>
              </div>

            ) : (
              /* Phase 1 — Simple pick with subtle "Observing" indicator */
              <div className="flex flex-col items-center gap-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                  Observing your patterns...
                </div>

                <div className="w-full">
                  <p className="text-center text-sm text-zinc-500 mb-4">Your move</p>
                  <div className="grid grid-cols-3 gap-3">
                    {(['rock', 'paper', 'scissors'] as Move[]).map((move) => (
                      <button
                        key={move}
                        onClick={() => handleUserMove(move)}
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
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}