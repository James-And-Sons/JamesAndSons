'use client';
import { useTransition } from 'react';
import { approveB2BUser, rejectB2BUser } from './actions';
import { CheckCircle, XCircle } from 'lucide-react';

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
    // Use a more PWA-safe pattern than window.confirm on mobile
    const confirmed = typeof window !== 'undefined'
      ? window.confirm('Are you sure you want to reject this business application?')
      : false;
    if (confirmed) {
      startRejectTransition(async () => {
        const result = await rejectB2BUser(userId, companyId);
        if (!result.success) {
          alert('Failed to reject application: ' + result.error);
        }
      });
    }
  };

  return (
    /* Stack vertically on mobile (flex-col), side-by-side on sm+ (sm:flex-row) */
    <div className="flex flex-col sm:flex-row gap-3 mt-auto">
      <button 
        onClick={handleReject} 
        disabled={isPendingReject || isPendingApprove}
        className="flex-1 flex items-center justify-center gap-2 py-3 min-h-[52px] border border-border bg-transparent text-secondary hover:text-red-400 hover:border-red-900 transition-colors font-mono text-[10px] uppercase tracking-[0.15em] disabled:opacity-50 rounded-sm touch-target cursor-pointer"
      >
        <XCircle size={14} aria-hidden="true" />
        {isPendingReject ? 'Rejecting...' : 'Reject'}
      </button>
      
      <button 
        onClick={handleApprove} 
        disabled={isPendingApprove || isPendingReject}
        className="flex-1 flex items-center justify-center gap-2 py-3 min-h-[52px] bg-accent text-obsidian hover:bg-[#d8b46e] transition-colors font-mono text-[10px] uppercase tracking-[0.15em] font-semibold disabled:opacity-50 disabled:cursor-not-allowed rounded-sm touch-target cursor-pointer"
      >
        <CheckCircle size={14} aria-hidden="true" />
        {isPendingApprove ? 'Approving...' : 'Approve'}
      </button>
    </div>
  );
}
