'use client'

import { useState, useTransition } from 'react'
import { inviteAdminAction, removeAdminAction } from './actions'

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: Date;
}

export default function ManageAdminsClient({ admins }: { admins: AdminUser[] }) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await inviteAdminAction(fd)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Invitation sent successfully!')
        setShowForm(false)
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  async function handleRemove(id: string, email: string) {
    if (!confirm(`Are you sure you want to revoke access for ${email}?`)) return
    
    setError('')
    startTransition(async () => {
      const result = await removeAdminAction(id)
      if (result.error) {
        setError(`Failed to remove: ${result.error}`)
      }
    })
  }

  return (
    <div className="space-y-6">
      
      {/* Action Bar */}
      <div className="flex justify-end">
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn-primary font-mono text-[10px] uppercase tracking-[0.12em] px-6 py-3"
        >
          {showForm ? 'Cancel' : '+ Invite Staff Member'}
        </button>
      </div>

      {error && <div className="p-4 border border-red-900/40 bg-red-900/10 text-red-400 font-mono text-[11px]">{error}</div>}
      {success && <div className="p-4 border border-[#4ade80]/20 bg-[#4ade80]/10 text-[#4ade80] font-mono text-[11px]">{success}</div>}

      {/* Invite Form */}
      {showForm && (
        <div className="bg-surface border border-accent/30 p-8 space-y-6">
          <h2 className="font-serif text-[20px] text-primary">Invite Administrator</h2>
          
          <form onSubmit={handleInvite} className="grid grid-cols-2 gap-6">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-2">First Name *</label>
              <input required name="firstName" className="w-full bg-background border border-border px-4 py-3 text-[14px] text-primary focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-2">Last Name</label>
              <input name="lastName" className="w-full bg-background border border-border px-4 py-3 text-[14px] text-primary focus:outline-none focus:border-accent" />
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-2">Email Address *</label>
              <input required type="email" name="email" className="w-full bg-background border border-border px-4 py-3 text-[14px] text-primary focus:outline-none focus:border-accent" />
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-2">System Role *</label>
              <select name="role" className="w-full bg-background border border-border px-4 py-3 text-[14px] text-primary focus:outline-none focus:border-accent">
                <option value="ADMIN">Administrator (Full Access)</option>
                <option value="B2B_APPROVER">B2B Approver (Limited)</option>
              </select>
            </div>

            <div className="col-span-2 flex justify-end mt-4">
              <button 
                type="submit" 
                disabled={isPending}
                className="btn-primary font-mono text-[10px] uppercase tracking-widest px-8 py-3 disabled:opacity-50"
              >
                {isPending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-surface border border-border overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-[#1a1a1f]">
            <tr>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Staff Member</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Role</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Added</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.id} className="border-b border-border hover:bg-[#1a1a1f] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-serif text-[15px] text-primary">{admin.firstName} {admin.lastName}</div>
                  <div className="font-mono text-[11px] text-muted mt-1">{admin.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-1 border ${
                    admin.role === 'ADMIN' ? 'text-accent border-accent/30 bg-accent/10' : 'text-[#60a5fa] border-[#60a5fa]/30 bg-[#60a5fa]/10'
                  }`}>
                    {admin.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-[11px] text-secondary">
                  {new Date(admin.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleRemove(admin.id, admin.email)}
                    disabled={isPending}
                    className="font-mono text-[9px] uppercase tracking-[0.1em] text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    Revoke Access
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
