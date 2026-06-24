'use client';
import { CldUploadWidget } from 'next-cloudinary';
import { useState } from 'react';
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

  const handleClose = () => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  };

  const handleUpload = (result: any) => {
    if (result.event === 'success') {
      const url = result.info.secure_url;
      setImages(prev => {
        const newImages = multiple ? [...prev, url] : [url];
        onUpload(newImages); // Need to call onUpload with the updated array
        return newImages;
      });
    }
    handleClose();
  };

  const removeImage = (urlToRemove: string) => {
    const newImages = images.filter(url => url !== urlToRemove);
    setImages(newImages);
    onUpload(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {images.map((url, idx) => (
          <div key={idx} className="relative w-24 h-24 border border-border group">
            <Image
              src={url}
              alt="Uploaded product"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
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
