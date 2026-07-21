import { Suspense } from 'react'
import Navigation from '@/components/Navigation'
import ForgotPasswordForm from './ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <>
      <Navigation />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--obsidian)', padding: '20px', paddingTop: '80px' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', padding: '48px' }}>
          
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>Account Recovery</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 300, color: 'var(--cream)', marginTop: '8px' }}>
              Reset Password
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.6 }}>
              Enter the email address associated with your account, and we'll send you a link to reset your password.
            </p>
          </div>

          <Suspense fallback={<div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>Loading...</div>}>
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
    </>
  )
}

