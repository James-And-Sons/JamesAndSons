'use client';
import { useRouter } from 'next/navigation';

export default function OrderActionsClient({ data }: { data: any[] }) {
  const router = useRouter();

  const handleExportCSV = () => {
    if (data.length === 0) {
      alert('No data to export.');
      return;
    }

    const headers = ['Type', 'Display ID', 'Date', 'Customer Name', 'Company', 'Email', 'Total Value', 'Status'];
    const rows = data.map(record => [
      record.type,
      record.displayId,
      new Date(record.date).toISOString().split('T')[0],
      record.customerName,
      record.company || '',
      record.email,
      record.totalValue,
      record.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
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

  const handleCreateOrder = () => {
    alert('Create Order feature is coming soon!');
  };

  return (
    <div className="flex gap-4">
      <button 
        onClick={handleExportCSV}
        className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-6 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors bg-background"
      >
        Export CSV
      </button>
      <button 
        onClick={handleCreateOrder}
        className="btn-primary"
      >
        Create Order
      </button>
    </div>
  );
}
