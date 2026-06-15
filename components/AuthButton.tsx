'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get current user on mount
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    // Listen for sign in / sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  if (!user) {
    return (
      <button
        onClick={() => router.push('/auth')}
        className="text-sm font-medium text-accent hover:text-indigo-400 transition-colors"
      >
        Sign in →
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 hidden sm:block">{user.email}</span>
      <button
        onClick={async () => {
          await supabase.auth.signOut()
          router.refresh()
        }}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}