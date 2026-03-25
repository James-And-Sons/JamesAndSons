'use client'

import { useState } from 'react'
import { loginAction } from './action'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    // Server action
    const result = await loginAction(formData)
    
    // The server action redirects on success, so we only handle errors here
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      {/* Visual Identity Side */}
      <div className="hidden md:flex flex-col justify-between p-12 lg:p-24 border-r border-border bg-surface relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="font-serif text-[32px] font-light text-primary tracking-wide mb-2">JAMES &amp; SONS</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Administrator Portal</p>
        </div>
        
        <div className="relative z-10 space-y-6 max-w-md">
          <p className="font-serif text-[28px] text-primary font-light leading-snug">
            Manage the global luxury experience.
          </p>
          <div className="h-px w-12 bg-accent/50" />
          <p className="font-body text-[13px] text-muted leading-relaxed">
            Authorized personnel only. For B2B partner access or customer portal, please navigate to the main storefront.
          </p>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="flex flex-col items-center justify-center p-8 lg:p-24">
        <div className="w-full max-w-sm space-y-12">
          
          <div className="text-center md:text-left space-y-2">
            <h1 className="font-serif text-[36px] text-primary font-light">Sign In</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Admin Workspace Access</p>
          </div>

          <form action={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-[13px] font-body p-4 text-center">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary block">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  className="w-full bg-transparent border border-border px-4 py-3 text-[14px] font-body text-primary focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50"
                  placeholder="admin@jamesandsons.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary block">Password</label>
                  <a 
                    href="/forgot-password" 
                    className="font-mono text-[9px] uppercase tracking-widest text-accent hover:text-gold transition-colors"
                  >
                    Forgot?
                  </a>
                </div>
                <input 
                  type="password" 
                  name="password"
                  required
                  className="w-full bg-transparent border border-border px-4 py-3 text-[14px] font-body text-primary focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-background font-mono text-[11px] uppercase tracking-[0.2em] py-4 hover:bg-gold transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </button>

            {/* Social Login Section */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border/50" />
                <span className="font-mono text-[9px] text-muted uppercase tracking-widest">Or Secure Entry Via</span>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              
              <button 
                type="button"
                onClick={() => import('./social-actions').then(m => m.signInWithSocial('google'))}
                className="w-full border border-border py-3 flex items-center justify-center gap-3 hover:bg-surface transition-colors group"
              >
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary group-hover:text-gold transition-colors">Google Workspace</span>
              </button>
            </div>
          </form>

          <p className="text-center font-mono text-[9px] uppercase tracking-widest text-muted/50 pt-8">
            &copy; {new Date().getFullYear()} James & Sons Internal
          </p>

        </div>
      </div>
    </div>
  )
}
