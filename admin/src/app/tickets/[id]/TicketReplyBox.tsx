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
    <form onSubmit={handleSubmit} className="flex flex-col gap-0">
      {/* Mode Switcher — full-width segmented control */}
      <div className={`flex rounded-t-[6px] border border-b-0 overflow-hidden transition-colors ${
        isInternalNote ? 'border-amber-500/40' : 'border-border'
      }`}>
        <button
          type="button"
          onClick={() => setIsInternalNote(false)}
          className={`flex-1 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            !isInternalNote
              ? 'bg-accent/15 text-accent font-semibold border-r border-accent/20'
              : 'bg-surface text-muted hover:text-primary border-r border-border'
          }`}
        >
          <span className="text-[12px]">✉</span> Public Reply
        </button>
        <button
          type="button"
          onClick={() => setIsInternalNote(true)}
          className={`flex-1 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            isInternalNote
              ? 'bg-amber-500/15 text-amber-400 font-semibold'
              : 'bg-surface text-muted hover:text-primary'
          }`}
        >
          <span className="text-[12px]">🔒</span> Internal Note
        </button>
      </div>

      {/* Composer Body */}
      <div className={`relative border border-t-0 rounded-b-[6px] transition-colors ${
        isInternalNote
          ? 'border-amber-500/40 bg-amber-500/[0.03]'
          : 'border-border bg-background'
      }`}>
        <textarea
          ref={textareaRef}
          value={message}
          disabled={isPending}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isInternalNote
              ? 'Write an internal note — not visible to the customer…'
              : 'Write a reply — this will be sent to the customer via email…'
          }
          rows={3}
          className={`w-full bg-transparent text-primary font-body text-[13px] leading-relaxed px-4 pt-3 pb-12 focus:outline-none transition-all resize-none min-h-[80px] placeholder:text-muted/50 ${
            isInternalNote ? 'placeholder:text-amber-500/30' : ''
          }`}
          style={{ fontSize: '16px' }} // Prevents iOS zoom
        />

        {/* Bottom toolbar inside textarea */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-2.5">
          <span className="font-mono text-[9px] text-muted/50">
            {isInternalNote
              ? '🔒 Only visible to your team'
              : '⌘↵ to send'}
          </span>

          <button
            type="submit"
            disabled={isPending || !message.trim()}
            className={`font-mono text-[10px] uppercase tracking-widest px-4 py-2 transition-all cursor-pointer disabled:opacity-40 min-h-[36px] rounded-[4px] flex items-center gap-2 ${
              isInternalNote
                ? 'bg-amber-500 text-background hover:bg-amber-400 font-bold disabled:hover:bg-amber-500'
                : 'bg-accent text-background hover:bg-accent/90 font-bold disabled:hover:bg-accent'
            }`}
          >
            {isPending ? (
              <>
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Sending…
              </>
            ) : (
              isInternalNote ? 'Save Note' : 'Send Reply'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="font-mono text-[10px] text-rose-400 uppercase tracking-wider mt-2 px-1">
          ⚠ {error}
        </div>
      )}
    </form>
  );
}
