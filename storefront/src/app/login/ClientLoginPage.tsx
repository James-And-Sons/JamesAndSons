'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { signInWithSocial } from './social-actions'
import { createClient } from '@/utils/supabase/client'

type Props = {
  searchParams: { message?: string; next?: string }
  referer?: string
}

export default function ClientLoginPage({ searchParams, referer }: Props) {
  const [isLogin, setIsLogin] = useState(true)
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal')

  let nextUrl = searchParams.next || '/'
  if (!searchParams.next && referer && !referer.includes('/login')) {
    try {
      nextUrl = new URL(referer).pathname + new URL(referer).search
    } catch {
      nextUrl = '/'
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch', paddingTop: '64px' }}>

      {/* ── Left Panel – Brand ── */}
      <div style={{
        display: 'none',
        width: '42%',
        background: 'var(--void)',
        borderRight: '1px solid var(--border)',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '32px',
        padding: '80px 60px',
        position: 'relative',
        overflow: 'hidden',
      }} className="auth-left-panel">
        {/* Gold abstract chandelier SVG */}
        <svg viewBox="0 0 200 320" style={{ position: 'absolute', top: '-10%', right: '-10%', width: '70%', opacity: 0.06 }} stroke="var(--gold)" fill="none">
          <line x1="100" y1="0" x2="100" y2="320" strokeWidth="0.8" />
          <ellipse cx="100" cy="80" rx="80" ry="12" strokeWidth="0.5" />
          <ellipse cx="100" cy="140" rx="60" ry="10" strokeWidth="0.5" />
          <ellipse cx="100" cy="200" rx="40" ry="8" strokeWidth="0.5" />
          {[40,70,100,130,160].map((x,i) => <line key={i} x1="100" y1="80" x2={x} y2="140" strokeWidth="0.4" strokeDasharray="3 3" />)}
          {[60,80,100,120,140].map((x,i) => <line key={i} x1="100" y1="140" x2={x} y2="200" strokeWidth="0.4" strokeDasharray="2 3" />)}
          {[20,60,100,140,180].map((x, i) => <circle key={i} cx={x} cy="148" r="2" fill="var(--gold)" stroke="none" opacity="0.6" />)}
          {[60,80,100,120,140].map((x, i) => <circle key={i} cx={x} cy="208" r="1.5" fill="var(--gold)" stroke="none" opacity="0.5" />)}
        </svg>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="hero-eyebrow" style={{ justifyContent: 'center', marginBottom: '24px' }}>Est. 1987</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '52px', fontWeight: 300, color: 'var(--cream)', lineHeight: 1, letterSpacing: '-0.01em', marginBottom: '20px' }}>
            James <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>&amp;</em> Sons
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: '280px', margin: '0 auto' }}>
            India's premier source for bespoke luxury chandeliers — serving architects, hospitality groups, and discerning homes since 1987.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '40px', position: 'relative', zIndex: 1, marginTop: '16px' }}>
          {[['500+', 'Designs'], ['230+', 'B2B Partners'], ['18', 'States']].map(([n, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', fontWeight: 300, color: 'var(--gold-light)' }}>{n}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel – Form ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', position: 'relative', background: 'var(--obsidian)' }}>

        {/* Toggle */}
        <div style={{ position: 'absolute', top: '24px', right: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {isLogin ? 'New here?' : 'Have an account?'}
          </span>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {isLogin ? 'Create Account →' : 'Sign In →'}
          </button>
        </div>

        <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <div className="section-label">{isLogin ? 'Returning Client' : 'New Account'}</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '40px', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.1, marginTop: '8px' }}>
              {isLogin ? 'Welcome Back' : 'Join the Family'}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.7 }}>
              {isLogin
                ? 'Sign in to access your orders, RFQs, and exclusive B2B pricing.'
                : 'Create your account to explore our full catalogue, request quotes, and track orders.'}
            </p>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="hidden" name="nextUrl" value={nextUrl} />

            {/* Account Type Toggle (Signup only) */}
            {!isLogin && (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                  I am purchasing for
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {(['personal', 'business'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAccountType(type)}
                      style={{
                        padding: '12px 16px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: accountType === type ? '1px solid var(--gold)' : '1px solid var(--border)',
                        background: accountType === type ? 'rgba(196,160,90,0.08)' : 'transparent',
                        color: accountType === type ? 'var(--gold)' : 'var(--text-muted)',
                      }}
                    >
                      {type === 'personal' ? '🏠 Personal Use' : '🏢 B2B / Business'}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="accountType" value={accountType} />
              </div>
            )}

            {/* Personal Fields */}
            {!isLogin && accountType === 'personal' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <AuthInput label="First Name" name="firstName" required />
                <AuthInput label="Last Name" name="lastName" required />
              </div>
            )}

            {/* Business Fields */}
            {!isLogin && accountType === 'business' && (
              <>
                <AuthInput label="Company / Firm Name" name="companyName" required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <AuthInput label="Contact Person" name="contactName" required />
                  <AuthInput label="GSTIN (Optional)" name="gstin" />
                </div>
              </>
            )}

            {/* Common Fields */}
            <AuthInput label="Email Address" name="email" type="email" required />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AuthInput label="Password" name="password" type="password" required={isLogin} />
              {isLogin && (
                <div style={{ textAlign: 'right' }}>
                  <a 
                    href="/forgot-password" 
                    style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '9px', 
                      letterSpacing: '0.1em', 
                      color: 'var(--text-muted)', 
                      textDecoration: 'none',
                      textTransform: 'uppercase'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    Forgot Password?
                  </a>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              formAction={isLogin ? login : signup}
              className="btn-primary"
              style={{ marginTop: '8px', width: '100%', letterSpacing: '0.2em' }}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>

            {/* Error message */}
            {searchParams?.message && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(196,90,90,0.08)',
                border: '1px solid rgba(196,90,90,0.2)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--red)',
                letterSpacing: '0.05em',
              }}>
                {searchParams.message}
              </div>
            )}

            {/* Social Logins */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>Or Continue With</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => signInWithSocial('google')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '10px', background: 'var(--surface)', border: '1px solid var(--border)',
                    fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', 
                    color: 'var(--cream)', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" preserveAspectRatio="xMidYMid meet"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
                  Google
                </button>
                <button 
                  type="button" 
                  onClick={() => signInWithSocial('facebook')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '10px', background: 'var(--surface)', border: '1px solid var(--border)',
                    fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', 
                    color: 'var(--cream)', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
                >
                  <svg width="14" height="14" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.248h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .auth-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

/* ── Reusable Input Field ── */
function AuthInput({
  label, name, type = 'text', required = false
}: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderBottom: '1px solid var(--border-gold)',
          color: 'var(--text)',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          padding: '10px 14px',
          outline: 'none',
          transition: 'border-color 0.2s',
          width: '100%',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.borderBottomColor = 'var(--gold)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.borderBottomColor = 'var(--border-gold)'; }}
      />
    </div>
  )
}
