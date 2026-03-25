'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

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
      // Success - redirect to login or dashboard
      router.push('/login?message=Password updated successfully')
    }
  }

  return (
    <>
      <Navigation />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--obsidian)', padding: '20px', paddingTop: '80px' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', padding: '48px' }}>
          
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>Security Upgrade</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 300, color: 'var(--cream)', marginTop: '8px' }}>
              Create New Password
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.6 }}>
              Please enter your new secure password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                New Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', letterSpacing: '0.2em' }}
            >
              {loading ? 'Updating...' : 'Set New Password'}
            </button>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(196,90,90,0.08)', border: '1px solid rgba(196,90,90,0.2)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--red)', textAlign: 'center' }}>
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  )
}
