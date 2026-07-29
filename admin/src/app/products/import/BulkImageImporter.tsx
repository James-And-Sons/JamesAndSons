'use client';

import { useState } from 'react';
import { pickDirectory } from '@/lib/fileSystemAccess';
import { Cloud, Play, Check, AlertTriangle, RefreshCw } from 'lucide-react';

interface ImageFileItem {
  file: File;
  sku: string;
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  error?: string;
  url?: string;
}

export default function BulkImageImporter() {
  const [items, setItems] = useState<ImageFileItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleSelectFolder = async () => {
    try {
      const files = await pickDirectory();
      
      // Filter out non-image files
      const imageFiles = files.filter(f => 
        /\.(png|jpe?g|gif|webp)$/i.test(f.name)
      );

      // Parse SKU from filename (e.g. "SKU123_1.png" -> SKU: "SKU123", "SKU456.jpg" -> SKU: "SKU456")
      const parsedItems: ImageFileItem[] = imageFiles.map(file => {
        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
        // Match everything up to first underscore, dash or space
        const skuMatch = baseName.match(/^([A-Z0-9a-z\-]+?)([_-\s]\d+)?$/);
        const sku = skuMatch ? skuMatch[1] : baseName;

        return {
          file,
          sku,
          name: file.name,
          status: 'pending'
        };
      });

      setItems(parsedItems);
    } catch (err) {
      console.error('Failed to select directory:', err);
    }
  };

  const uploadSingleImage = async (item: ImageFileItem): Promise<string> => {
    // 1. Get signature from backend
    const timestamp = Math.round(Date.now() / 1000).toString();
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '';
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

    const paramsToSign = {
      timestamp,
      upload_preset: uploadPreset
    };

    const signRes = await fetch('/api/sign-cloudinary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paramsToSign })
    });

    if (!signRes.ok) throw new Error('Cloudinary signing failed');
    const { signature } = await signRes.json();

    // 2. Upload file to Cloudinary
    const formData = new FormData();
    formData.append('file', item.file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('upload_preset', uploadPreset);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok) throw new Error('Cloudinary upload failed');
    const uploadData = await uploadRes.json();
    return uploadData.secure_url;
  };

  const handleStartImport = async () => {
    if (items.length === 0 || importing) return;

    setImporting(true);
    setProgress({ current: 0, total: items.length });

    // Copy list to track progress state
    const currentItems = [...items];

    for (let i = 0; i < currentItems.length; i++) {
      const item = currentItems[i];
      
      // Update item status in UI
      item.status = 'uploading';
      setItems([...currentItems]);

      try {
        // Upload to Cloudinary
        const imageUrl = await uploadSingleImage(item);
        
        // Link image to product SKU in Prisma
        const saveRes = await fetch('/api/products/import/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sku: item.sku,
            imageUrl
          })
        });

        if (!saveRes.ok) {
          const errData = await saveRes.json();
          throw new Error(errData.error || 'Failed to link image to product SKU');
        }

        item.status = 'success';
        item.url = imageUrl;
      } catch (err: any) {
        console.error(`Upload error for ${item.name}:`, err);
        item.status = 'failed';
        item.error = err.message || 'Upload failed';
      }

      setProgress(prev => ({ ...prev, current: i + 1 }));
      setItems([...currentItems]);
    }

    setImporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="bg-surface border border-border p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-[22px] text-primary font-normal leading-tight">Folder Image Importer</h2>
          <p className="font-mono text-[10px] text-muted uppercase tracking-widest mt-1">
            Bulk map local folder images to catalog items by SKU filenames
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSelectFolder}
            disabled={importing}
            className="px-6 py-3 border border-border text-primary font-mono text-[10px] uppercase tracking-widest hover:bg-surface-muted hover:border-accent transition-all cursor-pointer disabled:opacity-50 touch-target"
          >
            Select Folder
          </button>

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleStartImport}
              disabled={importing}
              className="px-6 py-3 bg-accent text-black font-mono text-[10px] uppercase tracking-widest font-semibold hover:bg-accent-hover transition-all cursor-pointer disabled:opacity-50 touch-target flex items-center gap-2"
            >
              {importing ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              Start Import ({items.length})
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {importing && (
        <div className="premium-card p-4 space-y-2">
          <div className="flex justify-between font-mono text-[10px] text-muted uppercase">
            <span>Uploading Catalog Images</span>
            <span>{progress.current} / {progress.total} Completed</span>
          </div>
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Preview Grid */}
      {items.length > 0 && (
        <div className="premium-card overflow-hidden">
          <div className="px-6 py-3 border-b border-border bg-[#16161a] flex justify-between items-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Scanned Images Mapping</span>
            <span className="font-mono text-[10px] text-accent font-semibold">{items.length} Files Found</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto divide-y divide-border/30">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-border bg-surface flex items-center justify-center font-mono text-[10px] uppercase text-muted shrink-0">
                    Image
                  </div>
                  <div>
                    <div className="font-mono text-[12px] text-primary">{item.name}</div>
                    <div className="font-mono text-[10px] text-accent mt-0.5">
                      Mapped to SKU: <span className="font-semibold">{item.sku}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-[10px]">
                  {item.status === 'pending' && (
                    <span className="text-muted uppercase tracking-wider">Pending</span>
                  )}
                  {item.status === 'uploading' && (
                    <span className="text-accent uppercase tracking-wider flex items-center gap-1.5">
                      <RefreshCw size={10} className="animate-spin" /> Uploading...
                    </span>
                  )}
                  {item.status === 'success' && (
                    <span className="text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                      <Check size={12} /> Linked Successfully
                    </span>
                  )}
                  {item.status === 'failed' && (
                    <span className="text-red-400 uppercase tracking-wider flex items-center gap-1" title={item.error}>
                      <AlertTriangle size={12} /> Failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
