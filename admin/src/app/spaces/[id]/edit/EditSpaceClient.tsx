'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CloudinaryUpload from '@/components/CloudinaryUpload';
import { addProductToSpace, removeProductFromSpace } from '../../actions';

type Space = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  images: string[];
  products: { id: string; name: string; sku: string; images: string[] }[];
};

type ProductShort = {
  id: string;
  name: string;
  sku: string;
  images: string[];
};

export default function EditSpaceClient({ 
  space: initialSpace, 
  allProducts 
}: { 
  space: Space; 
  allProducts: ProductShort[]; 
}) {
  const router = useRouter();
  const [space, setSpace] = useState<Space>(initialSpace);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description || '');
  const [images, setImages] = useState<string[]>(space.images || []);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  const isDirty = (
    name !== space.name ||
    description !== (space.description || '') ||
    JSON.stringify(images) !== JSON.stringify(space.images || [])
  );

  const handleSave = () => {
    if (!name.trim()) {
      setError('Space Name is required');
      return;
    }
    setError('');
    setSuccessMsg('');

    startTransition(async () => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const res = await fetch(`/api/spaces/${space.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          slug, 
          description, 
          image: images[0] || null,
          images
        }),
      });

      if (!res.ok) {
        setError(await res.text());
        return;
      }

      const updated = await res.json();
      setSpace(prev => ({
        ...prev,
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        image: updated.image,
        images: updated.images
      }));
      setSuccessMsg('Space details updated successfully!');
      router.refresh();
    });
  };

  const handleAddProduct = async () => {
    if (!selectedProductId) return;
    setError('');
    setSuccessMsg('');
    const res = await addProductToSpace(space.id, selectedProductId);
    if (res.success) {
      setSelectedProductId('');
      // Find the product in allProducts to add it locally without full page reload
      const productToAdd = allProducts.find(p => p.id === selectedProductId);
      if (productToAdd) {
        setSpace(prev => ({
          ...prev,
          products: [...prev.products, productToAdd]
        }));
      }
      setSuccessMsg('Product added to space successfully!');
      router.refresh();
    } else {
      setError(res.error || 'Failed to add product');
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    setError('');
    setSuccessMsg('');
    const res = await removeProductFromSpace(space.id, productId);
    if (res.success) {
      setSpace(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== productId)
      }));
      setSuccessMsg('Product removed from space successfully!');
      router.refresh();
    } else {
      setError(res.error || 'Failed to remove product');
    }
  };

  // Filter products that are not already in this space
  const availableProducts = allProducts.filter(
    ap => !space.products.some(sp => sp.id === ap.id)
  );

  return (
    <div className="space-y-6">
      {/* Header / Back navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-muted">
            <Link href="/spaces" className="hover:text-primary transition-colors">Spaces</Link>
            <span>/</span>
            <span className="text-accent">Edit Space</span>
          </div>
          <h1 className="font-serif text-[28px] text-primary font-light mt-1">
            Edit Space: <span className="italic">{space.name}</span>
          </h1>
          <p className="font-mono text-[9px] uppercase text-muted tracking-wider mt-1">
            Slug: {space.slug}
          </p>
        </div>
        <Link 
          href="/spaces" 
          className="font-mono text-[9px] uppercase tracking-widest text-muted border border-border px-5 py-2.5 hover:text-primary hover:bg-surface-muted/30 transition-colors bg-background rounded-sm"
        >
          ← Back to Spaces
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Space details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-6 space-y-6">
            <h3 className="font-serif text-[18px] text-primary border-b border-border/40 pb-3 font-normal">
              Space Configurations
            </h3>

            {error && (
              <div className="font-mono text-[11px] text-red-400 bg-red-950/40 border border-red-500/40 px-4 py-2.5 rounded-sm">
                ⚠️ {error}
              </div>
            )}
            {successMsg && (
              <div className="font-mono text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-4 py-2.5 rounded-sm">
                ✓ {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Space Name *</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors" 
                  placeholder="e.g. Living Room" 
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Description</label>
                <input 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors" 
                  placeholder="e.g. Elegant light fixtures suited for bedrooms" 
                />
              </div>

              <div className="md:col-span-2 space-y-1 border-t border-border/40 pt-4">
                <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-2">Space Cover Photos (Multiple)</label>
                <CloudinaryUpload 
                  onUpload={(urls) => setImages(urls)}
                  defaultImages={images}
                  multiple={true}
                  label="Update Space Cover Photo"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border/40">
              <div className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider ${isDirty ? 'text-amber-500 animate-pulse' : 'text-muted'}`}>
                <span className={`w-2 h-2 rounded-full ${isDirty ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                {isDirty ? 'Unsaved Changes' : 'All Changes Saved'}
              </div>
              <button 
                onClick={handleSave} 
                disabled={isPending || !isDirty} 
                className="px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest bg-accent text-black hover:bg-accent-hover transition-colors font-bold disabled:opacity-40 rounded-sm shadow-md"
              >
                {isPending ? 'Saving...' : 'Update Details'}
              </button>
            </div>
          </div>
        </div>

        {/* Right column - Product assignment */}
        <div className="space-y-6">
          <div className="premium-card p-6 space-y-6">
            <h3 className="font-serif text-[18px] text-primary border-b border-border/40 pb-3 font-normal">
              Manage Products
            </h3>

            {/* Add product action */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block">
                Assign Product to Space
              </label>
              <div className="flex gap-2">
                <select 
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="flex-1 bg-background border border-border px-3 py-2 text-[12px] font-body text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer rounded-sm"
                >
                  <option value="">Select a product...</option>
                  {availableProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
                <button
                  onClick={handleAddProduct}
                  disabled={!selectedProductId}
                  className="px-4 py-2 font-mono text-[9px] uppercase tracking-wider bg-accent text-black hover:bg-accent-hover transition-colors font-bold disabled:opacity-40 rounded-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {/* List products in space */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block">
                  Assigned Products
                </label>
                <span className="font-mono text-[10px] text-accent tabular-nums bg-accent/15 px-2 py-0.5 rounded-sm">
                  {space.products.length} Designs
                </span>
              </div>

              {space.products.length === 0 ? (
                <div className="border border-border/50 rounded p-6 text-center bg-surface-muted/20">
                  <span className="font-mono text-[10px] text-muted uppercase tracking-wider block">
                    No products assigned
                  </span>
                  <p className="font-body text-[12px] text-muted mt-2">
                    Use the selector above to add products to this space.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40 max-h-[420px] overflow-y-auto pr-1">
                  {space.products.map(p => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-surface-muted border border-border/60 flex items-center justify-center overflow-hidden rounded-sm flex-shrink-0">
                          {p.images && p.images[0] ? (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-mono text-[7px] text-muted">No Img</span>
                          )}
                        </div>
                        <div>
                          <span className="font-serif text-[14px] text-primary block leading-tight">{p.name}</span>
                          <span className="font-mono text-[9px] text-muted uppercase mt-0.5 block">{p.sku}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveProduct(p.id)}
                        className="font-mono text-[8px] uppercase tracking-wider text-rose-400 hover:text-rose-500 transition-colors p-2"
                        title="Remove from space"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
