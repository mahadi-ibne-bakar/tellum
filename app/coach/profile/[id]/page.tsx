'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import html2canvas from 'html2canvas'
import { loadHistory, getOpponentProfile } from '@/lib/supabase/database'
import { detectPatterns } from '@/lib/ai/patterns'
import { PatternCard } from '@/components/PatternCard'
import type { OpponentProfile, RoundRecord, PatternBadge } from '@/lib/types'

export default function ProfileCardPage() {
  const params = useParams()
  const id = params.id as string

  const [profile, setProfile]       = useState<OpponentProfile | null>(null)
  const [history, setHistory]       = useState<RoundRecord[]>([])
  const [loading, setLoading]       = useState(true)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const [p, h] = await Promise.all([
        getOpponentProfile(id),
        loadHistory('coach', id),
      ])
      setProfile(p)
      setHistory(h)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleDownload() {
    if (!cardRef.current) return
    setDownloading(true)
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#09090b',
      scale: 2, // renders at 2x resolution for a sharp download
    })
    const link = document.createElement('a')
    link.download = `tellum-${profile?.name ?? 'pattern'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setDownloading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Profile not found</p>
      </div>
    )
  }

  const wins = history.filter((r) => r.outcome === 'win').length
  const winRate = history.length > 0 ? Math.round((wins / history.length) * 100) : 0

  const counts = { rock: 0, paper: 0, scissors: 0 }
  history.forEach((r) => counts[r.opponentMove]++)
  const distribution = {
    rock:     history.length ? counts.rock     / history.length : 0,
    paper:    history.length ? counts.paper    / history.length : 0,
    scissors: history.length ? counts.scissors / history.length : 0,
  }

  const patterns: PatternBadge[] = detectPatterns(history)

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      <header className="flex items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <Link href="/coach" className="font-display font-bold text-lg hover:text-accent transition-colors">
          ← Tellum
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-10 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <PatternCard
            ref={cardRef}
            name={profile.name}
            rounds={history.length}
            winRate={winRate}
            distribution={distribution}
            patterns={patterns}
          />
        </motion.div>

        <button
          onClick={handleDownload}
          disabled={downloading || history.length === 0}
          className="w-full max-w-sm py-3 rounded-xl bg-accent text-white font-semibold hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-40"
        >
          {downloading ? 'Generating...' : 'Download image'}
        </button>

        {history.length === 0 && (
          <p className="text-xs text-zinc-500 text-center max-w-sm">
            Play a few rounds against {profile.name} first — Tellum needs data before it can detect patterns.
          </p>
        )}
      </main>
    </div>
  )
}