'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { predict } from '@/lib/ai/engine'
import type { Move, RoundRecord } from '@/lib/types'
import { loadHistory, saveRound } from '@/lib/supabase/database'

type Phase = 'suggest' | 'input' | 'result'
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
    (yourMove === 'rock' && theirMove === 'scissors') ||
    (yourMove === 'paper' && theirMove === 'rock') ||
    (yourMove === 'scissors' && theirMove === 'paper')
  )
    return 'win'
  return 'loss'
}

export default function CoachMode() {
  const [round, setRound] = useState(1)
  const [score, setScore] = useState({ you: 0, them: 0, ties: 0 })
  const [phase, setPhase] = useState<Phase>('suggest')
  const [history, setHistory] = useState<RoundRecord[]>([])
  const [lastOpponentMove, setLastOpponentMove] = useState<Move | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [loading, setLoading] = useState(true)

  // This single line IS the AI — recomputes every time history changes
  const prediction = useMemo(() => predict(history), [history])

  const isLearning = prediction.confidence < 0.2
  const confidencePct = Math.round(prediction.confidence * 100)

  function handleOpponentMove(move: Move) {
    const result = getOutcome(prediction.suggestedMove, move)

    const record: RoundRecord = {
      opponentMove: move,
      yourMove: prediction.suggestedMove,
      outcome: result,
    }

    setHistory((prev) => [...prev, record])
    saveRound('coach', record)

    setLastOpponentMove(move)
    setOutcome(result)
    setScore((prev) => ({
      you:  result === 'win'  ? prev.you  + 1 : prev.you,
      them: result === 'loss' ? prev.them + 1 : prev.them,
      ties: result === 'tie'  ? prev.ties + 1 : prev.ties,
    }))
    setPhase('result')
  }

  useEffect(() => {
    if (phase !== 'result') return
    const t = setTimeout(() => {
      setRound((r) => r + 1)
      setLastOpponentMove(null)
      setOutcome(null)
      setPhase('suggest')
    }, 1800)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    loadHistory('coach').then((h) => {
      setHistory(h)
      setLoading(false)
    })
  }, [])

  const OUTCOME_TEXT: Record<Outcome, string> = {
    win:  '✅ You won that round',
    loss: '❌ They got that one',
    tie:  '🤝 Tie',
  }
  const OUTCOME_COLOR: Record<Outcome, string> = {
    win: 'text-green-400',
    loss: 'text-red-400',
    tie: 'text-zinc-400',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Loading history...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">

      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <Link href="/" className="font-display font-bold text-lg hover:text-accent transition-colors">
          ← Tellum
        </Link>
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
            key={`${phase}-${round}`}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="text-center"
          >
            {phase === 'result' && outcome && lastOpponentMove ? (
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
                    <p className="mt-1 text-xs text-zinc-500">Them</p>
                  </div>
                </div>
                <p className={`text-xl font-semibold ${OUTCOME_COLOR[outcome]}`}>
                  {OUTCOME_TEXT[outcome]}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-zinc-400 tracking-widest uppercase mb-6">
                  {phase === 'suggest' ? 'Play this' : 'You played'}
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
                      Learning your opponent...
                    </div>
                  ) : (
                    <>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-xs font-medium text-accent">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {confidencePct}% confident
                      </div>
                      {prediction.reason && (
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
            {phase === 'suggest' && (
              <motion.button
                key="played"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                onClick={() => setPhase('input')}
                className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-lg hover:bg-indigo-500 active:scale-95 transition-all"
              >
                I played it →
              </motion.button>
            )}

            {phase === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  What did they throw?
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