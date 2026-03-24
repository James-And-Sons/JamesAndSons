import { prisma } from '@/lib/prisma';
import B2BActionButtons from './B2BActionButtons';

export default async function B2BWorkspacePage() {
  // Fetch pending applications: Users who have a company but are still just CUSTOMERs
  const pendingApps = await prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
      companyId: { not: null }
    },
    include: {
      company: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Also fetch approved ones for reference? Just pending for now.

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">B2B Applications</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted mt-2">
            {pendingApps.length} pending review
          </p>
        </div>
      </div>

      {pendingApps.length === 0 ? (
        <div className="bg-surface border border-border shadow-sm flex flex-col p-12 items-center justify-center min-h-[400px]">
          <h2 className="font-serif text-[24px] text-primary mb-2">No pending applications</h2>
          <p className="font-body text-secondary text-[14px] text-center max-w-md">
            There are currently no B2B wholesale applications requiring review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingApps.map(user => (
            <div key={user.id} className="bg-surface border border-border p-6 relative flex flex-col hover:border-accent transition-colors">
              <div className="absolute top-0 right-0 p-3">
                <span className="bg-[#1c1c21] text-accent font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-1 rounded-sm border border-[rgba(196,160,90,0.2)]">
                  Pending
                </span>
              </div>
              
              <div className="mb-4">
                <h3 className="font-serif text-[20px] text-primary mb-1">{user.company?.name || 'Unknown Company'}</h3>
                <p className="font-mono text-[11px] text-muted tracking-wide">{user.company?.gstin ? `GSTIN: ${user.company.gstin}` : 'No GSTIN Provided'}</p>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-1">Applicant</label>
                  <p className="font-body text-[14px] text-secondary">{user.firstName} {user.lastName}</p>
                  <p className="font-body text-[13px] text-secondary">{user.email}</p>
                  {user.phone && <p className="font-body text-[13px] text-secondary">{user.phone}</p>}
                </div>
                
                {user.company?.billingAddress && (
                  <div>
                    <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-1">Operations Address</label>
                    <p className="font-body text-[13px] text-secondary leading-relaxed line-clamp-2">{user.company.billingAddress}</p>
                  </div>
                )}
                
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-1">Applied</label>
                  <p className="font-body text-[13px] text-secondary">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <B2BActionButtons userId={user.id} companyId={user.company!.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
