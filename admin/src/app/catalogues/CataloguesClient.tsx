'use client';
import React, { useState, useEffect, useRef } from 'react';

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

const emptyForm = {
  title: '',
  description: '',
  year: new Date().getFullYear(),
  coverImage: '',
  fileUrl: '',
  isPublished: false,
};

export default function CataloguesClient() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Upload States
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfFileSize, setPdfFileSize] = useState('');

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/catalogues');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCatalogues(data);
      } else {
        setCatalogues([]);
        if (data?.error) setError(data.error);
      }
    } catch (err) {
      console.error('Failed to load catalogues:', err);
      setCatalogues([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadFile(file: File, type: 'pdf' | 'cover') {
    const isPdf = type === 'pdf';
    if (isPdf) {
      setUploadingPdf(true);
      setPdfFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setPdfFileSize(`${sizeMb} MB`);
    } else {
      setUploadingCover(true);
    }
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/catalogues/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        if (isPdf) {
          setForm(f => ({
            ...f,
            fileUrl: data.url,
            // Auto fill title if empty
            title: f.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          }));
        } else {
          setForm(f => ({ ...f, coverImage: data.url }));
        }
      } else {
        setError(data?.error || `Failed to upload ${type.toUpperCase()} file to Cloudinary.`);
      }
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      setError(`Failed to upload ${type.toUpperCase()} file to server.`);
    } finally {
      if (isPdf) setUploadingPdf(false);
      else setUploadingCover(false);
    }
  }

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, 'pdf');
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, 'cover');
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.fileUrl) {
      setError('Title and PDF File URL are required.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/catalogues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm(emptyForm);
        setPdfFileName('');
        setPdfFileSize('');
        setShowForm(false);
        load();
      } else {
        const data = await res.json();
        setError(data?.error || 'Failed to create catalogue.');
      }
    } catch {
      setError('Failed to create catalogue.');
    } finally {
      setSaving(false);
    }
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

  const inputClass =
    'w-full px-3.5 py-2.5 bg-surface border border-border text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm transition-colors';
  const labelClass =
    'font-mono text-[10px] uppercase tracking-[0.14em] text-muted block mb-1.5 font-semibold';

  const safeCatalogues = Array.isArray(catalogues) ? catalogues : [];

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-[28px] text-primary">Product Catalogues</h1>
          <p className="font-mono text-[10px] text-muted uppercase tracking-[0.14em] mt-1">
            Cloudinary-powered PDF Catalogue Storage &amp; Storefront Downloads
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setError('');
          }}
          className="font-mono text-[10px] uppercase tracking-[0.14em] bg-accent text-background font-bold px-5 py-3 rounded-sm hover:bg-accent-hover transition-colors cursor-pointer shadow-md"
        >
          + Upload New Catalogue PDF
        </button>
      </div>

      {/* Upload Form Modal / Drawer */}
      {showForm && (
        <div className="border border-accent/40 bg-surface rounded-md p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent font-bold">
              Upload PDF Catalogue to Cloudinary
            </span>
            <button
              onClick={() => {
                setShowForm(false);
                setError('');
              }}
              className="font-mono text-[11px] text-muted hover:text-primary cursor-pointer border-none bg-transparent"
            >
              ✕ Cancel
            </button>
          </div>

          {error && (
            <div className="font-mono text-[11px] text-red-400 bg-red-950/40 border border-red-500/40 px-4 py-2.5 rounded-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-5">
            {/* 1. PDF File Upload Box */}
            <div>
              <label className={labelClass}>1. PDF Catalogue Document *</label>
              <input
                type="file"
                ref={pdfInputRef}
                accept="application/pdf,.pdf"
                onChange={handlePdfSelect}
                className="hidden"
              />

              <div
                onClick={() => pdfInputRef.current?.click()}
                className={`border-2 border-dashed rounded-md p-5 text-center cursor-pointer transition-all ${
                  form.fileUrl
                    ? 'border-green-500/50 bg-green-950/10'
                    : 'border-border hover:border-accent bg-surface/50'
                }`}
              >
                {uploadingPdf ? (
                  <div className="space-y-2 py-2">
                    <div className="font-mono text-[12px] text-accent font-bold animate-pulse">
                      ⏳ Uploading PDF to Cloudinary CDN...
                    </div>
                    <div className="font-mono text-[10px] text-muted">{pdfFileName} ({pdfFileSize})</div>
                  </div>
                ) : form.fileUrl ? (
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded bg-accent/20 border border-accent flex items-center justify-center text-accent text-lg">
                        📄
                      </div>
                      <div>
                        <div className="font-mono text-[12px] text-primary font-semibold">
                          {pdfFileName || 'Catalogue PDF Uploaded'}
                        </div>
                        <div className="font-mono text-[9px] text-green-400 truncate max-w-[400px]">
                          ✓ {form.fileUrl}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        pdfInputRef.current?.click();
                      }}
                      className="font-mono text-[9px] uppercase tracking-wider bg-surface-muted text-muted hover:text-primary px-3 py-1.5 rounded border border-border"
                    >
                      Change PDF ↺
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 py-3">
                    <div className="text-3xl">📥</div>
                    <div className="font-mono text-[12px] text-primary font-semibold">
                      Click to choose PDF file from your device
                    </div>
                    <p className="font-mono text-[10px] text-muted">
                      Supports full PDF brochures &amp; catalogues (Auto-hosted on Cloudinary CDN)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Title & Year */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Catalogue Title *</label>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. James & Sons Heritage Collection 2025"
                />
              </div>
              <div>
                <label className={labelClass}>Release Year *</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                  min={2000}
                  max={2099}
                />
              </div>
            </div>

            {/* 2. Cover Image Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>2. Cover Image (Optional)</label>
                <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  {form.coverImage ? (
                    <img
                      src={form.coverImage}
                      alt="Cover Preview"
                      className="w-14 h-18 object-cover rounded border border-border"
                    />
                  ) : (
                    <div className="w-14 h-18 bg-surface-muted border border-border rounded flex items-center justify-center text-muted text-xs">
                      🖼️ Cover
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      disabled={uploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                      className="font-mono text-[10px] uppercase tracking-wider bg-surface border border-border text-primary px-3 py-2 rounded hover:border-accent transition-colors w-full text-left"
                    >
                      {uploadingCover ? 'Uploading Cover…' : form.coverImage ? 'Change Cover Image 🖼️' : 'Upload Cover Image 📷'}
                    </button>
                    <input
                      className={inputClass}
                      value={form.coverImage}
                      onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
                      placeholder="or paste image URL..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Description / Highlights (Optional)</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief summary of collection items, specs, and featured luxury lighting..."
                />
              </div>
            </div>

            {/* Publish Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPublished"
                checked={form.isPublished}
                onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                className="w-4 h-4 cursor-pointer accent-accent"
              />
              <label htmlFor="isPublished" className="font-mono text-[11px] uppercase tracking-[0.12em] text-primary font-semibold cursor-pointer">
                Publish immediately on Storefront Download Catalogues Page
              </label>
            </div>

            {/* Submit Actions */}
            <div className="flex gap-3 pt-3 border-t border-border">
              <button
                type="submit"
                disabled={saving || uploadingPdf}
                className="font-mono text-[10px] uppercase tracking-[0.14em] bg-accent text-background font-bold px-6 py-3 rounded-sm hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer shadow-md"
              >
                {saving ? 'Saving Catalogue…' : '💾 Save & Publish Catalogue'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError('');
                }}
                className="font-mono text-[10px] uppercase tracking-[0.14em] border border-border text-muted px-5 py-3 rounded-sm hover:text-primary transition-colors cursor-pointer bg-transparent"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Catalogues Table */}
      {loading ? (
        <div className="font-mono text-[11px] text-muted text-center py-16">Loading catalogues…</div>
      ) : safeCatalogues.length === 0 ? (
        <div className="text-center py-20 border border-border rounded-md bg-surface space-y-3">
          <div className="text-4xl">📄</div>
          <div className="font-serif text-[20px] text-muted">No Catalogues Uploaded Yet</div>
          <p className="font-mono text-[10px] text-muted uppercase tracking-widest">
            Click "+ Upload New Catalogue PDF" above to upload your first PDF catalogue.
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted px-4 py-3.5">Cover</th>
                <th className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted px-4 py-3.5">Title &amp; Cloudinary Link</th>
                <th className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted px-4 py-3.5">Year</th>
                <th className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted px-4 py-3.5">Downloads</th>
                <th className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted px-4 py-3.5">Status</th>
                <th className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeCatalogues.map(cat => (
                <tr key={cat.id} className="border-b border-border hover:bg-surface/60 transition-colors">
                  <td className="px-4 py-3.5">
                    {cat.coverImage ? (
                      <img src={cat.coverImage} alt={cat.title} className="w-12 h-16 object-cover rounded-sm border border-border" />
                    ) : (
                      <div className="w-12 h-16 bg-surface-muted rounded-sm border border-border flex items-center justify-center text-accent text-lg">
                        📄
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-serif text-[15px] text-primary font-semibold">{cat.title}</div>
                    {cat.description && (
                      <div className="font-mono text-[10px] text-muted mt-1 line-clamp-1">{cat.description}</div>
                    )}
                    <a
                      href={cat.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[9px] text-accent hover:underline mt-1 inline-flex items-center gap-1 font-semibold"
                    >
                      <span>Download / View PDF ↗</span>
                    </a>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[12px] text-muted">{cat.year}</td>
                  <td className="px-4 py-3.5 font-mono text-[12px] text-muted tabular-nums font-semibold">
                    {(cat.downloads || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5">
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
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="font-mono text-[9px] uppercase tracking-[0.1em] text-red-400 border border-red-500/30 px-3 py-1.5 rounded-sm hover:bg-red-900/20 transition-colors cursor-pointer"
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
