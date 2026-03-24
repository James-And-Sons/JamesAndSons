'use client'

import { useState } from 'react'
import { applyForB2B } from './b2b-actions'

export default function ApplyB2BForm({ userEmail }: { userEmail: string }) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    
    const result = await applyForB2B(formData)
    
    setIsPending(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div style={{ padding: '40px', background: 'rgba(196,160,90,0.05)', border: '1px solid var(--border-gold)', textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--cream)', marginBottom: '12px' }}>Application Submitted</h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Thank you for applying. Our trade team will review your details and get back to you within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '40px' }}>
      <div className="section-label" style={{ marginBottom: '24px' }}>Wholesale Application</div>
      <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <FormInput label="Company Name" name="companyName" required />
          <FormInput label="Contact Person" name="contactName" required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <FormInput label="GSTIN (Optional)" name="gstin" />
          <FormInput label="Email" name="email" type="email" defaultValue={userEmail} disabled />
        </div>
        <FormInput label="Business / Billing Address" name="billingAddress" required />
        
        {error && (
          <div style={{ color: 'var(--red)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isPending}
          className="btn-primary" 
          style={{ width: '100%', marginTop: '10px', opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? 'Submitting...' : 'Submit B2B Application'}
        </button>
      </form>
    </div>
  )
}

function FormInput({ label, name, type = 'text', required = false, defaultValue = '', disabled = false }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        disabled={disabled}
        style={{
          background: 'var(--void)',
          border: '1px solid var(--border)',
          borderBottom: '1px solid var(--border-gold)',
          color: disabled ? 'var(--text-dim)' : 'var(--text)',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          padding: '12px 14px',
          outline: 'none',
          transition: 'border-color 0.2s',
          width: '100%',
          cursor: disabled ? 'not-allowed' : 'text'
        }}
      />
    </div>
  )
}
