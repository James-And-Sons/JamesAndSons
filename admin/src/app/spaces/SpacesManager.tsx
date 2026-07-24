'use client';
import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addProductToSpace, removeProductFromSpace } from './actions';
import CloudinaryUpload from '@/components/CloudinaryUpload';
import { useSidebar } from '@/lib/context/SidebarContext';

type Space = { 
  id: string; 
  name: string; 
  slug: string; 
  description: string | null; 
  image: string | null;
  images: string[];
  _count: { products: number };
  products: { id: string; name: string; images: string[] }[];
};

export default function SpaceManager({ spaces, allProducts }: { spaces: Space[], allProducts: { id: string, name: string, sku: string, images: string[] }[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Space | null>(null);
  const [managingProducts, setManagingProducts] = useState<Space | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { setIsPageDirty } = useSidebar();

  const isDirty = !!(
    (showForm && !editing && (name !== '' || description !== '' || images.length > 0)) ||
    (editing !== null && (name !== editing.name || description !== (editing.description || '') || JSON.stringify(images) !== JSON.stringify(editing.images || [])))
  );

  useEffect(() => {
    setIsPageDirty(isDirty);
    return () => setIsPageDirty(false);
  }, [isDirty, setIsPageDirty]);

  const handleDiscardCreate = () => {
    if (showForm && !editing && isDirty) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    setShowForm(false);
    setError('');
  };

  const handleCancelEdit = () => {
    if (editing !== null && isDirty) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    setEditing(null);
    setError('');
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const manageId = params.get('manage');
      const editId = params.get('edit');
      
      if (manageId) {
        const sp = spaces.find(s => s.id === manageId);
        if (sp) {
          setManagingProducts(sp);
          setShowForm(false);
          setEditing(null);
        }
      } else if (editId) {
        const sp = spaces.find(s => s.id === editId);
        if (sp) {
          setEditing(sp);
          setName(sp.name);
          setDescription(sp.description || '');
          setImages(sp.images || []);
          setShowForm(true);
          setManagingProducts(null);
        }
      }
    }
  }, [spaces]);

  const openAdd = () => { setEditing(null); setName(''); setDescription(''); setImages([]); setShowForm(true); setManagingProducts(null); };
  const openEdit = (s: Space) => { setEditing(s); setName(s.name); setDescription(s.description || ''); setImages(s.images || []); setShowForm(true); setManagingProducts(null); };
  const openManage = (s: Space) => { setManagingProducts(s); setShowForm(false); setEditing(null); };

  const handleSave = () => {
    if (!name.trim()) { setError('Name is required'); return; }
    startTransition(async () => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/spaces/${editing.id}` : '/api/spaces';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          slug, 
          description, 
          image: images[0] || null,
          images
        }),
      });
      if (!res.ok) { setError(await res.text()); return; }
      setShowForm(false);
      setEditing(null);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/spaces/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete space');
        setDeletingId(null);
        return;
      }
      setDeletingId(null);
      router.refresh();
    });
  };

  const handleAddProduct = async () => {
    if (!managingProducts || !selectedProductId) return;
    const res = await addProductToSpace(managingProducts.id, selectedProductId);
    if (res.success) {
      setSelectedProductId('');
      router.refresh();
      const updated = spaces.find(s => s.id === managingProducts.id);
      if (updated) setManagingProducts(updated);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!managingProducts) return;
    const res = await removeProductFromSpace(managingProducts.id, productId);
    if (res.success) {
      router.refresh();
      const updated = spaces.find(s => s.id === managingProducts.id);
      if (updated) setManagingProducts(updated);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <button onClick={openAdd} className="btn-primary font-mono text-[10px] uppercase tracking-[0.12em] px-8 py-3 shadow-lg shadow-accent/20">
          + Create New Space
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-surface border border-accent/30 rounded-lg w-full max-w-[640px] flex flex-col overflow-hidden max-h-[90vh] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                  {editing ? 'Edit Details' : 'Create New'}
                </div>
                <h2 className="font-serif text-[20px] text-primary font-normal m-0">
                  {editing ? 'Edit Space' : 'Create New Space'}
                </h2>
              </div>
              <button 
                onClick={handleDiscardCreate}
                className="text-muted hover:text-primary font-mono text-[16px] cursor-pointer bg-transparent border-none focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {error && <p className="text-red-400 font-mono text-[11px] m-0">⚠️ {error}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Space Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors" placeholder="e.g. Master Bedroom" />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Description</label>
                  <input value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors" placeholder="e.g. Elegant light fixtures suited for bedrooms" />
                </div>
                <div className="md:col-span-2 space-y-1 border-t border-border/40 pt-4">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-2">Space Cover Photos (Multiple)</label>
                  <CloudinaryUpload 
                    onUpload={(urls) => setImages(urls)}
                    defaultImages={images}
                    multiple={true}
                    label="Add Space Cover Photo"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-surface-muted/40 flex justify-end gap-3">
              <button
                onClick={handleDiscardCreate}
                className="font-mono text-[9px] uppercase tracking-widest text-muted border border-border px-6 py-2.5 hover:text-primary transition-colors bg-background rounded-sm"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest bg-accent text-black hover:bg-accent-hover transition-colors font-bold disabled:opacity-50 rounded-sm"
              >
                {isPending ? 'Processing...' : 'Save Space'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="premium-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-surface-muted/30">
            <tr>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Space Name</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Thumbnail</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Products</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {spaces.map(s => (
              <React.Fragment key={s.id}>
                <tr className={`transition-colors ${editing?.id === s.id || managingProducts?.id === s.id ? 'bg-surface-muted border-accent/20' : 'hover:bg-surface-muted/50'}`}>
                  <td className="px-6 py-4">
                    <span className="font-serif text-[17px] text-primary">{s.name}</span>
                    <p className="font-mono text-[10px] text-muted mt-1 lowercase tracking-wider">{s.slug}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 bg-surface-muted border border-border flex items-center justify-center overflow-hidden">
                      {s.image ? <img src={s.image} alt={s.name} className="w-full h-full object-cover" /> : <span className="font-mono text-[8px] text-muted">No Img</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-[13px] text-right text-secondary tabular-nums">{s._count.products}</td>
                  <td className="px-6 py-4 text-right flex gap-4 justify-end items-center">
                    {deletingId === s.id ? (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                        <span className="font-mono text-[9px] uppercase text-rose-400 mr-2">Confirm Delete?</span>
                        <button 
                          onClick={() => handleDelete(s.id)} 
                          disabled={isPending}
                          className="font-mono text-[9px] uppercase tracking-widest bg-rose-500 text-white px-4 py-2 hover:bg-rose-600 transition-colors shadow-sm"
                        >
                          Yes
                        </button>
                        <button 
                          onClick={() => setDeletingId(null)}
                          className="font-mono text-[9px] uppercase border border-border px-4 py-2 hover:bg-surface-muted transition-colors bg-background"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <Link 
                          href={`/spaces/${s.id}/edit`} 
                          className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent hover:text-accent-hover transition-colors"
                        >
                          Edit &amp; Manage
                        </Link>
                        <button 
                          onClick={() => setDeletingId(s.id)} 
                          className="font-mono text-[9px] uppercase tracking-[0.1em] text-rose-400/80 hover:text-rose-500 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
                

                {(managingProducts?.id === s.id) && (
                  <tr>
                    <td colSpan={4} className="p-0">
                      <div className="bg-surface/90 backdrop-blur border-b border-border/60 p-8 space-y-6 shadow-inner animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center border-b border-border/40 pb-4">
                          <h3 className="font-serif text-[20px] text-primary font-light">Products in <span className="text-accent underline underline-offset-8">{s.name}</span></h3>
                          <button onClick={() => setManagingProducts(null)} className="font-mono text-[9px] uppercase text-muted hover:text-primary border border-border px-4 py-2 hover:bg-surface-muted">Close Manager</button>
                        </div>

                        <div className="space-y-4">
                          <div className="flex gap-3 items-end bg-background/50 p-4 border border-border">
                            <div className="flex-1">
                              <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-1">Add Product to Space</label>
                              <select 
                                value={selectedProductId} 
                                onChange={e => setSelectedProductId(e.target.value)}
                                className="w-full bg-background border border-border px-4 py-3 text-[14px] font-body text-primary focus:outline-none focus:border-accent cursor-pointer"
                              >
                                <option value="">Select a product...</option>
                                {allProducts
                                  .filter(p => !s.products.some(sp => sp.id === p.id))
                                  .map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                  ))
                                }
                              </select>
                            </div>
                            <button onClick={handleAddProduct} disabled={!selectedProductId} className="px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest bg-accent text-black hover:bg-accent-hover transition-colors font-bold disabled:opacity-50">Add</button>
                          </div>

                          <div className="premium-card overflow-hidden">
                            <table className="w-full text-left">
                              <thead className="bg-[#16161a] border-b border-border">
                                <tr>
                                  <th className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-widest text-muted">Product Name</th>
                                  <th className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-widest text-muted text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                {s.products.map(p => (
                                  <tr key={p.id} className="hover:bg-background/30 transition-colors">
                                    <td className="px-6 py-4 font-body text-[13px] text-primary">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-background border border-border flex items-center justify-center font-mono text-[7px] text-muted overflow-hidden">
                                          {p.images && p.images.length > 0 ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : 'IMG'}
                                        </div>
                                        {p.name}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <button onClick={() => handleRemoveProduct(p.id)} className="font-mono text-[9px] uppercase text-rose-400 hover:text-rose-500 transition-colors">Remove</button>
                                    </td>
                                  </tr>
                                ))}
                                {s.products.length === 0 && (
                                  <tr><td colSpan={2} className="px-6 py-8 text-center font-mono text-[10px] text-muted uppercase tracking-widest">No products in this space</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {spaces.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center font-mono text-[11px] text-muted uppercase tracking-widest">No spaces discovered yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
