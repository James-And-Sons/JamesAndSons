'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/login?message=Password updated successfully')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm space-y-12">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-[36px] text-primary font-light">Set New Password</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent">Internal Security Upgrade</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary block">New Secure Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-border px-4 py-3 text-[14px] font-body text-primary focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50"
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary block">Confirm Password</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent border border-border px-4 py-3 text-[14px] font-body text-primary focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-background font-mono text-[11px] uppercase tracking-[0.2em] py-4 hover:bg-gold transition-colors disabled:opacity-50"
          >
            {loading ? 'Finalizing...' : 'Update Admin Access'}
          </button>

          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-[13px] font-body p-4 text-center">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
