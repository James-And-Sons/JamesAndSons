'use client';

import { useState } from 'react';

type InquiryStatus = 'NEW' | 'CONTACTED' | 'ARCHIVED';

interface Inquiry {
  id: string;
  email: string;
  name: string | null;
  subject: string;
  message: string;
  recipient: string;
  status: InquiryStatus;
  createdAt: string;
}

export default function InquiriesDashboard({ initialInquiries }: { initialInquiries: Inquiry[] }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [activeTab, setActiveTab] = useState<'NEW' | 'CONTACTED' | 'ARCHIVED' | 'ALL'>('NEW');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = inquiries.filter(i => {
    if (activeTab === 'ALL') return true;
    return i.status === activeTab;
  });

  const handleStatusUpdate = async (id: string, status: InquiryStatus) => {
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok && data.inquiry) {
        setInquiries(prev => prev.map(item => item.id === id ? { ...item, status } : item));
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const newCount = inquiries.filter(i => i.status === 'NEW').length;
  const contactedCount = inquiries.filter(i => i.status === 'CONTACTED').length;
  const archivedCount = inquiries.filter(i => i.status === 'ARCHIVED').length;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs - Scrollable on mobile */}
      <div className="flex border-b border-border space-x-1 overflow-x-auto flex-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('NEW')}
          className={`px-4 py-3 font-mono text-[11px] uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'NEW'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          <span>New Leads</span>
          {newCount > 0 && (
            <span className="bg-[#f59e0b] text-black font-mono text-[9px] px-1.5 py-0.5 rounded-sm font-medium">
              {newCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('CONTACTED')}
          className={`px-4 py-3 font-mono text-[11px] uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'CONTACTED'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          <span>Contacted</span>
          <span className="text-muted font-mono text-[10px]">({contactedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('ARCHIVED')}
          className={`px-4 py-3 font-mono text-[11px] uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'ARCHIVED'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          <span>Archived</span>
          <span className="text-muted font-mono text-[10px]">({archivedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-3 font-mono text-[11px] uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'ALL'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          <span>All Inquiries</span>
          <span className="text-muted font-mono text-[10px]">({inquiries.length})</span>
        </button>
      </div>

      {/* Inquiry List */}
      {filtered.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">No inquiries found in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inquiry) => {
            const isExpanded = expandedId === inquiry.id;
            const isSales = inquiry.recipient.includes('sales');

            const handleCardClick = (e: React.MouseEvent) => {
              // Don't toggle expansion if clicking standard action buttons
              const target = e.target as HTMLElement;
              const isAction = target.tagName === 'BUTTON' || target.closest('button');
              if (!isAction) {
                setExpandedId(isExpanded ? null : inquiry.id);
              }
            };

            return (
              <div
                key={inquiry.id}
                onClick={handleCardClick}
                className={`premium-card cursor-pointer transition-all ${
                  inquiry.status === 'NEW' ? 'border-l-4 border-l-[#f59e0b]' : ''
                }`}
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-mono text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-wider font-medium ${
                        isSales ? 'bg-purple-950/40 text-purple-300 border border-purple-800/40' : 'bg-blue-950/40 text-blue-300 border border-blue-800/40'
                      }`}>
                        {inquiry.recipient}
                      </span>

                      <span className={`font-mono text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-wider font-medium ${
                        inquiry.status === 'NEW' ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40' :
                        inquiry.status === 'CONTACTED' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40' :
                        'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {inquiry.status}
                      </span>

                      <span className="font-mono text-[10px] text-muted">
                        {new Date(inquiry.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="font-serif text-[16px] text-primary font-normal tracking-wide">
                      {inquiry.subject}
                    </h3>

                    <p className="font-mono text-[11px] text-muted">
                      From: <span className="text-secondary font-medium">{inquiry.name ? `${inquiry.name} <${inquiry.email}>` : inquiry.email}</span>
                    </p>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : inquiry.id)}
                      className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border border-border text-muted hover:text-primary hover:border-muted rounded-sm transition-colors cursor-pointer min-h-[36px]"
                    >
                      {isExpanded ? 'Collapse ▲' : 'View Message ▼'}
                    </button>

                    {inquiry.status !== 'CONTACTED' && (
                      <button
                        disabled={updatingId === inquiry.id}
                        onClick={() => handleStatusUpdate(inquiry.id, 'CONTACTED')}
                        className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/50 rounded-sm transition-colors cursor-pointer disabled:opacity-50 min-h-[36px]"
                      >
                        Mark Contacted
                      </button>
                    )}

                    {inquiry.status !== 'ARCHIVED' && (
                      <button
                        disabled={updatingId === inquiry.id}
                        onClick={() => handleStatusUpdate(inquiry.id, 'ARCHIVED')}
                        className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200 rounded-sm transition-colors cursor-pointer disabled:opacity-50 min-h-[36px]"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>


                {/* Expanded Message View */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-border/40 space-y-4">
                    <div className="bg-background/80 p-4 border border-border/50 rounded-sm">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">Message Body</p>
                      <div className="text-[13px] text-primary whitespace-pre-wrap font-sans leading-relaxed">
                        {inquiry.message}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-muted font-mono text-[10px] flex-wrap gap-2">
                      <span>Reply directly via email to: <a href={`mailto:${inquiry.email}?subject=Re: ${encodeURIComponent(inquiry.subject)}`} className="text-accent underline">{inquiry.email}</a></span>
                      <span className="uppercase">Recipient Inbox: {inquiry.recipient}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
