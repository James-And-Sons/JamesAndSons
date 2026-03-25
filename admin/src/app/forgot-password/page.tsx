'use client'

import { useState } from 'react'
import { resetPasswordAction } from '../login/action'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    const result = await resetPasswordAction(email)
    
    if (result.error) {
      setError(result.error)
    } else {
      setMessage('Recovery link sent! Please check your admin inbox.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm space-y-12">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-[36px] text-primary font-light">Reset Password</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent">Admin Security Protocol</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary block">Admin Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-border px-4 py-3 text-[14px] font-body text-primary focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50"
              placeholder="admin@jamesandsons.com"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-background font-mono text-[11px] uppercase tracking-[0.2em] py-4 hover:bg-gold transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Request Access Reset'}
          </button>

          {message && (
            <div className="bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80] text-[13px] font-body p-4 text-center">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-[13px] font-body p-4 text-center">
              {error}
            </div>
          )}

          <div className="text-center pt-4">
            <a href="/login" className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-accent transition-colors">
              ← Return to Login
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
