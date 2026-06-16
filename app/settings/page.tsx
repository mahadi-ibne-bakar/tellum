'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSettings } from '@/hooks/useSettings'
import { Toggle } from '@/components/Toggle'

const THRESHOLD_OPTIONS = [
  { label: 'Sensitive', description: 'Shows reasoning sooner', value: 0.1 },
  { label: 'Balanced',  description: 'Default',                value: 0.2 },
  { label: 'Strict',    description: 'Waits until confident',  value: 0.35 },
]

export default function SettingsPage() {
  const { settings, updateSetting, loaded } = useSettings()

  if (!loaded) return null

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <Link
          href="/"
          className="font-display font-bold text-lg hover:text-accent transition-colors"
        >
          ← Tellum
        </Link>
        <span className="text-sm text-zinc-500">Settings</span>
      </header>

      <main className="flex-1 px-6 py-8 w-full max-w-sm mx-auto">

        {/* Display */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-display text-xs font-semibold tracking-widest text-zinc-400 uppercase mb-1">
            Display
          </h2>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <Toggle
              label="Confidence badge"
              description="Shows how sure Tellum is each round"
              value={settings.showConfidence}
              onChange={(v) => updateSetting('showConfidence', v)}
            />
            <Toggle
              label="Pattern reasoning"
              description="Explains why Tellum made its suggestion"
              value={settings.showReason}
              onChange={(v) => updateSetting('showReason', v)}
            />
            <Toggle
              label="Animations"
              description="Move transitions and reveal effects"
              value={settings.animationsEnabled}
              onChange={(v) => updateSetting('animationsEnabled', v)}
            />
          </div>
        </motion.section>

        {/* AI sensitivity */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-10"
        >
          <h2 className="font-display text-xs font-semibold tracking-widest text-zinc-400 uppercase mb-1">
            AI Sensitivity
          </h2>
          <p className="text-xs text-zinc-500 mb-4">
            How confident Tellum needs to be before showing its reasoning
          </p>
          <div className="flex flex-col gap-2">
            {THRESHOLD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => updateSetting('confidenceThreshold', option.value)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                  settings.confidenceThreshold === option.value
                    ? 'border-accent bg-accent/5 text-accent'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-accent/50'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{option.description}</p>
                </div>
                {settings.confidenceThreshold === option.value && (
                  <span className="text-accent text-lg">✓</span>
                )}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Reset */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-10"
        >
          <button
            onClick={() => {
              localStorage.removeItem('tellum_settings')
              window.location.reload()
            }}
            className="w-full py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 hover:border-red-400 hover:text-red-400 transition-all"
          >
            Reset to defaults
          </button>
        </motion.section>

      </main>
    </div>
  )
}