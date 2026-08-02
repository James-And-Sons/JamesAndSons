import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ExportCsvButton from './ExportCsvButton';
import SyncButton from './SyncButton';
export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { company: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Customer Directory</h1>
        <div className="flex gap-4">
          <SyncButton />
          <ExportCsvButton 
            data={users} 
            filename="james-and-sons-customers" 
            className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-6 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors bg-background" 
          />
        </div>
      </div>

      {/* Mobile Card List View (< md) */}
      <div className="block md:hidden space-y-4">
        {users.length === 0 ? (
          <div className="premium-card p-12 text-center font-mono text-[11px] text-muted uppercase tracking-widest">
            No registered customers found.
          </div>
        ) : (
          users.map((user: any) => (
            <div key={user.id} className="premium-card p-4 space-y-3">
              {/* Header: Name and Role badge */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-[17px] text-primary leading-snug">{user.firstName} {user.lastName}</h3>
                  {user.company && (
                    <span className="font-body text-[11px] text-accent italic mt-0.5 block">{user.company.name}</span>
                  )}
                </div>
                <span className={`font-mono text-[8px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-sm border shrink-0 ${
                  user.role === 'ADMIN' ? 'text-red-400 border-red-400/20 bg-red-400/5'
                  : user.role.startsWith('B2B') ? 'text-accent border-accent/20 bg-accent/5'
                  : 'text-muted border-border bg-background'
                }`}>
                  {user.role}
                </span>
              </div>

              {/* Email & Phone */}
              <div className="text-[12px] space-y-1 pt-2 border-t border-border/30">
                <div className="flex justify-between">
                  <span className="font-mono text-[9px] uppercase text-muted/60">Email</span>
                  <span className="font-body text-secondary">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-[9px] uppercase text-muted/60">Phone</span>
                  <span className="font-mono text-secondary">{user.phone || 'No phone'}</span>
                </div>
              </div>

              {/* Joined and Actions */}
              <div className="flex justify-between items-center text-[10px] font-mono pt-2 border-t border-border/20">
                <span className="text-muted/60">Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                <button className="text-accent hover:text-white transition-colors uppercase tracking-wider">
                  View Profile
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block table-responsive">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-[#16161a]">
              <th className="py-4 px-6 font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-normal">Customer Name</th>
              <th className="py-4 px-6 font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-normal">Email / Phone</th>
              <th className="py-4 px-6 font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-normal">Role / Company</th>
              <th className="py-4 px-6 font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-normal">Joined</th>
              <th className="py-4 px-6 font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <h2 className="font-serif text-[20px] text-primary mb-2">Directory Empty</h2>
                  <p className="font-body text-secondary text-[14px]">No registered customers found.</p>
                </td>
              </tr>
            ) : (
              users.map((user: any) => (
                <tr key={user.id} className="hover:bg-surface-muted transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-serif text-[17px] text-primary">{user.firstName} {user.lastName}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-body text-[13px] text-primary">{user.email}</div>
                    <div className="font-mono text-[11px] text-muted mt-0.5">{user.phone || 'No phone'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-sm border ${
                      user.role === 'ADMIN' ? 'text-red-400 border-red-400/20 bg-red-400/5'
                      : user.role.startsWith('B2B') ? 'text-accent border-accent/20 bg-accent/5'
                      : 'text-muted border-border bg-background'
                    }`}>
                      {user.role}
                    </span>
                    {user.company && (
                      <div className="font-body text-[12px] text-secondary mt-1.5 italic">
                        {user.company.name}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 font-body text-[13px] text-secondary">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent hover:text-white transition-colors">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
