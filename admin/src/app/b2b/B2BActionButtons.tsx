'use client';
import { useTransition } from 'react';
import { approveB2BUser, rejectB2BUser } from './actions';

export default function B2BActionButtons({ userId, companyId }: { userId: string, companyId: string }) {
  const [isPendingApprove, startApproveTransition] = useTransition();
  const [isPendingReject, startRejectTransition] = useTransition();

  const handleApprove = () => {
    startApproveTransition(async () => {
      const result = await approveB2BUser(userId);
      if (!result.success) {
        alert('Failed to approve user: ' + result.error);
      }
    });
  };

  const handleReject = () => {
    if (confirm('Are you sure you want to reject this business application?')) {
      startRejectTransition(async () => {
        const result = await rejectB2BUser(userId, companyId);
        if (!result.success) {
          alert('Failed to reject application: ' + result.error);
        }
      });
    }
  };

  return (
    <div className="flex gap-4 mt-auto">
      <button 
        onClick={handleReject} 
        disabled={isPendingReject || isPendingApprove}
        className="flex-1 py-3 border border-border bg-transparent text-secondary hover:text-red-400 hover:border-red-900 transition-colors font-mono text-[10px] uppercase tracking-[0.15em] disabled:opacity-50"
      >
        {isPendingReject ? 'Rejecting...' : 'Reject'}
      </button>
      
      <button 
        onClick={handleApprove} 
        disabled={isPendingApprove || isPendingReject}
        className="flex-1 py-3 bg-accent text-obsidian hover:bg-[#d8b46e] transition-colors font-mono text-[10px] uppercase tracking-[0.15em] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPendingApprove ? 'Approving...' : 'Approve'}
      </button>
    </div>
  );
}
