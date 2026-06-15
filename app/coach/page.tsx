'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// --- Types ---
type Move = 'rock' | 'paper' | 'scissors'
type Phase = 'suggest' | 'input' | 'result'
type Outcome = 'win' | 'loss' | 'tie'

// --- Move display data ---
const MOVE_EMOJI: Record<Move, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
}

const MOVE_LABEL: Record<Move, string> = {
  rock: 'Rock',
  paper: 'Paper',
  scissors: 'Scissors',
}

const MOVE_COLOR: Record<Move, string> = {
  rock: 'text-rock',
  paper: 'text-paper',
  scissors: 'text-scissors',
}

// --- Game logic helpers ---
function getRandomMove(): Move {
  const moves: Move[] = ['rock', 'paper', 'scissors']
  return moves[Math.floor(Math.random() * 3)]
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

// --- Component ---
export default function CoachMode() {
  const [round, setRound] = useState(1)
  const [score, setScore] = useState({ you: 0, them: 0, ties: 0 })
  const [phase, setPhase] = useState<Phase>('suggest')
  const [suggestedMove, setSuggestedMove] = useState<Move>(getRandomMove)
  const [opponentMove, setOpponentMove] = useState<Move | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  // When opponent move is logged, calculate result and update score
  function handleOpponentMove(move: Move) {
    const result = getOutcome(suggestedMove, move)
    setOpponentMove(move)
    setOutcome(result)
    setScore((prev) => ({
      you:  result === 'win'  ? prev.you  + 1 : prev.you,
      them: result === 'loss' ? prev.them + 1 : prev.them,
      ties: result === 'tie'  ? prev.ties + 1 : prev.ties,
    }))
    setPhase('result')
  }

  // Auto-advance to next round after showing result
  useEffect(() => {
    if (phase !== 'result') return
    const timer = setTimeout(() => {
      setRound((r) => r + 1)
      setSuggestedMove(getRandomMove())
      setOpponentMove(null)
      setOutcome(null)
      setPhase('suggest')
    }, 1800)
    return () => clearTimeout(timer)
  }, [phase])

  const OUTCOME_TEXT: Record<Outcome, string> = {
    win: '✅ You won that round',
    loss: '❌ They got that one',
    tie: '🤝 Tie',
  }

  const OUTCOME_COLOR: Record<Outcome, string> = {
    win: 'text-green-400',
    loss: 'text-red-400',
    tie: 'text-zinc-400',
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">

      {/* Header */}
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
            <span className="font-bold">{score.them}</span>
          </div>
        </div>
      </header>

      {/* Game area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-10">

        {/* Move display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${phase}-${round}`}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="text-center"
          >
            {phase === 'result' && outcome && opponentMove ? (
              // Result: show both moves and outcome
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className={`text-7xl ${MOVE_COLOR[suggestedMove]}`}>
                      {MOVE_EMOJI[suggestedMove]}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">You</p>
                  </div>
                  <span className="text-2xl text-zinc-400">vs</span>
                  <div className="text-center">
                    <div className={`text-7xl ${MOVE_COLOR[opponentMove]}`}>
                      {MOVE_EMOJI[opponentMove]}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">Them</p>
                  </div>
                </div>
                <p className={`mt-4 text-xl font-semibold ${OUTCOME_COLOR[outcome]}`}>
                  {OUTCOME_TEXT[outcome]}
                </p>
              </div>
            ) : (
              // Suggest / Input: show the suggested move
              <div>
                <p className="text-xs font-medium text-zinc-400 tracking-widest uppercase mb-6">
                  {phase === 'suggest' ? 'Play this' : 'You played'}
                </p>
                <div className={`text-[120px] leading-none ${MOVE_COLOR[suggestedMove]}`}>
                  {MOVE_EMOJI[suggestedMove]}
                </div>
                <p className={`font-display text-4xl font-bold mt-3 ${MOVE_COLOR[suggestedMove]}`}>
                  {MOVE_LABEL[suggestedMove]}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                  Learning your opponent · round {round} of 8
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action buttons */}
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