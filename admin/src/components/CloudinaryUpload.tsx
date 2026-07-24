'use client';
import { CldUploadWidget } from 'next-cloudinary';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface CloudinaryUploadProps {
  onUpload: (urls: string[]) => void;
  defaultImages?: string[];
  multiple?: boolean;
  label?: string;
}

export default function CloudinaryUpload({
  onUpload,
  defaultImages = [],
  multiple = false,
  label = "Upload Image"
}: CloudinaryUploadProps) {
  const [images, setImages] = useState<string[]>(defaultImages);

  // Sync state if defaultImages changes (e.g., when switching active variant)
  useEffect(() => {
    if (JSON.stringify(defaultImages) !== JSON.stringify(images)) {
      setImages(defaultImages);
    }
  }, [defaultImages]);

  const handleClose = () => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  };

  const handleUpload = (result: any) => {
    if (result.event === 'success') {
      const url = result.info.secure_url;
      const newImages = multiple ? [...images, url] : [url];
      setImages(newImages);
      onUpload(newImages);
    }
    handleClose();
  };

  const removeImage = async (urlToRemove: string) => {
    const newImages = images.filter(url => url !== urlToRemove);
    setImages(newImages);
    onUpload(newImages);

    // Trigger deletion from Cloudinary in the background
    try {
      const res = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToRemove })
      });
      if (!res.ok) {
        console.error('Failed to delete image from Cloudinary:', await res.text());
      } else {
        console.log('Successfully deleted image from Cloudinary:', urlToRemove);
      }
    } catch (err) {
      console.error('Failed to delete image from Cloudinary:', err);
    }
  };

  const moveImage = (index: number, direction: number) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    setImages(newImages);
    onUpload(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {images.map((url, idx) => (
          <div key={idx} className="relative w-24 h-24 border border-border group overflow-hidden">
            <Image
              src={url}
              alt="Uploaded product"
              fill
              className="object-cover"
            />
            {/* Delete button */}
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
              title="Delete from Cloudinary"
            >
              ×
            </button>

            {/* Reordering Overlay */}
            {multiple && images.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-1 px-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveImage(idx, -1)}
                  className="text-white hover:text-accent text-[10px] disabled:opacity-30 disabled:hover:text-white"
                  title="Move left"
                >
                  ←
                </button>
                <span className="text-[8px] font-mono text-muted">{idx + 1}</span>
                <button
                  type="button"
                  disabled={idx === images.length - 1}
                  onClick={() => moveImage(idx, 1)}
                  className="text-white hover:text-accent text-[10px] disabled:opacity-30 disabled:hover:text-white"
                  title="Move right"
                >
                  →
                </button>
              </div>
            )}
          </div>
        ))}

        {(multiple || images.length === 0) && (
          <CldUploadWidget
            signatureEndpoint="/api/sign-cloudinary"
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            options={{
              multiple: multiple,
              apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
            }}
            onSuccess={handleUpload}
            onClose={handleClose}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                className="w-24 h-24 border border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-accent hover:text-accent transition-colors text-muted text-[10px] uppercase font-mono tracking-widest"
              >
                <span className="text-xl">+</span>
                {label}
              </button>
            )}
          </CldUploadWidget>
        )}
      </div>

      {images.length === 0 && !multiple && (
        <p className="text-[11px] text-muted italic">No image uploaded yet.</p>
      )}
    </div>
  );
}
