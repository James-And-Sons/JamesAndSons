import UpdatePasswordForm from './UpdatePasswordForm'

export default function UpdatePasswordPage() {
  return (
    <>
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

          <UpdatePasswordForm />
        </div>
      </div>
    </>
  )
}

