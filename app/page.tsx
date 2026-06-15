'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AuthButton } from '@/components/AuthButton'

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
    cta: 'Solo challenge',
    href: '/mirror',
    delay: 0.4,
  },
]

export default function Home() {
  const router = useRouter()



  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24">
      <div className="absolute top-6 left-6">
        <AuthButton />
      </div>
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

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
            className="p-7 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-accent hover:-translate-y-1 transition-all duration-200"
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