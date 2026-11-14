'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Admin = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export default function TicketAssignment({
  ticketId,
  currentAssigneeId,
  admins,
  currentUser,
}: {
  ticketId: string;
  currentAssigneeId: string | null;
  admins: Admin[];
  currentUser: { id: string; email?: string | null };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assigneeId, setAssigneeId] = useState<string>(currentAssigneeId || '');

  const handleAssign = (newAssigneeId: string | null) => {
    const targetId = newAssigneeId === '' ? null : newAssigneeId;
    setAssigneeId(newAssigneeId || '');
    
    startTransition(async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedToId: targetId }),
        });

        if (!response.ok) {
          throw new Error('Failed to update assignment');
        }

        router.refresh();
      } catch (err) {
        console.error('Assignment update failed:', err);
        // Reset state on error
        setAssigneeId(currentAssigneeId || '');
      }
    });
  };

  return (
    <div className="flex items-center gap-4 bg-background border border-border/40 p-4 rounded-[4px]">
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[9px] uppercase tracking-wider text-muted">
          Assigned Support Agent
        </label>
        <select
          value={assigneeId}
          disabled={isPending}
          onChange={(e) => handleAssign(e.target.value)}
          className="bg-surface border border-border text-primary font-mono text-[11px] uppercase tracking-widest px-3 py-2 focus:outline-none focus:border-accent transition-colors disabled:opacity-50 cursor-pointer"
        >
          <option value="">Unassigned</option>
          {admins.map((admin) => (
            <option key={admin.id} value={admin.id}>
              {admin.firstName} {admin.lastName}
            </option>
          ))}
        </select>
      </div>

      {currentAssigneeId !== currentUser.id && (
        <button
          onClick={() => handleAssign(currentUser.id)}
          disabled={isPending}
          className="mt-4 font-mono text-[9px] uppercase tracking-widest text-accent border border-accent/20 px-4 py-2.5 hover:bg-accent/5 transition-all bg-background disabled:opacity-50 cursor-pointer"
        >
          {isPending ? 'Assigning...' : 'Assign to Me'}
        </button>
      )}
    </div>
  );
}
