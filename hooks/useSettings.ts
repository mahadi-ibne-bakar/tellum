'use client'

import { useState, useEffect } from 'react'
import { DEFAULT_SETTINGS, type Settings } from '@/lib/settings'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded,   setLoaded]   = useState(false)

  // Load from localStorage after mount
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const stored = localStorage.getItem('tellum_settings')
        if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) })
      } catch { /* localStorage unavailable */ }
      setLoaded(true)
    }, 0)
    return () => clearTimeout(t)
  }, [])

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      try { localStorage.setItem('tellum_settings', JSON.stringify(next)) } catch {}
      return next
    })
  }

  return { settings, updateSetting, loaded }
}