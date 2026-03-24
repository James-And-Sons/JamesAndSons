'use client';
import { useState } from 'react';

export default function CSVImportPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState('');

  function parseCSV(text: string): any[] {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      return headers.reduce((obj: any, h, i) => { obj[h] = vals[i] || ''; return obj; }, {});
    });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = parseCSV(ev.target?.result as string);
        setRows(parsed);
        setResult(null);
        setError('');
      } catch {
        setError('Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setImporting(true);
    setError('');
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setRows([]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  }

  const expectedColumns = ['name', 'sku', 'description', 'mrp', 'd2cPrice', 'b2bPrice', 'stockQuantity', 'categorySlug'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-surface border border-border p-6">
        <h1 className="font-serif text-[28px] font-light text-primary m-0">CSV Import</h1>
        <p className="font-mono text-[11px] text-muted mt-2 uppercase tracking-widest">Bulk import products from a spreadsheet</p>
      </div>

      <div className="bg-surface border border-border p-6 space-y-4">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted border-b border-border pb-2">Expected Columns</h3>
        <div className="flex flex-wrap gap-2">
          {expectedColumns.map(col => (
            <span key={col} className="font-mono text-[10px] text-accent bg-accent/10 border border-accent/20 px-2 py-0.5">{col}</span>
          ))}
        </div>
        <p className="font-body text-[13px] text-secondary">
          <strong className="text-primary">categorySlug</strong> must match an existing collection slug. All price fields should be numbers without currency symbols.
        </p>
      </div>

      <div className="bg-surface border border-border p-6 space-y-4">
        <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-3">Upload CSV File</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="block w-full font-mono text-[12px] text-secondary file:mr-4 file:py-2 file:px-4 file:border file:border-accent/30 file:bg-accent/10 file:text-accent file:font-mono file:text-[9px] file:uppercase file:tracking-widest file:cursor-pointer hover:file:border-accent"
        />
      </div>

      {rows.length > 0 && (
        <div className="bg-surface border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <span className="font-mono text-[11px] text-secondary">{rows.length} rows ready to import</span>
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn-primary font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 disabled:opacity-50"
            >
              {importing ? 'Importing...' : `Import ${rows.length} Products →`}
            </button>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#1a1a1f] border-b border-border sticky top-0">
                <tr>
                  {Object.keys(rows[0]).map(h => (
                    <th key={h} className="px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Object.values(row).map((v: any, j) => (
                      <td key={j} className="px-4 py-2 font-body text-secondary whitespace-nowrap">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && <div className="p-4 border border-red-900/40 bg-red-900/10 text-red-400 font-mono text-[12px]">⚠ {error}</div>}

      {result && (
        <div className="p-4 border border-[#4ade80]/20 bg-[#4ade80]/05">
          <p className="font-mono text-[12px] text-[#4ade80]">✓ Import complete: {result.success} products created, {result.failed} failed.</p>
        </div>
      )}
    </div>
  );
}
