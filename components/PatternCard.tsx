import { forwardRef } from 'react'
import type { PatternBadge } from '@/lib/types'

interface PatternCardProps {
  name: string
  rounds: number
  winRate: number
  distribution: { rock: number; paper: number; scissors: number }
  patterns: PatternBadge[]
}

// forwardRef lets the parent page point html2canvas directly at this DOM node
export const PatternCard = forwardRef<HTMLDivElement, PatternCardProps>(
  function PatternCard({ name, rounds, winRate, distribution, patterns }, ref) {
    const bars = [
      { label: 'Rock', value: distribution.rock, color: 'bg-rock' },
      { label: 'Paper', value: distribution.paper, color: 'bg-paper' },
      { label: 'Scissors', value: distribution.scissors, color: 'bg-scissors' },
    ]

    return (
      <div
        ref={ref}
        className="w-full max-w-sm p-7 rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-50"
      >
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-lg">Tellum</span>
          <span className="text-xs text-zinc-500">tellum.app</span>
        </div>

        <div className="h-px bg-zinc-800 my-4" />

        <p className="text-xs text-zinc-500 uppercase tracking-widest">Decoded</p>
        <h2 className="font-display text-3xl font-bold mt-1">{name}</h2>

        <div className="flex gap-6 mt-3 text-sm">
          <span className="text-zinc-400">{rounds} rounds</span>
          <span className="text-accent font-medium">{winRate}% win rate</span>
        </div>

        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-6 mb-2">
          Patterns detected
        </p>
        <div className="flex flex-col gap-2">
          {patterns.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span>{p.icon}</span>
              <span className="text-zinc-300">{p.label}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-6 mb-2">
          Move distribution
        </p>
        <div className="flex flex-col gap-2">
          {bars.map((bar) => (
            <div key={bar.label} className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 w-16">{bar.label}</span>
              <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full ${bar.color}`}
                  style={{ width: `${Math.round(bar.value * 100)}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400 w-10 text-right">
                {Math.round(bar.value * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
)