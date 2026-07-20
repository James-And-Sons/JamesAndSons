'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import ClickableRow from '@/components/ClickableRow';
import PullLeadsButton from './PullLeadsButton';

interface RFQItem {
  id: string;
  rfqNumber: string;
  channel: string | null;
  createdAt: Date;
  projectName: string | null;
  status: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    company: { name: string } | null;
  };
  items: { quantity: number }[];
}

export default function RfqsTableClient({ rfqs }: { rfqs: RFQItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredRfqs = useMemo(() => {
    return rfqs.filter((r) => {
      const query = searchTerm.toLowerCase();
      const name = `${r.user.firstName} ${r.user.lastName}`.toLowerCase();
      const company = (r.user.company?.name || '').toLowerCase();

      const matchesSearch =
        !query ||
        r.rfqNumber.toLowerCase().includes(query) ||
        name.includes(query) ||
        company.includes(query) ||
        r.user.email.toLowerCase().includes(query) ||
        (r.projectName && r.projectName.toLowerCase().includes(query));

      const s = r.status.toUpperCase();
      let matchesStatus = true;
      if (statusFilter === 'SUBMITTED') {
        matchesStatus = ['SUBMITTED', 'DRAFT', 'UNDER_REVIEW'].includes(s);
      } else if (statusFilter === 'APPROVED') {
        matchesStatus = ['APPROVED', 'QUOTE_SENT'].includes(s);
      } else if (statusFilter === 'REJECTED') {
        matchesStatus = ['REJECTED', 'CANCELLED', 'EXPIRED'].includes(s);
      }

      return matchesSearch && matchesStatus;
    });
  }, [rfqs, searchTerm, statusFilter]);

  const pendingCount = useMemo(
    () => rfqs.filter((r) => ['SUBMITTED', 'DRAFT', 'UNDER_REVIEW'].includes(r.status.toUpperCase())).length,
    [rfqs]
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 premium-card p-6 rounded-lg">
        <div>
          <h1 className="font-serif text-[28px] font-normal text-primary tracking-wide m-0">
            RFQ &amp; Trade Inbox
          </h1>
          <p className="font-body text-muted text-[13px] mt-1 m-0">
            Commercial quotation requests, IndiaMART lead sync, and trade inquiries ({pendingCount} pending review).
          </p>
        </div>
        <div>
          <PullLeadsButton />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="premium-card flex flex-col overflow-hidden rounded-lg">
        {/* Controls Bar */}
        <div className="p-4 md:p-6 border-b border-border flex flex-wrap gap-3 bg-surface-muted/40 items-center justify-between">
          <div className="flex-1 min-w-[260px] flex items-center gap-2 border border-border bg-background px-3 py-2 rounded-sm focus-within:border-accent">
            <span className="text-muted text-xs" aria-hidden="true">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by RFQ ID, Customer, Company, or Project..."
              className="bg-transparent text-primary font-mono text-[12px] focus:outline-none w-full placeholder:text-muted/60"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-muted hover:text-primary font-mono text-[10px] uppercase"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              aria-label="Filter by Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-wider focus:outline-none focus:border-accent transition-colors cursor-pointer rounded-sm"
            >
              <option value="ALL">All Statuses ({rfqs.length})</option>
              <option value="SUBMITTED">Needs Review ({pendingCount})</option>
              <option value="APPROVED">Approved / Quote Sent</option>
              <option value="REJECTED">Rejected / Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive flex-1">
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">Quotations and trade inquiry requests</caption>
            <thead className="border-b border-border bg-surface-muted/20">
              <tr>
                <th scope="col" className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                  RFQ ID / Origin
                </th>
                <th scope="col" className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                  Customer &amp; Project
                </th>
                <th scope="col" className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                  Units Req.
                </th>
                <th scope="col" className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                  Status
                </th>
                <th scope="col" className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredRfqs.map((rfq) => {
                const s = (rfq.status || '').toUpperCase();
                const isPaid = ['APPROVED', 'QUOTE_SENT'].includes(s);
                const isProcessing = ['SUBMITTED', 'DRAFT', 'UNDER_REVIEW'].includes(s);

                const pillClass = isPaid ? 'status-paid' : isProcessing ? 'status-processing' : 'status-pending';

                const totalUnits = rfq.items.reduce((acc, curr) => acc + curr.quantity, 0);

                return (
                  <ClickableRow key={rfq.id} href={`/rfqs/${rfq.id}`} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[12px] text-accent font-semibold">
                          {rfq.rfqNumber}
                        </span>
                        <span className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-accent/30 text-accent bg-accent/5">
                          {rfq.channel ? rfq.channel.replace(/_/g, ' ') : 'STOREFRONT'}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-muted">
                        {new Date(rfq.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-serif text-[15px] text-primary">
                        {rfq.user.company?.name || `${rfq.user.firstName} ${rfq.user.lastName}`}
                      </div>
                      <div className="font-mono text-[10px] text-muted mt-0.5 tracking-wide">
                        {rfq.user.email} {rfq.user.phone ? `· ${rfq.user.phone}` : ''}
                      </div>
                      {rfq.projectName && (
                        <div className="font-mono text-[9px] text-accent/80 uppercase tracking-wider mt-1">
                          Project: {rfq.projectName}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono text-[13px] text-primary">
                      {totalUnits} {totalUnits === 1 ? 'unit' : 'units'}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`status-pill ${pillClass}`}>
                        <span className="dot" aria-hidden="true" />
                        <span>{s.replace(/_/g, ' ')}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/rfqs/${rfq.id}`}
                        className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent hover:text-white transition-colors"
                      >
                        Review Request →
                      </Link>
                    </td>
                  </ClickableRow>
                );
              })}

              {filteredRfqs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted font-mono text-[11px] uppercase tracking-widest">
                    No quotation requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
