'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CloudinaryUpload from '@/components/CloudinaryUpload';

type Category = { id: string; name: string };

type Variant = { 
  name: string; 
  sku: string; 
  d2cPrice: string; 
  mrp: string; 
  stockQuantity: string; 
  images: string;
  weight: string;
  length: string;
  breadth: string;
  height: string;
  actualHeight: string;
  actualWidth: string;
  actualDepth: string;
};
type Spec = { key: string; value: string };

export default function ProductFormClient({ categories, spaces, defaultValues, mode }: {
  categories: Category[];
  spaces: { id: string; name: string }[];
  defaultValues?: any;
  mode: 'add' | 'edit';
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Dimension Unit ('INCH' or 'CM')
  const [dimensionUnit, setDimensionUnit] = useState<'INCH' | 'CM'>(
    defaultValues?.dimensionUnit || 'INCH'
  );

  // Images
  const [images, setImages] = useState<string[]>(defaultValues?.images || []);

  // Spaces
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>(
    defaultValues?.spaces?.map((s: any) => s.id) || []
  );

  // Variants
  const [variants, setVariants] = useState<Variant[]>(
    defaultValues?.variants?.map((v: any) => ({
      name: v.name || '',
      sku: v.sku || '',
      d2cPrice: String(v.d2cPrice || ''),
      mrp: String(v.mrp || ''),
      stockQuantity: String(v.stockQuantity || '0'),
      images: (v.images || []).join(', '),
      weight: String(v.weight || ''),
      length: String(v.length || ''),
      breadth: String(v.breadth || ''),
      height: String(v.height || ''),
      actualHeight: String(v.actualHeight || ''),
      actualWidth: String(v.actualWidth || ''),
      actualDepth: String(v.actualDepth || ''),
    })) || []
  );
  const addVariant = () => setVariants(prev => [...prev, { 
    name: '', 
    sku: '', 
    d2cPrice: '', 
    mrp: '', 
    stockQuantity: '0', 
    images: '',
    weight: '',
    length: '',
    breadth: '',
    height: '',
    actualHeight: '',
    actualWidth: '',
    actualDepth: ''
  }]);
  const updateVariant = (i: number, field: keyof Variant, val: string) => setVariants(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: val } : v));
  const removeVariant = (i: number) => setVariants(prev => prev.filter((_, idx) => idx !== i));

  // Specs
  const [specs, setSpecs] = useState<Spec[]>(
    defaultValues?.specs ? Object.entries(defaultValues.specs).map(([key, value]) => ({ key, value: String(value) })) : []
  );
  const addSpec = () => setSpecs(prev => [...prev, { key: '', value: '' }]);
  const updateSpec = (i: number, field: 'key' | 'value', val: string) => setSpecs(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  const removeSpec = (i: number) => setSpecs(prev => prev.filter((_, idx) => idx !== i));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const fd = new FormData(e.currentTarget);

    const body = {
      id: defaultValues?.id,
      name: fd.get('name'),
      sku: fd.get('sku'),
      description: fd.get('description'),
      mrp: parseFloat(fd.get('mrp') as string),
      d2cPrice: parseFloat(fd.get('d2cPrice') as string),
      b2bPrice: parseFloat(fd.get('b2bPrice') as string),
      stockQuantity: parseInt(fd.get('stockQuantity') as string, 10) || 0,
      weight: parseFloat(fd.get('weight') as string) || 0.5,
      length: parseFloat(fd.get('length') as string) || 10,
      breadth: parseFloat(fd.get('breadth') as string) || 10,
      height: parseFloat(fd.get('height') as string) || 10,
      categoryId: fd.get('categoryId'),
      spaceIds: selectedSpaces,
      isLed: fd.get('isLed') === 'on',
      gstRate: parseFloat(fd.get('gstRate') as string) || 18,
      hsnCode: fd.get('hsnCode'),
      bisCertification: fd.get('bisCertification'),
      actualHeight: fd.get('actualHeight') ? parseFloat(fd.get('actualHeight') as string) : null,
      actualWidth: fd.get('actualWidth') ? parseFloat(fd.get('actualWidth') as string) : null,
      actualDepth: fd.get('actualDepth') ? parseFloat(fd.get('actualDepth') as string) : null,
      materialAndFinish: fd.get('materialAndFinish') ? (fd.get('materialAndFinish') as string).split(',').map(s => s.trim()).filter(Boolean) : [],
      bulbType: fd.get('bulbType') ? (fd.get('bulbType') as string).split(',').map(s => s.trim()).filter(Boolean) : [],
      style: fd.get('style') ? (fd.get('style') as string).split(',').map(s => s.trim()).filter(Boolean) : [],
      images: images.filter(img => img.trim()),
      variants: variants.map(v => ({
        name: v.name,
        sku: v.sku,
        d2cPrice: v.d2cPrice ? parseFloat(v.d2cPrice) : null,
        mrp: v.mrp ? parseFloat(v.mrp) : null,
        stockQuantity: parseInt(v.stockQuantity, 10) || 0,
        images: v.images ? v.images.split(',').map(s => s.trim()).filter(Boolean) : [],
        weight: v.weight ? parseFloat(v.weight) : null,
        length: v.length ? parseFloat(v.length) : null,
        breadth: v.breadth ? parseFloat(v.breadth) : null,
        height: v.height ? parseFloat(v.height) : null,
        actualHeight: (v.actualHeight && v.actualHeight.trim()) ? parseFloat(v.actualHeight) : null,
        actualWidth: (v.actualWidth && v.actualWidth.trim()) ? parseFloat(v.actualWidth) : null,
        actualDepth: (v.actualDepth && v.actualDepth.trim()) ? parseFloat(v.actualDepth) : null,
      })),
      specs: specs.reduce((acc: any, s) => { if (s.key) acc[s.key] = s.value; return acc; }, {}),
      dimensionUnit,
    };

    try {
      const url = mode === 'add' ? '/api/products' : `/api/products/${defaultValues.id}`;
      const method = mode === 'add' ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const text = await res.text();
        try {
          const parsed = JSON.parse(text);
          throw new Error(parsed.error || text);
        } catch {
          throw new Error(text);
        }
      }
      router.push('/products');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Failed to save product');
      setSaving(false);
    }
  }

  const inputCls = "w-full bg-background border border-border px-4 py-3 text-[14px] font-body text-primary focus:outline-none focus:border-accent transition-colors";
  const labelCls = "font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1";
  const sectionTitle = "font-serif text-[20px] text-primary mb-4";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {error && (
        <div className="p-4 border border-red-900 bg-red-900/10 text-red-400 font-mono text-[12px]">{error}</div>
      )}

      {/* === BASIC INFO === */}
      <div>
        <h3 className={sectionTitle}>Basic Information</h3>
        <div className="grid grid-cols-2 gap-6">
          <div><label className={labelCls}>Product Name *</label><input required name="name" defaultValue={defaultValues?.name} className={inputCls} /></div>
          <div><label className={labelCls}>SKU Code *</label><input required name="sku" defaultValue={defaultValues?.sku} className={`${inputCls} uppercase`} /></div>
          <div className="col-span-2"><label className={labelCls}>Description</label><textarea name="description" rows={4} defaultValue={defaultValues?.description} className={inputCls} /></div>
          <div>
            <label className={labelCls}>Category *</label>
            <select required name="categoryId" defaultValue={defaultValues?.categoryId || ''} className={inputCls}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Suited Spaces (Optional)</label>
            <div className="flex flex-wrap gap-2 p-2 border border-border bg-background min-h-[46px]">
              {spaces.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSpaces(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                  className={`px-3 py-1 font-mono text-[9px] uppercase tracking-widest border transition-all ${
                    selectedSpaces.includes(s.id) 
                      ? 'bg-accent border-accent text-black' 
                      : 'border-border text-muted hover:border-accent/50'
                  }`}
                >
                  {s.name}
                </button>
              ))}
              {spaces.length === 0 && <p className="text-[10px] text-muted italic p-1">No spaces created yet. Go to the "Spaces" tab to add them.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* === PRICING & INVENTORY === */}
      <div className="pt-6 border-t border-border">
        <h3 className={sectionTitle}>Pricing & Inventory</h3>
        <div className="grid grid-cols-4 gap-6">
          <div><label className={labelCls}>MRP (₹) *</label><input required type="number" step="0.01" name="mrp" defaultValue={defaultValues?.mrp} className={inputCls} /></div>
          <div><label className={labelCls}>D2C Price (₹) *</label><input required type="number" step="0.01" name="d2cPrice" defaultValue={defaultValues?.d2cPrice} className={inputCls} /></div>
          <div><label className={labelCls}>B2B Price (₹) *</label><input required type="number" step="0.01" name="b2bPrice" defaultValue={defaultValues?.b2bPrice} className={inputCls} /></div>
          <div><label className={labelCls}>Stock Qty</label><input type="number" name="stockQuantity" defaultValue={defaultValues?.stockQuantity || 0} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-4 gap-6 mt-6">
          <div><label className={labelCls}>Weight (kg)</label><input type="number" step="0.01" name="weight" defaultValue={defaultValues?.weight || 0.5} className={inputCls} /></div>
          <div><label className={labelCls}>Length (cm)</label><input type="number" step="0.1" name="length" defaultValue={defaultValues?.length || 10} className={inputCls} /></div>
          <div><label className={labelCls}>Breadth (cm)</label><input type="number" step="0.1" name="breadth" defaultValue={defaultValues?.breadth || 10} className={inputCls} /></div>
          <div><label className={labelCls}>Height (cm)</label><input type="number" step="0.1" name="height" defaultValue={defaultValues?.height || 10} className={inputCls} /></div>
        </div>
      </div>

      {/* === TECHNICAL SPECS === */}
      <div className="pt-6 border-t border-border">
        <h3 className={sectionTitle}>Technical Specifications</h3>
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div>
            <label className={labelCls}>GST Rate (%)</label>
            <select name="gstRate" defaultValue={defaultValues?.gstRate || 18} className={inputCls}>
              <option value={5}>5% (LED)</option>
              <option value={18}>18% (Traditional)</option>
            </select>
          </div>
          <div><label className={labelCls}>HSN Code</label><input name="hsnCode" defaultValue={defaultValues?.hsnCode} className={inputCls} placeholder="e.g. 94054090" /></div>
          <div><label className={labelCls}>BIS Certification</label><input name="bisCertification" defaultValue={defaultValues?.bisCertification} className={inputCls} placeholder="IS 10322" /></div>
          <div className="flex items-center gap-3 mt-6">
            <input type="checkbox" name="isLed" id="isLed" defaultChecked={defaultValues?.isLed} className="w-4 h-4 accent-[#c4a05a]" />
            <label htmlFor="isLed" className="font-mono text-[11px] uppercase tracking-widest text-muted cursor-pointer">LED Product</label>
          </div>
        </div>

        <div className="bg-surface-muted/20 p-6 border border-border space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-accent"></div>
                <h4 className="font-mono text-[10px] uppercase tracking-widest text-primary">Core Attributes</h4>
              </div>
              <div className="space-y-3">
                <div><label className={labelCls}>Material & Finish</label><input name="materialAndFinish" defaultValue={defaultValues?.materialAndFinish?.join(', ')} className={inputCls} placeholder="e.g. Brass, Matte Black" /></div>
                <div><label className={labelCls}>Bulb Type</label><input name="bulbType" defaultValue={defaultValues?.bulbType?.join(', ')} className={inputCls} placeholder="e.g. E14, Integrated LED" /></div>
                <div><label className={labelCls}>Design Style</label><input name="style" defaultValue={defaultValues?.style?.join(', ')} className={inputCls} placeholder="e.g. Contemporary, Art Deco" /></div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-accent"></div>
                  <h4 className="font-mono text-[10px] uppercase tracking-widest text-primary">Physical Dimensions (Display)</h4>
                </div>
                <div className="flex gap-1 bg-background p-1 border border-border">
                  <button
                    type="button"
                    onClick={() => setDimensionUnit('INCH')}
                    className={`px-3 py-1 font-mono text-[9px] uppercase tracking-widest border transition-all ${
                      dimensionUnit === 'INCH' 
                        ? 'bg-accent border-accent text-black font-semibold' 
                        : 'border-transparent text-muted hover:text-primary'
                    }`}
                  >
                    Inches (")
                  </button>
                  <button
                    type="button"
                    onClick={() => setDimensionUnit('CM')}
                    className={`px-3 py-1 font-mono text-[9px] uppercase tracking-widest border transition-all ${
                      dimensionUnit === 'CM' 
                        ? 'bg-accent border-accent text-black font-semibold' 
                        : 'border-transparent text-muted hover:text-primary'
                    }`}
                  >
                    CM (cm)
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 bg-background/50 p-4 border border-border">
                <div>
                  <label className={labelCls}>Height ({dimensionUnit === 'INCH' ? 'in' : 'cm'})</label>
                  <div className="relative">
                    <input type="number" step="0.1" name="actualHeight" defaultValue={defaultValues?.actualHeight} className={`${inputCls} !pr-8`} placeholder="0.0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted">
                      {dimensionUnit === 'INCH' ? '"' : 'cm'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Width ({dimensionUnit === 'INCH' ? 'in' : 'cm'})</label>
                  <div className="relative">
                    <input type="number" step="0.1" name="actualWidth" defaultValue={defaultValues?.actualWidth} className={`${inputCls} !pr-8`} placeholder="0.0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted">
                      {dimensionUnit === 'INCH' ? '"' : 'cm'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Depth ({dimensionUnit === 'INCH' ? 'in' : 'cm'})</label>
                  <div className="relative">
                    <input type="number" step="0.1" name="actualDepth" defaultValue={defaultValues?.actualDepth} className={`${inputCls} !pr-8`} placeholder="Optional" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted">
                      {dimensionUnit === 'INCH' ? '"' : 'cm'}
                    </span>
                  </div>
                </div>
                <p className="col-span-3 font-mono text-[8px] text-muted uppercase tracking-widest">Note: Depth is optional. If left blank, it will be hidden on the storefront.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className={labelCls}>Additional Specs (for filtering)</label>
            <button type="button" onClick={addSpec} className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent border border-accent/30 px-3 py-1 hover:border-accent transition-colors">
              + Add Spec
            </button>
          </div>
          {specs.map((spec, i) => (
            <div key={i} className="flex gap-3 items-center animate-in fade-in slide-in-from-left-2 duration-200">
              <input value={spec.key} onChange={e => updateSpec(i, 'key', e.target.value)} placeholder="Key (e.g. Finish)" className={`${inputCls.replace(/\bw-full\b/, '')} w-1/3 !py-2 !text-[12px]`} />
              <input value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)} placeholder="Value (e.g. Polished Brass)" className={`${inputCls.replace(/\bw-full\b/, '')} flex-1 !py-2 !text-[12px]`} />
              <button type="button" onClick={() => removeSpec(i)} className="btn-ghost !text-red-400 hover:!bg-red-400/10 !p-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          {specs.length === 0 && <p className="text-muted font-mono text-[11px]">No specs yet — click "Add Spec" to add filterable attributes like Material, Finish, Diameter, etc.</p>}
        </div>
      </div>

      {/* === IMAGES === */}
      <div className="pt-6 border-t border-border">
        <h3 className={sectionTitle}>Product Images</h3>
        <CloudinaryUpload 
          onUpload={(urls) => setImages(urls)}
          defaultImages={images}
          multiple={true}
          label="Add Product Image"
        />
      </div>

      {/* === VARIANTS === */}
      <div className="pt-6 border-t border-border">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={sectionTitle}>Product Variants</h3>
            <p className="font-body text-[13px] text-muted -mt-2">Define finish/size variations. Leave empty if no variants.</p>
          </div>
          <button type="button" onClick={addVariant} className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent border border-accent/30 px-4 py-2 hover:border-accent transition-colors">
            + Add Variant
          </button>
        </div>
        {variants.length === 0 ? (
          <div className="bg-background border border-dashed border-border p-6 text-center">
            <p className="font-mono text-[11px] text-muted uppercase tracking-widest">No variants — click "Add Variant" to create size or finish options</p>
          </div>
        ) : (
          <div className="space-y-4">
            {variants.map((v, i) => (
              <div key={i} className="bg-background border border-border p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent">Variant {i + 1}</span>
                  <button type="button" onClick={() => removeVariant(i)} className="text-red-400/60 hover:text-red-400 font-mono text-[12px]">Remove</button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className={labelCls}>Variant Name *</label><input required value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} placeholder='e.g. "Gold – 48 inch"' className={inputCls} /></div>
                  <div><label className={labelCls}>SKU *</label><input required value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Stock Qty</label><input type="number" value={v.stockQuantity} onChange={e => updateVariant(i, 'stockQuantity', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>D2C Price Override (₹)</label><input type="number" step="0.01" value={v.d2cPrice} onChange={e => updateVariant(i, 'd2cPrice', e.target.value)} placeholder="Leave blank to inherit" className={inputCls} /></div>
                  <div><label className={labelCls}>MRP Override (₹)</label><input type="number" step="0.01" value={v.mrp} onChange={e => updateVariant(i, 'mrp', e.target.value)} placeholder="Leave blank to inherit" className={inputCls} /></div>
                  <div className="grid grid-cols-4 gap-4 col-span-3 bg-surface-muted/30 p-3 border border-border">
                    <div className="col-span-4 font-mono text-[8px] uppercase tracking-widest text-muted mb-2">Shipping Dimensions (cm)</div>
                    <div><label className={labelCls}>Weight (kg)</label><input type="number" step="0.01" value={v.weight} onChange={e => updateVariant(i, 'weight', e.target.value)} className={inputCls} placeholder="Inherit" /></div>
                    <div><label className={labelCls}>Length (cm)</label><input type="number" step="0.1" value={v.length} onChange={e => updateVariant(i, 'length', e.target.value)} className={inputCls} placeholder="Inherit" /></div>
                    <div><label className={labelCls}>Breadth (cm)</label><input type="number" step="0.1" value={v.breadth} onChange={e => updateVariant(i, 'breadth', e.target.value)} className={inputCls} placeholder="Inherit" /></div>
                    <div><label className={labelCls}>Height (cm)</label><input type="number" step="0.1" value={v.height} onChange={e => updateVariant(i, 'height', e.target.value)} className={inputCls} placeholder="Inherit" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 col-span-3 bg-accent/5 p-3 border border-accent/10">
                    <div className="col-span-3 font-mono text-[8px] uppercase tracking-widest text-accent mb-2">
                      Actual Product Dimensions ({dimensionUnit === 'INCH' ? 'in' : 'cm'})
                    </div>
                    <div><label className={labelCls}>Height ({dimensionUnit === 'INCH' ? 'in' : 'cm'})</label><input type="number" step="0.1" value={v.actualHeight} onChange={e => updateVariant(i, 'actualHeight', e.target.value)} className={inputCls} placeholder="Inherit" /></div>
                    <div><label className={labelCls}>Width ({dimensionUnit === 'INCH' ? 'in' : 'cm'})</label><input type="number" step="0.1" value={v.actualWidth} onChange={e => updateVariant(i, 'actualWidth', e.target.value)} className={inputCls} placeholder="Inherit" /></div>
                    <div><label className={labelCls}>Depth ({dimensionUnit === 'INCH' ? 'in' : 'cm'})</label><input type="number" step="0.1" value={v.actualDepth} onChange={e => updateVariant(i, 'actualDepth', e.target.value)} className={inputCls} placeholder="Inherit" /></div>
                  </div>
                  <div className="col-span-3">
                    <label className={labelCls}>Variant Images</label>
                    <CloudinaryUpload 
                      onUpload={(urls) => updateVariant(i, 'images', urls.join(', '))}
                      defaultImages={v.images ? v.images.split(',').map(s => s.trim()).filter(Boolean) : []}
                      multiple={true}
                      label="Add Variant Image"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === SUBMIT === */}
      <div className="pt-6 border-t border-border flex flex-col items-end gap-4">
        <div className="flex gap-4">
          <button type="button" onClick={() => router.back()} className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-6 py-3 hover:text-primary transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : mode === 'add' ? 'Save Product' : 'Update Product'}
          </button>
        </div>
        <p className="font-mono text-[8px] uppercase tracking-widest text-accent/60">
          * Product catalogue and inventory will be automatically synced with Shiprocket
        </p>
      </div>
    </form>
  );
}
