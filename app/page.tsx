'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const modes = [
  {
    emoji: '🎯',
    title: 'Coach Mode',
    description:
      'Play against a real person. Tellum watches their moves and tells you exactly what to throw next.',
    cta: 'Two players, one phone',
    href: '/coach',
    delay: 0.25,
  },
  {
    emoji: '🪞',
    title: 'Mirror Mode',
    description:
      'Play solo. Tellum secretly learns your patterns — then turns them against you.',
    cta: 'Coming soon',
    href: null,
    delay: 0.4,
  },
]

export default function Home() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24">

      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center"
      >
        <h1 className="font-display text-8xl font-bold tracking-tight">
          Tellum
        </h1>
        <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400 tracking-wide">
          Every move reveals a pattern.
        </p>
      </motion.div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
        {modes.map((mode) => (
          <motion.div
            key={mode.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: mode.delay, ease: 'easeOut' }}
            onClick={() => mode.href && router.push(mode.href)}
            className={`p-7 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all duration-200 hover:-translate-y-1 hover:border-accent ${
              mode.href ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <span className="text-4xl">{mode.emoji}</span>
            <h2 className="mt-4 font-display text-xl font-semibold">{mode.title}</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {mode.description}
            </p>
            <p className="mt-5 text-sm font-medium text-accent">{mode.cta} →</p>
          </motion.div>
        ))}
      </div>
    </main>
  )
}