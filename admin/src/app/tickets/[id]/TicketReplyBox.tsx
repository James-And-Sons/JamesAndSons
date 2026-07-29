'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function TicketReplyBox({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            isInternalNote,
            attachments: [], // Support list of attachments if needed later
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to submit response');
        }

        setMessage('');
        router.refresh();
      } catch (err: any) {
        console.error('Failed to submit response:', err);
        setError(err.message || 'Something went wrong');
      }
    });
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`premium-card p-3 md:p-6 space-y-3 md:space-y-4 border transition-all duration-300 ${
        isInternalNote 
          ? 'bg-amber-500/5 border-amber-500/30' 
          : 'bg-surface/90 border-border/50'
      }`}
    >
      <div className="flex justify-between items-center border-b border-border/30 pb-2 md:pb-3">
        <div className="flex gap-3 md:gap-4">
          <button
            type="button"
            onClick={() => setIsInternalNote(false)}
            className={`font-mono text-[9px] uppercase tracking-widest pb-1 transition-all cursor-pointer ${
              !isInternalNote 
                ? 'text-accent border-b border-accent font-medium' 
                : 'text-muted hover:text-primary'
            }`}
          >
            Public Response
          </button>
          <button
            type="button"
            onClick={() => setIsInternalNote(true)}
            className={`font-mono text-[9px] uppercase tracking-widest pb-1 transition-all cursor-pointer ${
              isInternalNote 
                ? 'text-amber-500 border-b border-amber-500 font-medium' 
                : 'text-muted hover:text-primary'
            }`}
          >
            Internal Note
          </button>
        </div>
        <div className="font-mono text-[8px] md:text-[9px] text-muted">
          {isInternalNote ? (
            <span className="text-amber-500/80">⚠️ Internal</span>
          ) : (
            <span>Sends email</span>
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          value={message}
          disabled={isPending}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isInternalNote 
              ? "Type internal note..." 
              : "Type public response... (Sends email)"
          }
          rows={2}
          className="w-full bg-background border border-border text-primary font-body text-[13px] leading-relaxed p-3 focus:outline-none focus:border-accent transition-all resize-y min-h-[44px]"
        />
      </div>

      {error && (
        <div className="font-mono text-[10px] text-rose-500 uppercase tracking-wider">
          Error: {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !message.trim()}
          className={`font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 md:px-6 md:py-3 transition-all cursor-pointer disabled:opacity-50 min-h-[44px] ${
            isInternalNote
              ? 'bg-amber-500 text-background hover:bg-amber-600 font-bold'
              : 'bg-accent text-background hover:bg-accent/90 font-bold'
          }`}
        >
          {isPending ? 'Submitting...' : isInternalNote ? 'Save Note' : 'Reply'}
        </button>
      </div>
    </form>

  );
}
