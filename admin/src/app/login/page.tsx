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
                <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary block">Password</label>
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
          </form>

          <p className="text-center font-mono text-[9px] uppercase tracking-widest text-muted/50 pt-8">
            &copy; {new Date().getFullYear()} James & Sons Internal
          </p>

        </div>
      </div>
    </div>
  )
}
