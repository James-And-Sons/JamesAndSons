'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import ClickableRow from '@/components/ClickableRow';

interface OrderItem {
  id: string;
  displayId: string;
  date: Date;
  customerName: string;
  company: string | null;
  email: string;
  totalValue: number;
  status: string;
}

export default function OrdersTableClient({ records }: { records: OrderItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        !query ||
        r.displayId.toLowerCase().includes(query) ||
        r.customerName.toLowerCase().includes(query) ||
        (r.company && r.company.toLowerCase().includes(query)) ||
        r.email.toLowerCase().includes(query);

      const s = r.status.toUpperCase();
      let matchesStatus = true;
      if (statusFilter === 'PAID') {
        matchesStatus = ['DELIVERED', 'PAID', 'SUCCESS', 'SHIPPED'].includes(s);
      } else if (statusFilter === 'PROCESSING') {
        matchesStatus = ['PENDING', 'PROCESSING', 'SUBMITTED'].includes(s);
      } else if (statusFilter === 'CANCELLED') {
        matchesStatus = ['CANCELLED', 'REFUNDED', 'FAILED'].includes(s);
      }

      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No records to export.');
      return;
    }

    const headers = ['Order ID', 'Date', 'Customer Name', 'Company', 'Email', 'Total Value', 'Status'];
    const rows = filteredRecords.map((r) => [
      r.displayId,
      new Date(r.date).toISOString().split('T')[0],
      r.customerName,
      r.company || '',
      r.email,
      r.totalValue,
      r.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `james-and-sons-orders-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 premium-card p-6 rounded-lg">
        <div>
          <h1 className="font-serif text-[28px] font-normal text-primary tracking-wide m-0">
            Orders &amp; Logistics
          </h1>
          <p className="font-body text-muted text-[13px] mt-1 m-0">
            Manage incoming customer payments, D2C dispatches, and order fulfillment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-secondary border border-border px-4 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors bg-background rounded-sm cursor-pointer"
          >
            Export CSV ({filteredRecords.length})
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="premium-card flex flex-col overflow-hidden rounded-lg">
        {/* Controls: Search and Filters */}
        <div className="p-4 md:p-6 border-b border-border flex flex-wrap gap-3 bg-surface-muted/40 items-center justify-between">
          <div className="flex-1 min-w-[260px] flex items-center gap-2 border border-border bg-background px-3 py-2 rounded-sm focus-within:border-accent">
            <span className="text-muted text-xs" aria-hidden="true">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order ID, Customer, or Email..."
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

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              aria-label="Filter by Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-wider focus:outline-none focus:border-accent transition-colors cursor-pointer rounded-sm"
            >
              <option value="ALL">All Statuses ({records.length})</option>
              <option value="PAID">Paid / Delivered / Shipped</option>
              <option value="PROCESSING">Pending / Processing</option>
              <option value="CANCELLED">Cancelled / Refunded</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="table-responsive flex-1">
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">List of customer orders</caption>
            <thead className="border-b border-border bg-surface-muted/20">
              <tr>
                <th scope="col" className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                  Date
                </th>
                <th scope="col" className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                  Customer / Company
                </th>
                <th scope="col" className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">
                  Total Amount
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
              {filteredRecords.map((record) => {
                const s = (record.status || '').toUpperCase();
                const isPaid = ['DELIVERED', 'PAID', 'SUCCESS', 'SHIPPED'].includes(s);
                const isProcessing = ['PENDING', 'PROCESSING'].includes(s);

                const pillClass = isPaid ? 'status-paid' : isProcessing ? 'status-processing' : 'status-pending';
                const href = `/orders/${record.id}`;

                return (
                  <ClickableRow key={record.id} href={href} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-[12px] text-accent hover:underline font-semibold">
                        {record.displayId}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-muted">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-serif text-[15px] text-primary">
                        {record.company || record.customerName}
                      </div>
                      <div className="font-mono text-[10px] text-muted mt-0.5 tracking-wide">
                        {record.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[13px] text-primary text-right tabular-nums">
                      ₹{Math.round(record.totalValue).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`status-pill ${pillClass}`}>
                        <span className="dot" aria-hidden="true" />
                        <span>{s.replace(/_/g, ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={href}
                        className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent hover:text-white transition-colors"
                      >
                        View Details →
                      </Link>
                    </td>
                  </ClickableRow>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted font-mono text-[11px] uppercase tracking-widest">
                    No matching customer orders found.
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
