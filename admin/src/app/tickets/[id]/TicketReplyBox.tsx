'use client';
import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TicketReplyBox({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  };

  // Cmd+Enter / Ctrl+Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (message.trim() && !isPending) {
        submitReply();
      }
    }
  };

  const submitReply = () => {
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
            attachments: [],
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to submit response');
        }

        setMessage('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReply();
  };

  return (
    <div className="space-y-3">
      {/* Sleek inline mode switcher */}
      <div className="flex gap-4 border-b border-border/30 pb-1.5 px-1">
        <button
          type="button"
          onClick={() => setIsInternalNote(false)}
          className={`font-mono text-[9px] uppercase tracking-widest pb-1 transition-all cursor-pointer ${
            !isInternalNote
              ? 'text-accent border-b border-accent font-semibold'
              : 'text-muted hover:text-primary'
          }`}
        >
          Public Reply
        </button>
        <button
          type="button"
          onClick={() => setIsInternalNote(true)}
          className={`font-mono text-[9px] uppercase tracking-widest pb-1 transition-all cursor-pointer ${
            isInternalNote
              ? 'text-amber-500 border-b border-amber-500 font-semibold'
              : 'text-muted hover:text-primary'
          }`}
        >
          Internal Note
        </button>
      </div>

      {/* Unified composer card */}
      <div className={`group relative rounded-xl border transition-all duration-300 ${
        isInternalNote
          ? 'bg-amber-500/[0.02] border-amber-500/30 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/20'
          : 'bg-surface/40 backdrop-blur-md border-border/80 focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/15'
      }`}>
        <textarea
          ref={textareaRef}
          value={message}
          disabled={isPending}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isInternalNote
              ? 'Write a private team note (not visible to customer)...'
              : 'Write a message to send to the customer...'
          }
          className="w-full bg-transparent text-primary font-body text-[13.5px] leading-relaxed px-4 pt-3.5 pb-14 focus:outline-none transition-all resize-none min-h-[90px] placeholder:text-muted/40"
          style={{ fontSize: '16px' }} // Prevents iOS zoom
        />

        {/* Footer toolbar inside the card */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-3 pt-2 bg-gradient-to-t from-background/10 to-transparent pointer-events-none">
          <div className="font-mono text-[9px] text-muted/40 flex items-center gap-1.5 pointer-events-auto">
            {isInternalNote ? (
              <span className="text-amber-500/40">🔒 Internal Note</span>
            ) : (
              <span>⌘↵ to send</span>
            )}
          </div>

          <div className="pointer-events-auto">
            <button
              type="button"
              disabled={isPending || !message.trim()}
              onClick={submitReply}
              className={`font-mono text-[9px] uppercase tracking-widest px-4 py-2 transition-all cursor-pointer disabled:opacity-30 rounded-lg flex items-center gap-1.5 font-bold ${
                isInternalNote
                  ? 'bg-amber-500 text-background hover:bg-amber-400 disabled:hover:bg-amber-500 shadow-sm'
                  : 'bg-accent text-background hover:bg-accent/90 disabled:hover:bg-accent shadow-sm'
              }`}
            >
              {isPending ? (
                <>
                  <svg className="animate-spin w-2.5 h-2.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Sending
                </>
              ) : (
                <>
                  <span>{isInternalNote ? 'Save Note' : 'Send'}</span>
                  <span className="opacity-80">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="font-mono text-[9px] text-rose-400 uppercase tracking-widest mt-1.5 px-1 animate-pulse">
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
