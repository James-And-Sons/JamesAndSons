'use client';
import { useState, useEffect } from 'react';

type Catalogue = {
  id: string;
  title: string;
  description?: string | null;
  year: number;
  coverImage?: string | null;
  fileUrl: string;
  isPublished: boolean;
  downloads: number;
  createdAt: string;
};

const emptyForm = { title: '', description: '', year: new Date().getFullYear(), coverImage: '', fileUrl: '', isPublished: false };

export default function CataloguesClient() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/catalogues');
    const data = await res.json();
    setCatalogues(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.fileUrl) { setError('Title and PDF URL are required.'); return; }
    setSaving(true);
    setError('');
    const res = await fetch('/api/admin/catalogues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm(emptyForm);
      setShowForm(false);
      load();
    } else {
      setError('Failed to create catalogue.');
    }
    setSaving(false);
  }

  async function togglePublish(cat: Catalogue) {
    await fetch(`/api/admin/catalogues/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !cat.isPublished }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this catalogue? This cannot be undone.')) return;
    await fetch(`/api/admin/catalogues/${id}`, { method: 'DELETE' });
    load();
  }

  const inputClass = 'w-full px-3 py-2.5 bg-surface border border-border text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm';
  const labelClass = 'font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1.5';

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-[28px] text-primary">Product Catalogues</h1>
          <p className="font-mono text-[10px] text-muted uppercase tracking-[0.12em] mt-1">Manage downloadable PDF catalogues</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); }}
          className="font-mono text-[10px] uppercase tracking-[0.14em] bg-accent text-background px-5 py-2.5 rounded-sm hover:bg-accent-hover transition-colors cursor-pointer"
        >
          + Upload New Catalogue
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="border border-border bg-surface rounded-md p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent font-semibold">New Catalogue</span>
            <button onClick={() => { setShowForm(false); setError(''); }} className="font-mono text-[10px] text-muted hover:text-primary cursor-pointer border-none bg-transparent">✕ Cancel</button>
          </div>
          {error && <div className="font-mono text-[11px] text-red-400 bg-red-900/20 border border-red-500/30 px-3 py-2 rounded-sm">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Title *</label>
                <input className={inputClass} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. James & Sons Collection 2025" />
              </div>
              <div>
                <label className={labelClass}>Year *</label>
                <input type="number" className={inputClass} value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} min={2000} max={2099} />
              </div>
            </div>
            <div>
              <label className={labelClass}>PDF File URL * <span className="normal-case text-muted/70">(Cloudinary, Google Drive, or any hosted URL)</span></label>
              <input className={inputClass} value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://res.cloudinary.com/.../catalogue.pdf" />
            </div>
            <div>
              <label className={labelClass}>Cover Image URL <span className="normal-case text-muted/70">(optional)</span></label>
              <input className={inputClass} value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} placeholder="https://res.cloudinary.com/.../cover.jpg" />
            </div>
            <div>
              <label className={labelClass}>Description <span className="normal-case text-muted/70">(optional)</span></label>
              <textarea className={inputClass} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of catalogue contents..." />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={form.isPublished}
                onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                className="cursor-pointer"
              />
              <label htmlFor="isPublished" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted cursor-pointer">Publish immediately (visible on storefront)</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="font-mono text-[10px] uppercase tracking-[0.14em] bg-accent text-background px-5 py-2.5 rounded-sm hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer">
                {saving ? 'Saving…' : '💾 Save Catalogue'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="font-mono text-[10px] uppercase tracking-[0.14em] border border-border text-muted px-5 py-2.5 rounded-sm hover:text-primary transition-colors cursor-pointer bg-transparent">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Catalogues Table */}
      {loading ? (
        <div className="font-mono text-[11px] text-muted text-center py-16">Loading catalogues…</div>
      ) : catalogues.length === 0 ? (
        <div className="text-center py-20 border border-border rounded-md bg-surface">
          <div className="font-serif text-[20px] text-muted mb-3">No Catalogues Yet</div>
          <p className="font-mono text-[10px] text-muted uppercase tracking-widest">Click "Upload New Catalogue" to add your first PDF.</p>
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted px-4 py-3">Cover</th>
                <th className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted px-4 py-3">Title</th>
                <th className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted px-4 py-3">Year</th>
                <th className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted px-4 py-3">Downloads</th>
                <th className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted px-4 py-3">Status</th>
                <th className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {catalogues.map(cat => (
                <tr key={cat.id} className="border-b border-border hover:bg-surface/60 transition-colors">
                  <td className="px-4 py-3">
                    {cat.coverImage ? (
                      <img src={cat.coverImage} alt={cat.title} className="w-12 h-16 object-cover rounded-sm border border-border" />
                    ) : (
                      <div className="w-12 h-16 bg-surface-muted rounded-sm border border-border flex items-center justify-center text-accent text-xs">📄</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-serif text-[14px] text-primary">{cat.title}</div>
                    {cat.description && <div className="font-mono text-[10px] text-muted mt-1 line-clamp-1">{cat.description}</div>}
                    <a href={cat.fileUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[9px] text-accent hover:underline mt-0.5 inline-block">View PDF ↗</a>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted">{cat.year}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted tabular-nums">{cat.downloads.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(cat)}
                      className={`font-mono text-[9px] uppercase tracking-[0.1em] px-3 py-1.5 rounded-sm border cursor-pointer transition-colors ${
                        cat.isPublished
                          ? 'bg-green-900/20 border-green-500/40 text-green-400 hover:bg-red-900/20 hover:border-red-500/40 hover:text-red-400'
                          : 'bg-surface border-border text-muted hover:border-accent hover:text-accent'
                      }`}
                    >
                      {cat.isPublished ? '● Published' : '○ Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="font-mono text-[9px] uppercase tracking-[0.1em] text-red-400 border border-red-500/30 px-2.5 py-1.5 rounded-sm hover:bg-red-900/20 transition-colors cursor-pointer"
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
