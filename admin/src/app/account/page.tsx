export default function AccountPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Admin Settings</h1>
        <div className="flex gap-4">
          <button className="btn-primary">Save Changes</button>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-sm p-8">
        <h2 className="font-serif text-[20px] text-primary mb-6">Profile Information</h2>
        
        <div className="grid grid-cols-2 gap-8 max-w-2xl">
          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Full Name</label>
            <input type="text" defaultValue="Super Admin" className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent" disabled />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Email Address</label>
            <input type="email" defaultValue="admin@jamesandsons.com" className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent" disabled />
          </div>
          <div className="space-y-2 col-span-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Role</label>
            <input type="text" defaultValue="System Administrator" className="w-full bg-surface-muted border border-border px-4 py-3 text-secondary font-body text-[14px] cursor-not-allowed" disabled />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-sm p-8 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-[20px] text-primary">System Administration</h2>
        </div>
        <p className="font-body text-[13px] text-muted mb-6">
          Invite new staff members, assign roles, and revoke access for internal users.
        </p>
        <a href="/account/manage-admins" className="btn-outline inline-block text-center font-mono text-[10px] uppercase tracking-[0.1em] px-6 py-3">
          Manage Administrators →
        </a>
      </div>
    </div>
  );
}
