import { prisma } from '@/lib/prisma';
import Link from 'next/link';

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
          <button className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-6 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors bg-background">Export CSV</button>
        </div>
      </div>

      <div className="bg-surface border border-border overflow-hidden shadow-sm">
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
              users.map(user => (
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
