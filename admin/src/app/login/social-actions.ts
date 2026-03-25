'use client'

import { createClient } from '@/utils/supabase/client'
import { Provider } from '@supabase/supabase-js'

export async function signInWithSocial(provider: Provider) {
  const supabase = createClient()
  const origin = window.location.origin

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error(`Error signing in with ${provider}:`, error.message)
    window.location.href = `/login?message=Could not authenticate with ${provider}`
  }
}
