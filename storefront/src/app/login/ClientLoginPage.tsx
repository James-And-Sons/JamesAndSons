'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { signInWithSocial } from './social-actions'

type Props = {
  searchParams: { message?: string; next?: string }
  referer?: string
}

export default function ClientLoginPage({ searchParams, referer }: Props) {
  const [isLogin, setIsLogin] = useState(true)
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal')

  let nextUrl = searchParams.next || '/'
  const authPages = ['/login', '/forgot-password', '/update-password', '/auth']
  
  if (authPages.some(page => nextUrl.includes(page))) {
    nextUrl = '/'
  } else if (!searchParams.next && referer && !authPages.some(page => referer.includes(page))) {
    try {
      nextUrl = new URL(referer).pathname + new URL(referer).search
    } catch {
      nextUrl = '/'
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch', paddingTop: '64px', background: 'var(--obsidian)' }}>
      
      {/* ── Left Panel – Brand (Desktop Only) ── */}
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
        <svg viewBox="0 0 200 320" style={{ position: 'absolute', top: '-10%', right: '-10%', width: '70%', opacity: 0.06 }} stroke="var(--gold)" fill="none">
          <line x1="100" y1="0" x2="100" y2="320" strokeWidth="0.8" />
          <ellipse cx="100" cy="80" rx="80" ry="12" strokeWidth="0.5" />
          <ellipse cx="100" cy="140" rx="60" ry="10" strokeWidth="0.5" />
          <ellipse cx="100" cy="200" rx="40" ry="8" strokeWidth="0.5" />
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

      {/* ── Main Form Panel (Responsive) ── */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: 'clamp(40px, 8vw, 80px) 24px', 
        position: 'relative' 
      }}>
        
        {/* Toggle (Desktop Position) */}
        <div className="hidden md:flex" style={{ position: 'absolute', top: '24px', right: '40px', alignItems: 'center', gap: '8px' }}>
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
          <div style={{ marginBottom: '40px' }}>
            <div className="section-label">{isLogin ? 'Returning Client' : 'New Account'}</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.1, marginTop: '8px' }}>
              {isLogin ? 'Welcome ' : 'Join the '}<em>{isLogin ? 'Back' : 'Family'}</em>
            </h2>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <button 
              type="button" 
              onClick={() => signInWithSocial('google', nextUrl)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', width: '100%', padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--cream)', borderRadius: '12px', cursor: 'pointer', letterSpacing: '0.15em' }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
              Continue with Google
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
              <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.15em' }}>Or via email</span>
              <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
            </div>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="hidden" name="nextUrl" value={nextUrl} />


            {/* Account Type Toggle (Signup only) */}
            {!isLogin && (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                  I am purchasing for
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {(['personal', 'business'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAccountType(type)}
                      style={{
                        padding: '14px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: accountType === type ? '1px solid var(--gold)' : '1px solid var(--border)',
                        background: accountType === type ? 'rgba(196,160,90,0.08)' : 'transparent',
                        color: accountType === type ? 'var(--gold)' : 'var(--text-muted)',
                        borderRadius: '12px',
                      }}
                    >
                      {type === 'personal' ? '🏠 Personal' : '🏢 Business'}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="accountType" value={accountType} />
              </div>
            )}

            {/* Fields */}
            {!isLogin && accountType === 'personal' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <AuthInput label="First Name" name="firstName" required />
                <AuthInput label="Last Name" name="lastName" required />
              </div>
            )}

            {!isLogin && accountType === 'business' && (
              <>
                <AuthInput label="Company / Firm Name" name="companyName" required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <AuthInput label="Contact Person" name="contactName" required />
                  <AuthInput label="GSTIN (Optional)" name="gstin" />
                </div>
              </>
            )}

            <AuthInput label="Email Address" name="email" type="email" required />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AuthInput label="Password" name="password" type="password" required={isLogin} />
              {isLogin && (
                <div style={{ textAlign: 'right' }}>
                  <a href="/forgot-password" style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', textDecoration: 'none', textTransform: 'uppercase' }}>Forgot Password?</a>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              formAction={isLogin ? login : signup}
              className="btn-primary"
              style={{ marginTop: '8px', width: '100%', padding: '16px', borderRadius: '12px', letterSpacing: '0.2em' }}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>

            {/* Mobile Toggle */}
            <div className="md:hidden" style={{ textAlign: 'center', marginTop: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {isLogin ? 'New here? ' : 'Have an account? '}
              </span>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gold)', background: 'transparent', border: 'none', textTransform: 'uppercase', padding: 0 }}
              >
                {isLogin ? 'Create Account →' : 'Sign In →'}
              </button>
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

function AuthInput({ label, name, type = 'text', required = false }: { label: string; name: string; type?: string; required?: boolean }) {
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
          padding: '14px 16px',
          outline: 'none',
          transition: 'border-color 0.2s',
          width: '100%',
          borderRadius: '12px'
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.borderBottomColor = 'var(--gold)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.borderBottomColor = 'var(--border-gold)'; }}
      />
    </div>
  )
}
