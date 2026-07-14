'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CloudinaryUpload from '@/components/CloudinaryUpload';
import SyncButton from '@/components/SyncButton';

type Category = { id: string; name: string };
type Space = { id: string; name: string };

type Spec = { key: string; value: string };

const GOOGLE_PRODUCT_CATEGORIES = [
  "Home & Garden > Lighting > Light Fixtures",
  "Home & Garden > Lighting > Light Fixtures > Chandeliers",
  "Home & Garden > Lighting > Light Fixtures > Ceiling Light Fixtures",
  "Home & Garden > Lighting > Light Fixtures > Wall Light Fixtures",
  "Home & Garden > Lighting > Light Fixtures > Lamps",
  "Home & Garden > Lighting > Lighting Hardware & Accessories",
  "Home & Garden > Lighting > Light Fixtures > Track Lighting",
  "Home & Garden > Lighting > Light Fixtures > Recessed Lighting"
];

type Variant = {
  id?: string;
  name: string;
  sku: string;
  d2cPrice: string;
  mrp: string;
  b2bPrice: string;
  stockQuantity: string;
  images: string;
  weight: string;
  length: string;
  breadth: string;
  height: string;
  actualHeight: string;
  actualWidth: string;
  actualDepth: string;
  
  // Platform & specifications overrides
  power: string;
  voltage: string;
  googleProductCategory: string;
  color: string;
  size: string;
  material: string;
  countryOfOrigin: string;
  brand: string;
  warranty: string;
  bulletPoints: string;
  materialAndFinish: string;
  bulbType: string;
  style: string;
  specs: Spec[];
};

