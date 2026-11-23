'use client';

import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import ImageLightbox from '@/components/advisor/common/ImageLightbox';

interface EvidenceUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  readOnly?: boolean;
}

const compressImageFile = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
              resolve(new File([blob], newName, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function EvidenceUploader({ images, onChange, readOnly = false }: EvidenceUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} không phải là hình ảnh`);
        return false;
      }
      return true;
    });

    if (imageFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploading(true);

      const compressedFiles = await Promise.all(imageFiles.map((file) => compressImageFile(file)));
      const validFiles = compressedFiles.filter((file) => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Ảnh ${file.name} vượt quá 5MB sau khi nén`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', 'car_service/checkin');

        const res = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        return res.data?.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url) => Boolean(url));

      if (validUrls.length > 0) {
        onChange([...images, ...validUrls]);
        toast.success(`Đã tải lên ${validUrls.length} ảnh`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi kết nối khi tải ảnh');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    if (readOnly) return;
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3 sm:gap-4">
        {images.map((url, idx) => (
          <div key={idx} className="relative group w-28 h-28 sm:w-32 sm:h-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Ảnh kiểm tra ${idx + 1}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setPreviewImage(url)}
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeImage(idx)}
                aria-label={`Xóa ảnh ${idx + 1}`}
                className="sa-press absolute top-1.5 right-1.5 w-9 h-9 sm:w-8 sm:h-8 bg-rose-600/95 hover:bg-rose-700 text-white rounded-full flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shadow-sm cursor-pointer"
                title="Xóa ảnh"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        ))}

        {!readOnly && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="sa-press w-28 h-28 sm:w-32 sm:h-32 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {uploading ? (
              <span className="material-symbols-outlined animate-spin text-[28px] text-[#0050cd]">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[28px] mb-1.5 text-[#0050cd]">add_photo_alternate</span>
                <span className="text-xs font-semibold">Thêm ảnh</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
      />

      {/* Image Preview Modal */}
      <ImageLightbox
        src={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
