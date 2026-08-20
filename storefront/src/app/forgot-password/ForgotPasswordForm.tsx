'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { resetPassword } from '../login/actions'

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    const result = await resetPassword(email)
    
    if (result?.error) {
      const errLower = result.error.toLowerCase()
      if (errLower.includes('user') || errLower.includes('found') || errLower.includes('not registered') || errLower.includes('invalid')) {
        setMessage('If an account exists with that email, a reset link has been sent.')
      } else {
        setError(result.error)
      }
    } else {
      setMessage('If an account exists with that email, a reset link has been sent.')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="recovery-email" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Email Address
        </label>
        <input
          id="recovery-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            background: 'var(--obsidian)',
            border: '1px solid var(--border)',
            borderBottom: '1px solid var(--border-gold)',
            color: 'var(--text)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            padding: '12px 16px',
            outline: 'none',
            width: '100%',
            borderRadius: '12px'
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary"
        style={{ width: '100%', padding: '16px', borderRadius: '12px', letterSpacing: '0.2em', cursor: 'pointer', minHeight: '44px' }}
      >
        {loading ? 'Sending...' : 'Send Recovery Link'}
      </button>

      {message && (
        <div style={{ padding: '12px 16px', background: 'rgba(90,196,120,0.08)', border: '1px solid rgba(90,196,120,0.2)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--green)', textAlign: 'center' }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(196,90,90,0.08)', border: '1px solid rgba(196,90,90,0.2)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#f87171', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '12px' }}>
        <a href="/login" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gold)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
          ← Back to Login
        </a>
      </div>
    </form>
  )
}