export default function ProductFormClient({ categories, spaces, defaultValues, mode }: {
  categories: Category[];
  spaces: Space[];
  defaultValues?: any;
  mode: 'add' | 'edit';
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // activeTab can be 'parent' (editing main product info) or a number (editing specific variant)
  const [activeTab, setActiveTab] = useState<'parent' | number>('parent');

  // Dimension Unit ('INCH' or 'CM')
  const [dimensionUnit, setDimensionUnit] = useState<'INCH' | 'CM'>(
    defaultValues?.dimensionUnit || 'INCH'
  );

  // Main Product state
  const [parentValues, setParentValues] = useState({
    name: defaultValues?.name || '',
    sku: defaultValues?.sku || '',
    description: defaultValues?.description || '',
    mrp: defaultValues?.mrp ? String(defaultValues.mrp) : '',
    d2cPrice: defaultValues?.d2cPrice ? String(defaultValues.d2cPrice) : '',
    b2bPrice: defaultValues?.b2bPrice ? String(defaultValues.b2bPrice) : '',
    stockQuantity: defaultValues?.stockQuantity ? String(defaultValues.stockQuantity) : '0',
    weight: defaultValues?.weight ? String(defaultValues.weight) : '',
    length: defaultValues?.length ? String(defaultValues.length) : '',
    breadth: defaultValues?.breadth ? String(defaultValues.breadth) : '',
    height: defaultValues?.height ? String(defaultValues.height) : '',
    actualHeight: defaultValues?.actualHeight ? String(defaultValues.actualHeight) : '',
    actualWidth: defaultValues?.actualWidth ? String(defaultValues.actualWidth) : '',
    actualDepth: defaultValues?.actualDepth ? String(defaultValues.actualDepth) : '',
    categoryId: defaultValues?.categoryId || '',
    isLed: defaultValues?.isLed || false,
    gstRate: defaultValues?.gstRate || 18,
    hsnCode: defaultValues?.hsnCode || '',
    bisCertification: defaultValues?.bisCertification || '',
    materialAndFinish: defaultValues?.materialAndFinish?.join(', ') || '',
    bulbType: defaultValues?.bulbType?.join(', ') || '',
    style: defaultValues?.style?.join(', ') || '',
    power: defaultValues?.power || '',
    voltage: defaultValues?.voltage || '',
    googleProductCategory: defaultValues?.googleProductCategory || '',
    color: defaultValues?.color || '',
    size: defaultValues?.size || '',
    material: defaultValues?.material || '',
    countryOfOrigin: defaultValues?.countryOfOrigin || 'India',
    brand: defaultValues?.brand || 'James and Sons',
    warranty: defaultValues?.warranty || '',
    bulletPoints: defaultValues?.bulletPoints?.join('\n') || '',
    // Amazon overrides
    amazonFixtureForm: defaultValues?.amazonFixtureForm || '',
    amazonMountingType: defaultValues?.amazonMountingType || '',
    amazonLightingMethod: defaultValues?.amazonLightingMethod || '',
    amazonWaterResistance: defaultValues?.amazonWaterResistance || '',
    amazonTheme: defaultValues?.amazonTheme || '',
    amazonSpecialFeatures: defaultValues?.amazonSpecialFeatures || [] as string[],
    amazonIncludedComponents: defaultValues?.amazonIncludedComponents || '',
    amazonKeywords: defaultValues?.amazonKeywords || '',
  });

  // Spaces (Product spaces)
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>(
    defaultValues?.spaces?.map((s: any) => s.id) || []
  );

  // Main Product Images
  const [images, setImages] = useState<string[]>(defaultValues?.images || []);

  // Main Product Specs
  const [specs, setSpecs] = useState<Spec[]>(
    defaultValues?.specs
      ? Object.entries(defaultValues.specs).map(([key, value]) => ({ key, value: String(value) }))
      : []
  );

  // Variants state
  const [variants, setVariants] = useState<Variant[]>(
    defaultValues?.variants?.map((v: any) => ({
      id: v.id,
      name: v.name || '',
      sku: v.sku || '',
      d2cPrice: v.d2cPrice ? String(v.d2cPrice) : '',
      mrp: v.mrp ? String(v.mrp) : '',
      b2bPrice: v.b2bPrice ? String(v.b2bPrice) : '',
      stockQuantity: String(v.stockQuantity || '0'),
      images: (v.images || []).join(', '),
      weight: v.weight ? String(v.weight) : '',
      length: v.length ? String(v.length) : '',
      breadth: v.breadth ? String(v.breadth) : '',
      height: v.height ? String(v.height) : '',
      actualHeight: v.actualHeight ? String(v.actualHeight) : '',
      actualWidth: v.actualWidth ? String(v.actualWidth) : '',
      actualDepth: v.actualDepth ? String(v.actualDepth) : '',
      power: v.power || '',
      voltage: v.voltage || '',
      googleProductCategory: v.googleProductCategory || '',
      color: v.color || '',
      size: v.size || '',
      material: v.material || '',
      countryOfOrigin: v.countryOfOrigin || '',
      brand: v.brand || '',
      warranty: v.warranty || '',
      bulletPoints: (v.bulletPoints || []).join('\n'),
      materialAndFinish: (v.materialAndFinish || []).join(', '),
      bulbType: (v.bulbType || []).join(', '),
      style: (v.style || []).join(', '),
      specs: v.specs
        ? Object.entries(v.specs).map(([key, value]) => ({ key, value: String(value) }))
        : [],
    })) || []
  );

  const handleParentFieldChange = (field: keyof typeof parentValues, val: any) => {
    setParentValues(prev => ({ ...prev, [field]: val }));
  };

  const addVariant = () => {
    const nextIdx = variants.length + 1;
    const defaultSkuSuffix = `-VAR${nextIdx}`;
    const autoSku = parentValues.sku ? `${parentValues.sku}${defaultSkuSuffix}`.toUpperCase() : '';

    setVariants(prev => [...prev, {
      name: '',
      sku: autoSku,
      d2cPrice: '',
      mrp: '',
      b2bPrice: '',
      stockQuantity: '0',
      images: '',
      weight: '',
      length: '',
      breadth: '',
      height: '',
      actualHeight: '',
      actualWidth: '',
      actualDepth: '',
      power: '',
      voltage: '',
      googleProductCategory: '',
      color: '',
      size: '',
      material: '',
      countryOfOrigin: '',
      brand: '',
      warranty: '',
      bulletPoints: '',
      materialAndFinish: '',
      bulbType: '',
      style: '',
      specs: []
    }]);
  };

  const updateVariantField = (idx: number, field: keyof Variant, val: any) => {
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: val } : v));
  };

  const removeVariant = (idx: number) => {
    setVariants(prev => prev.filter((_, i) => i !== idx));
  };

  // Variant Specs functions
  const addVariantSpec = (vIdx: number) => {
    setVariants(prev => prev.map((v, i) => i === vIdx ? { ...v, specs: [...v.specs, { key: '', value: '' }] } : v));
  };

  const updateVariantSpec = (vIdx: number, sIdx: number, field: 'key' | 'value', val: string) => {
    setVariants(prev => prev.map((v, i) => {
      if (i === vIdx) {
        const newSpecs = v.specs.map((s, idx) => idx === sIdx ? { ...s, [field]: val } : s);
        return { ...v, specs: newSpecs };
      }
      return v;
    }));
  };

  const removeVariantSpec = (vIdx: number, sIdx: number) => {
    setVariants(prev => prev.map((v, i) => {
      if (i === vIdx) {
        const newSpecs = v.specs.filter((_, idx) => idx !== sIdx);
        return { ...v, specs: newSpecs };
      }
      return v;
    }));
  };

  // Parent specs functions
  const addSpec = () => setSpecs(prev => [...prev, { key: '', value: '' }]);
  const updateSpec = (i: number, field: 'key' | 'value', val: string) => setSpecs(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  const removeSpec = (i: number) => setSpecs(prev => prev.filter((_, idx) => idx !== i));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!parentValues.sku) {
      setError('Product SKU is required.');
      setSaving(false);
      return;
    }

    const body = {
      id: defaultValues?.id,
      name: parentValues.name,
      sku: parentValues.sku,
      description: parentValues.description,
      mrp: parseFloat(parentValues.mrp) || 0,
      d2cPrice: parseFloat(parentValues.d2cPrice) || 0,
      b2bPrice: parseFloat(parentValues.b2bPrice) || 0,
      stockQuantity: parseInt(parentValues.stockQuantity, 10) || 0,
      weight: parseFloat(parentValues.weight) || 0.5,
      length: parseFloat(parentValues.length) || 10,
      breadth: parseFloat(parentValues.breadth) || 10,
      height: parseFloat(parentValues.height) || 10,
      categoryId: parentValues.categoryId,
      spaceIds: selectedSpaces,
      isLed: parentValues.isLed,
      gstRate: parseFloat(String(parentValues.gstRate)) || 18,
      hsnCode: parentValues.hsnCode,
      bisCertification: parentValues.bisCertification,
      actualHeight: parentValues.actualHeight ? parseFloat(parentValues.actualHeight) : null,
      actualWidth: parentValues.actualWidth ? parseFloat(parentValues.actualWidth) : null,
      actualDepth: parentValues.actualDepth ? parseFloat(parentValues.actualDepth) : null,
      materialAndFinish: parentValues.materialAndFinish ? parentValues.materialAndFinish.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      bulbType: parentValues.bulbType ? parentValues.bulbType.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      style: parentValues.style ? parentValues.style.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      power: parentValues.power || null,
      voltage: parentValues.voltage || null,
      googleProductCategory: parentValues.googleProductCategory || null,
      color: parentValues.color || null,
      size: parentValues.size || null,
      material: parentValues.material || null,
      countryOfOrigin: parentValues.countryOfOrigin || 'India',
      brand: parentValues.brand || 'James and Sons',
      warranty: parentValues.warranty || null,
      bulletPoints: parentValues.bulletPoints ? parentValues.bulletPoints.split('\n').map((s: string) => s.trim()).filter(Boolean) : [],
      images: images.filter((img: string) => img.trim()),
      dimensionUnit,
      amazonFixtureForm: parentValues.amazonFixtureForm || null,
      amazonMountingType: parentValues.amazonMountingType || null,
      amazonLightingMethod: parentValues.amazonLightingMethod || null,
      amazonWaterResistance: parentValues.amazonWaterResistance || null,
      amazonTheme: parentValues.amazonTheme || null,
      amazonSpecialFeatures: parentValues.amazonSpecialFeatures || [],
      amazonIncludedComponents: parentValues.amazonIncludedComponents || null,
      amazonKeywords: parentValues.amazonKeywords || null,
      variants: variants.map(v => ({
        name: v.name,
        sku: v.sku,
        d2cPrice: v.d2cPrice ? parseFloat(v.d2cPrice) : null,
        mrp: v.mrp ? parseFloat(v.mrp) : null,
        b2bPrice: v.b2bPrice ? parseFloat(v.b2bPrice) : null,
        stockQuantity: parseInt(v.stockQuantity, 10) || 0,
        images: v.images ? v.images.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        weight: v.weight ? parseFloat(v.weight) : null,
        length: v.length ? parseFloat(v.length) : null,
        breadth: v.breadth ? parseFloat(v.breadth) : null,
        height: v.height ? parseFloat(v.height) : null,
        actualHeight: v.actualHeight ? parseFloat(v.actualHeight) : null,
        actualWidth: v.actualWidth ? parseFloat(v.actualWidth) : null,
        actualDepth: v.actualDepth ? parseFloat(v.actualDepth) : null,
        power: v.power || null,
        voltage: v.voltage || null,
        googleProductCategory: v.googleProductCategory || null,
        color: v.color || null,
        size: v.size || null,
        material: v.material || null,
        countryOfOrigin: v.countryOfOrigin || null,
        brand: v.brand || null,
        warranty: v.warranty || null,
        bulletPoints: v.bulletPoints ? v.bulletPoints.split('\n').map((s: string) => s.trim()).filter(Boolean) : [],
        materialAndFinish: v.materialAndFinish ? v.materialAndFinish.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        bulbType: v.bulbType ? v.bulbType.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        style: v.style ? v.style.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        specs: v.specs.reduce((acc: any, s: Spec) => { if (s.key) acc[s.key] = s.value; return acc; }, {}),
      })),
      specs: specs.reduce((acc: any, s: Spec) => { if (s.key) acc[s.key] = s.value; return acc; }, {}),
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

      {/* === VARIANT SELECTOR TABS === */}
      <div className="border-b border-border pb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Active Form View</label>
          <p className="text-[11px] text-muted italic">Prefill is enabled automatically for all variant fields.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('parent')}
            className={`px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest border transition-all ${
              activeTab === 'parent'
                ? 'bg-accent border-accent text-black font-semibold'
                : 'border-border text-muted hover:border-accent/40 hover:text-primary bg-background'
            }`}
          >
            Main Product Details
          </button>
          
          {variants.map((v, i) => (
            <div key={i} className={`flex items-center border transition-all ${activeTab === i ? 'border-accent bg-accent/5' : 'border-border bg-background'}`}>
              <button
                type="button"
                onClick={() => setActiveTab(i)}
                className={`pl-4 pr-2 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-all ${
                  activeTab === i ? 'text-accent font-semibold' : 'text-muted hover:text-primary'
                }`}
              >
                {v.name || `Var ${i + 1}`}
              </button>
              <button
                type="button"
                onClick={() => {
                  removeVariant(i);
                  if (activeTab === i) setActiveTab('parent');
                  else if (typeof activeTab === 'number' && activeTab > i) setActiveTab(activeTab - 1);
                }}
                className="pr-3 pl-1 text-[16px] text-red-400 hover:text-red-600 transition-colors"
                title="Delete variant"
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              const newIdx = variants.length;
              addVariant();
              setActiveTab(newIdx);
            }}
            className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-accent border border-dashed border-accent/40 hover:border-accent hover:bg-accent/5 transition-all bg-background"
          >
            + Add Variant Option
          </button>
        </div>
      </div>

      {activeTab === 'parent' ? (
        /* ========================================================================= */
        /* ========================== PARENT PRODUCT FORM ========================== */
        /* ========================================================================= */
        <div className="space-y-10 animate-in fade-in duration-200">
          {/* === BASIC INFO === */}
          <div>
            <h3 className={sectionTitle}>Basic Information (Main Product)</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Product Name *</label>
                <input
                  required
                  value={parentValues.name}
                  onChange={e => handleParentFieldChange('name', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. James Chandelier"
                />
              </div>
              <div>
                <label className={labelCls}>SKU Code *</label>
                <input
                  required
                  value={parentValues.sku}
                  onChange={e => handleParentFieldChange('sku', e.target.value)}
                  className={`${inputCls} uppercase`}
                  placeholder="e.g. JS-CHAND-102"
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Description</label>
                <textarea
                  value={parentValues.description}
                  onChange={e => handleParentFieldChange('description', e.target.value)}
                  rows={4}
                  className={inputCls}
                  placeholder="Enter detailed catalog description..."
                />
              </div>
              <div>
                <label className={labelCls}>Category *</label>
                <select
                  required
                  value={parentValues.categoryId}
                  onChange={e => handleParentFieldChange('categoryId', e.target.value)}
                  className={inputCls}
                >
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
                          ? 'bg-accent border-accent text-black font-semibold'
                          : 'border-border text-muted hover:border-accent/50'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* === PRICING & INVENTORY === */}
          <div className="pt-6 border-t border-border">
            <h3 className={sectionTitle}>Pricing &amp; Inventory</h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <label className={labelCls}>MRP (₹) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={parentValues.mrp}
                  onChange={e => handleParentFieldChange('mrp', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>D2C Price (₹) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={parentValues.d2cPrice}
                  onChange={e => handleParentFieldChange('d2cPrice', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>B2B Price (₹) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={parentValues.b2bPrice}
                  onChange={e => handleParentFieldChange('b2bPrice', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Stock Qty *</label>
                <input
                  required
                  type="number"
                  value={parentValues.stockQuantity}
                  onChange={e => handleParentFieldChange('stockQuantity', e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6 mt-6">
              <div>
                <label className={labelCls}>Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={parentValues.weight}
                  onChange={e => handleParentFieldChange('weight', e.target.value)}
                  className={inputCls}
                  placeholder="0.5"
                />
              </div>
              <div>
                <label className={labelCls}>Length (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={parentValues.length}
                  onChange={e => handleParentFieldChange('length', e.target.value)}
                  className={inputCls}
                  placeholder="10"
                />
              </div>
              <div>
                <label className={labelCls}>Breadth (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={parentValues.breadth}
                  onChange={e => handleParentFieldChange('breadth', e.target.value)}
                  className={inputCls}
                  placeholder="10"
                />
              </div>
              <div>
                <label className={labelCls}>Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={parentValues.height}
                  onChange={e => handleParentFieldChange('height', e.target.value)}
                  className={inputCls}
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* === TECHNICAL SPECS === */}
          <div className="pt-6 border-t border-border">
            <h3 className={sectionTitle}>Technical Specifications</h3>
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div>
                <label className={labelCls}>GST Rate (%)</label>
                <select
                  value={parentValues.gstRate}
                  onChange={e => handleParentFieldChange('gstRate', parseInt(e.target.value, 10))}
                  className={inputCls}
                >
                  <option value={5}>5% (LED)</option>
                  <option value={18}>18% (Traditional)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>HSN Code</label>
                <input
                  value={parentValues.hsnCode}
                  onChange={e => handleParentFieldChange('hsnCode', e.target.value)}
                  className={inputCls}
                  placeholder="94054090"
                />
              </div>
              <div>
                <label className={labelCls}>BIS Certification</label>
                <input
                  value={parentValues.bisCertification}
                  onChange={e => handleParentFieldChange('bisCertification', e.target.value)}
                  className={inputCls}
                  placeholder="IS 10322"
                />
              </div>
              <div className="flex items-center gap-3 mt-6">
                <input
                  type="checkbox"
                  checked={parentValues.isLed}
                  onChange={e => handleParentFieldChange('isLed', e.target.checked)}
                  id="isLed"
                  className="w-4 h-4 accent-[#c4a05a]"
                />
                <label htmlFor="isLed" className="font-mono text-[11px] uppercase tracking-widest text-muted cursor-pointer">LED Product</label>
              </div>
            </div>

            <div className="bg-surface-muted/20 p-6 border border-border space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Core Attributes */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-accent"></div>
                    <h4 className="font-mono text-[10px] uppercase tracking-widest text-primary">Core Attributes</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls}>Material &amp; Finish</label>
                      <input
                        value={parentValues.materialAndFinish}
                        onChange={e => handleParentFieldChange('materialAndFinish', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Brass, Matte Black"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Bulb Type</label>
                      <input
                        value={parentValues.bulbType}
                        onChange={e => handleParentFieldChange('bulbType', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. E14, Integrated LED"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Design Style</label>
                      <input
                        value={parentValues.style}
                        onChange={e => handleParentFieldChange('style', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Contemporary, Art Deco"
                      />
                    </div>
                  </div>
                </div>

                {/* Display Dimensions */}
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
                        <input
                          type="number"
                          step="0.1"
                          value={parentValues.actualHeight}
                          onChange={e => handleParentFieldChange('actualHeight', e.target.value)}
                          className={`${inputCls} !pr-8`}
                          placeholder="0.0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted">
                          {dimensionUnit === 'INCH' ? '"' : 'cm'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Width ({dimensionUnit === 'INCH' ? 'in' : 'cm'})</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={parentValues.actualWidth}
                          onChange={e => handleParentFieldChange('actualWidth', e.target.value)}
                          className={`${inputCls} !pr-8`}
                          placeholder="0.0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted">
                          {dimensionUnit === 'INCH' ? '"' : 'cm'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Depth ({dimensionUnit === 'INCH' ? 'in' : 'cm'})</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={parentValues.actualDepth}
                          onChange={e => handleParentFieldChange('actualDepth', e.target.value)}
                          className={`${inputCls} !pr-8`}
                          placeholder="Optional"
                        />
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

            {/* Power & Voltage SPECIFIC inputs */}
            <div className="grid grid-cols-2 gap-6 mt-6 bg-accent/5 p-4 border border-accent/10">
              <div>
                <label className={labelCls}>Power specification *</label>
                <input
                  required
                  value={parentValues.power}
                  onChange={e => handleParentFieldChange('power', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 15W, 24W"
                />
              </div>
              <div>
                <label className={labelCls}>Voltage specification *</label>
                <input
                  required
                  value={parentValues.voltage}
                  onChange={e => handleParentFieldChange('voltage', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 220V, 12V-24V"
                />
              </div>
            </div>

            {/* Additional Listing Fields */}
            <div className="grid grid-cols-3 gap-6 mt-6 p-4 border border-border bg-surface-muted/10">
              <div className="col-span-3 font-mono text-[10px] uppercase tracking-widest text-accent mb-2">Platform Listings &amp; Feeds Compatibility</div>
              <div>
                <label className={labelCls}>Brand name</label>
                <input
                  value={parentValues.brand}
                  onChange={e => handleParentFieldChange('brand', e.target.value)}
                  className={inputCls}
                  placeholder="James and Sons"
                />
              </div>
              <div>
                <label className={labelCls}>Warranty terms</label>
                <input
                  value={parentValues.warranty}
                  onChange={e => handleParentFieldChange('warranty', e.target.value)}
                  className={inputCls}
                  placeholder="2 Years Warranty"
                />
              </div>
              <div>
                <label className={labelCls}>Country of origin</label>
                <input
                  value={parentValues.countryOfOrigin}
                  onChange={e => handleParentFieldChange('countryOfOrigin', e.target.value)}
                  className={inputCls}
                  placeholder="India"
                />
              </div>
              <div className="col-span-3">
                <label className={labelCls}>Google Product Category Taxonomy</label>
                <select
                  value={parentValues.googleProductCategory}
                  onChange={e => handleParentFieldChange('googleProductCategory', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select Google Product Category</option>
                  {GOOGLE_PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Dominant Color tag</label>
                <input
                  value={parentValues.color}
                  onChange={e => handleParentFieldChange('color', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Gold, Brass, Matte Black"
                />
              </div>
              <div>
                <label className={labelCls}>Size tag</label>
                <input
                  value={parentValues.size}
                  onChange={e => handleParentFieldChange('size', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 48-inch, Medium"
                />
              </div>
              <div>
                <label className={labelCls}>Material tag</label>
                <input
                  value={parentValues.material}
                  onChange={e => handleParentFieldChange('material', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Brass, Glass"
                />
              </div>
              <div className="col-span-3">
                <label className={labelCls}>Marketplace Bullet Points (one per line, max 5)</label>
                <textarea
                  value={parentValues.bulletPoints}
                  onChange={e => handleParentFieldChange('bulletPoints', e.target.value)}
                  rows={4}
                  className={inputCls}
                  placeholder="Enter highlight features for Amazon/Flipkart listings..."
                />
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <div className="flex justify-between items-center">
                <label className={labelCls}>Additional specs (for filtering)</label>
                <button type="button" onClick={addSpec} className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent border border-accent/30 px-3 py-1 hover:border-accent transition-colors">
                  + Add Spec
                </button>
              </div>
              {specs.map((spec, i) => (
                <div key={i} className="flex gap-3 items-center animate-in fade-in slide-in-from-left-2 duration-200">
                  <input value={spec.key} onChange={e => updateSpec(i, 'key', e.target.value)} placeholder="Key (e.g. Bulb Qty)" className={`${inputCls.replace(/\bw-full\b/, '')} w-1/3 !py-2 !text-[12px]`} />
                  <input value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)} placeholder="Value (e.g. 6 Bulbs)" className={`${inputCls.replace(/\bw-full\b/, '')} flex-1 !py-2 !text-[12px]`} />
                  <button type="button" onClick={() => removeSpec(i)} className="btn-ghost !text-red-400 hover:!bg-red-400/10 !p-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              {specs.length === 0 && <p className="text-muted font-mono text-[11px]">No specs yet — click "Add Spec" to add filterable attributes.</p>}
            </div>
          </div>

          {/* === AMAZON & MARKETPLACE SEO === */}
          <div className="pt-6 border-t border-border">
            <h3 className={sectionTitle}>Amazon & Marketplace SEO</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Light Fixture Form</label>
                <select
                  value={parentValues.amazonFixtureForm}
                  onChange={e => handleParentFieldChange('amazonFixtureForm', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Auto-detected (Dynamic)</option>
                  <option value="Chandelier">Chandelier</option>
                  <option value="Pendant">Pendant</option>
                  <option value="Ceiling">Ceiling</option>
                  <option value="Sconce">Sconce</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Mounting Type</label>
                <select
                  value={parentValues.amazonMountingType}
                  onChange={e => handleParentFieldChange('amazonMountingType', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Auto-detected (Dynamic)</option>
                  <option value="Ceiling Mount">Ceiling Mount</option>
                  <option value="Wall Mount">Wall Mount</option>
                  <option value="Post Mount">Post Mount</option>
                  <option value="Floor Mount">Floor Mount</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Lighting Method</label>
                <select
                  value={parentValues.amazonLightingMethod}
                  onChange={e => handleParentFieldChange('amazonLightingMethod', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Auto-detected (Dynamic)</option>
                  <option value="Downlight">Downlight</option>
                  <option value="Uplight">Uplight</option>
                  <option value="Adjustable">Adjustable</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Water Resistance Level</label>
                <select
                  value={parentValues.amazonWaterResistance}
                  onChange={e => handleParentFieldChange('amazonWaterResistance', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Auto-detected (Dynamic)</option>
                  <option value="Not Water Resistant">Not Water Resistant</option>
                  <option value="Moisture Resistant">Moisture Resistant</option>
                  <option value="Waterproof">Waterproof</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Design Theme</label>
                <select
                  value={parentValues.amazonTheme}
                  onChange={e => handleParentFieldChange('amazonTheme', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Auto-detected (Dynamic)</option>
                  <option value="Modern">Modern</option>
                  <option value="Vintage">Vintage</option>
                  <option value="Retro">Retro</option>
                  <option value="Art Deco">Art Deco</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Included Components Override</label>
                <input
                  type="text"
                  value={parentValues.amazonIncludedComponents}
                  onChange={e => handleParentFieldChange('amazonIncludedComponents', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 1 Pendant Light, Hanging Wire, Canopy"
                />
              </div>

              <div className="col-span-2">
                <label className={labelCls}>Special Features</label>
                <div className="grid grid-cols-3 gap-3 mt-2 border border-border p-4 bg-black/10">
                  {["Adjustable Height", "Dimmable", "Energy Efficient", "Color Changing", "Rust Resistant"].map(feature => {
                    const isChecked = parentValues.amazonSpecialFeatures?.includes(feature);
                    return (
                      <label key={feature} className="flex items-center gap-2 text-[13px] font-body text-primary cursor-pointer hover:text-accent transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            const newFeatures = e.target.checked
                              ? [...(parentValues.amazonSpecialFeatures || []), feature]
                              : (parentValues.amazonSpecialFeatures || []).filter((f: string) => f !== feature);
                            handleParentFieldChange('amazonSpecialFeatures', newFeatures);
                          }}
                          className="w-4 h-4 rounded border-border bg-background text-accent focus:ring-accent accent-accent"
                        />
                        {feature}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="col-span-2">
                <label className={labelCls}>Generic Search Keywords Override (Space-separated)</label>
                <textarea
                  value={parentValues.amazonKeywords}
                  onChange={e => handleParentFieldChange('amazonKeywords', e.target.value)}
                  rows={2}
                  className={inputCls}
                  placeholder="Leave empty for auto-generated SEO keywords. Enter space-separated keywords under 250 characters."
                />
              </div>
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
        </div>
      ) : (
        /* ========================================================================= */
        /* ========================== ACTIVE VARIANT FORM ========================== */
        /* ========================================================================= */
        <div className="space-y-10 animate-in fade-in duration-200">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className={sectionTitle}>Variant #{activeTab + 1} Specifications</h3>
              <button
                type="button"
                onClick={() => {
                  removeVariant(activeTab);
                  setActiveTab('parent');
                }}
                className="font-mono text-[9px] uppercase tracking-[0.15em] text-red-400 border border-red-900/30 px-3 py-1.5 hover:bg-red-950/20 transition-colors"
              >
                Delete Variant
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 bg-surface-muted/10 p-6 border border-border">
              <div className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-accent mb-2">Basic Info &amp; SKU</div>
              <div>
                <label className={labelCls}>Variant Name *</label>
                <input
                  required
                  value={variants[activeTab].name}
                  onChange={e => updateVariantField(activeTab, 'name', e.target.value)}
                  placeholder="e.g. Gold - 48 inch"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Variant SKU *</label>
                <input
                  required
                  value={variants[activeTab].sku}
                  onChange={e => updateVariantField(activeTab, 'sku', e.target.value)}
                  placeholder="SKU Code"
                  className={`${inputCls} uppercase`}
                />
              </div>
              <div>
                <label className={labelCls}>Stock Qty *</label>
                <input
                  required
                  type="number"
                  value={variants[activeTab].stockQuantity}
                  onChange={e => updateVariantField(activeTab, 'stockQuantity', e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Overrides */}
            <div className="pt-6 border-t border-border mt-8">
              <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Attribute Overrides (Leave blank to inherit parent)</h4>
              
              {/* Overrides: Pricing */}
              <div className="grid grid-cols-3 gap-6 bg-background p-4 border border-border">
                <div>
                  <label className={labelCls}>MRP Override (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={variants[activeTab].mrp}
                    onChange={e => updateVariantField(activeTab, 'mrp', e.target.value)}
                    placeholder={parentValues.mrp ? `Inherit (₹${parentValues.mrp})` : 'Inherit'}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>D2C Price Override (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={variants[activeTab].d2cPrice}
                    onChange={e => updateVariantField(activeTab, 'd2cPrice', e.target.value)}
                    placeholder={parentValues.d2cPrice ? `Inherit (₹${parentValues.d2cPrice})` : 'Inherit'}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>B2B Price Override (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={variants[activeTab].b2bPrice}
                    onChange={e => updateVariantField(activeTab, 'b2bPrice', e.target.value)}
                    placeholder={parentValues.b2bPrice ? `Inherit (₹${parentValues.b2bPrice})` : 'Inherit'}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Overrides: Shipping dimensions */}
              <div className="grid grid-cols-4 gap-6 bg-background p-4 border border-border border-t-0">
                <div className="col-span-4 font-mono text-[8px] uppercase tracking-widest text-muted">Shipping Package (cm)</div>
                <div>
                  <label className={labelCls}>Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={variants[activeTab].weight}
                    onChange={e => updateVariantField(activeTab, 'weight', e.target.value)}
                    placeholder={parentValues.weight ? `Inherit (${parentValues.weight} kg)` : 'Inherit'}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Length (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={variants[activeTab].length}
                    onChange={e => updateVariantField(activeTab, 'length', e.target.value)}
                    placeholder={parentValues.length ? `Inherit (${parentValues.length} cm)` : 'Inherit'}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Breadth (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={variants[activeTab].breadth}
                    onChange={e => updateVariantField(activeTab, 'breadth', e.target.value)}
                    placeholder={parentValues.breadth ? `Inherit (${parentValues.breadth} cm)` : 'Inherit'}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={variants[activeTab].height}
                    onChange={e => updateVariantField(activeTab, 'height', e.target.value)}
                    placeholder={parentValues.height ? `Inherit (${parentValues.height} cm)` : 'Inherit'}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Overrides: Core Attributes & Specs */}
              <div className="grid grid-cols-3 gap-6 mt-6 bg-background p-4 border border-border">
                <div className="col-span-3 font-mono text-[8px] uppercase tracking-widest text-muted">Core Attributes Overrides</div>
                <div>
                  <label className={labelCls}>Material &amp; Finish</label>
                  <input
                    value={variants[activeTab].materialAndFinish}
                    onChange={e => updateVariantField(activeTab, 'materialAndFinish', e.target.value)}
                    placeholder={parentValues.materialAndFinish || 'Inherit'}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Bulb Type</label>
                  <input
                    value={variants[activeTab].bulbType}
                    onChange={e => updateVariantField(activeTab, 'bulbType', e.target.value)}
                    placeholder={parentValues.bulbType || 'Inherit'}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Design Style</label>
                  <input
                    value={variants[activeTab].style}
                    onChange={e => updateVariantField(activeTab, 'style', e.target.value)}
                    placeholder={parentValues.style || 'Inherit'}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Overrides: Power, Voltage, and actual Dimensions */}
              <div className="grid grid-cols-2 gap-6 mt-6 bg-background p-4 border border-border">
                <div className="col-span-2 font-mono text-[8px] uppercase tracking-widest text-muted">Technical Specs &amp; Actual Dimensions Overrides</div>
                <div>
                  <label className={labelCls}>Power Override</label>
                  <input
                    value={variants[activeTab].power}
                    onChange={e => updateVariantField(activeTab, 'power', e.target.value)}
                    placeholder={parentValues.power || 'Inherit'}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Voltage Override</label>
                  <input
                    value={variants[activeTab].voltage}
                    onChange={e => updateVariantField(activeTab, 'voltage', e.target.value)}
                    placeholder={parentValues.voltage || 'Inherit'}
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2 grid grid-cols-3 gap-4 bg-surface-muted/20 p-3 border border-border">
                  <div className="col-span-3 font-mono text-[8px] uppercase tracking-widest text-muted">Actual Product Size ({dimensionUnit === 'INCH' ? 'in' : 'cm'})</div>
                  <div>
                    <label className={labelCls}>Height</label>
                    <input
                      type="number"
                      step="0.1"
                      value={variants[activeTab].actualHeight}
                      onChange={e => updateVariantField(activeTab, 'actualHeight', e.target.value)}
                      placeholder={parentValues.actualHeight ? `Inherit (${parentValues.actualHeight})` : 'Inherit'}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Width</label>
                    <input
                      type="number"
                      step="0.1"
                      value={variants[activeTab].actualWidth}
                      onChange={e => updateVariantField(activeTab, 'actualWidth', e.target.value)}
                      placeholder={parentValues.actualWidth ? `Inherit (${parentValues.actualWidth})` : 'Inherit'}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Depth</label>
                    <input
                      type="number"
                      step="0.1"
                      value={variants[activeTab].actualDepth}
                      onChange={e => updateVariantField(activeTab, 'actualDepth', e.target.value)}
                      placeholder={parentValues.actualDepth ? `Inherit (${parentValues.actualDepth})` : 'Inherit'}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Overrides: Platforms integration */}
              <div className="grid grid-cols-3 gap-6 mt-6 bg-background p-4 border border-border">
                <div className="col-span-3 font-mono text-[8px] uppercase tracking-widest text-muted">Platform Listing Overrides</div>
                <div>
                  <label className={labelCls}>Brand Override</label>
                  <input
                    value={variants[activeTab].brand}
                    onChange={e => updateVariantField(activeTab, 'brand', e.target.value)}
                    placeholder={parentValues.brand || 'Inherit'}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Warranty Override</label>
                  <input
                    value={variants[activeTab].warranty}
                    onChange={e => updateVariantField(activeTab, 'warranty', e.target.value)}
                    placeholder={parentValues.warranty || 'Inherit'}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Country of Origin Override</label>
                  <input
                    value={variants[activeTab].countryOfOrigin}
                    onChange={e => updateVariantField(activeTab, 'countryOfOrigin', e.target.value)}
                    placeholder={parentValues.countryOfOrigin || 'Inherit'}
                    className={inputCls}
                  />
                </div>
                 <div className="col-span-3">
                  <label className={labelCls}>Google Product Category Override</label>
                  <select
                    value={variants[activeTab].googleProductCategory}
                    onChange={e => updateVariantField(activeTab, 'googleProductCategory', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Inherit Parent ({parentValues.googleProductCategory || 'None'})</option>
                    {GOOGLE_PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Color Override</label>
                  <input
                    value={variants[activeTab].color}
                    onChange={e => updateVariantField(activeTab, 'color', e.target.value)}
                    placeholder={parentValues.color || 'Inherit'}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Size Override</label>
                  <input
                    value={variants[activeTab].size}
                    onChange={e => updateVariantField(activeTab, 'size', e.target.value)}
                    placeholder={parentValues.size || 'Inherit'}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Material Override</label>
                  <input
                    value={variants[activeTab].material}
                    onChange={e => updateVariantField(activeTab, 'material', e.target.value)}
                    placeholder={parentValues.material || 'Inherit'}
                    className={inputCls}
                  />
                </div>
                <div className="col-span-3">
                  <label className={labelCls}>Marketplace Bullet Points Override (one per line, max 5)</label>
                  <textarea
                    value={variants[activeTab].bulletPoints}
                    onChange={e => updateVariantField(activeTab, 'bulletPoints', e.target.value)}
                    rows={4}
                    placeholder={parentValues.bulletPoints || 'Inherit'}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Overrides: custom specs */}
              <div className="space-y-2 mt-6">
                <div className="flex justify-between items-center">
                  <label className={labelCls}>Variant-specific specs overrides</label>
                  <button type="button" onClick={() => addVariantSpec(activeTab)} className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent border border-accent/30 px-3 py-1 hover:border-accent transition-colors">
                    + Add Variant Spec
                  </button>
                </div>
                {variants[activeTab].specs.map((spec, sIdx) => (
                  <div key={sIdx} className="flex gap-3 items-center animate-in fade-in slide-in-from-left-2 duration-200">
                    <input value={spec.key} onChange={e => updateVariantSpec(activeTab, sIdx, 'key', e.target.value)} placeholder="Key (e.g. Frame Color)" className={`${inputCls.replace(/\bw-full\b/, '')} w-1/3 !py-2 !text-[12px]`} />
                    <input value={spec.value} onChange={e => updateVariantSpec(activeTab, sIdx, 'value', e.target.value)} placeholder="Value (e.g. Polished Chrome)" className={`${inputCls.replace(/\bw-full\b/, '')} flex-1 !py-2 !text-[12px]`} />
                    <button type="button" onClick={() => removeVariantSpec(activeTab, sIdx)} className="btn-ghost !text-red-400 hover:!bg-red-400/10 !p-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                {variants[activeTab].specs.length === 0 && <p className="text-muted font-mono text-[11px] italic">No variant-specific overrides. Variant inherits parent custom specs.</p>}
              </div>
            </div>

            {/* Variant Images */}
            <div className="pt-6 border-t border-border mt-8">
              <h3 className={sectionTitle}>Variant Images (Will inherit parent images if left blank)</h3>
              <CloudinaryUpload
                onUpload={(urls) => updateVariantField(activeTab, 'images', urls.join(', '))}
                defaultImages={variants[activeTab].images ? variants[activeTab].images.split(',').map(s => s.trim()).filter(Boolean) : []}
                multiple={true}
                label="Add Variant Image"
              />
            </div>
          </div>
        </div>
      )}

      {/* === SUBMIT === */}
      <div className="pt-6 border-t border-border flex flex-col items-end gap-4">
        <div className="flex gap-4">
          {mode === 'edit' && defaultValues?.id && (
            <SyncButton productId={defaultValues.id} label="Sync Marketplaces" />
          )}
          <button type="button" onClick={() => router.back()} className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-6 py-3 hover:text-primary transition-colors bg-background">
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
