import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

interface EvidenceUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  readOnly?: boolean;
}

export default function EvidenceUploader({ images, onChange, readOnly = false }: EvidenceUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate files
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} không phải là hình ảnh`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} vượt quá 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploading(true);
      
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
      const validUrls = uploadedUrls.filter(url => url);
      
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
      <div className="flex flex-wrap gap-4">
        {images.map((url, idx) => (
          <div key={idx} className="relative group w-32 h-32 rounded-lg border border-outline overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={url} 
              alt={`Evidence ${idx + 1}`} 
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
              onClick={() => setPreviewImage(url)}
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Xóa ảnh"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        ))}

        {!readOnly && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-32 h-32 rounded-lg border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <span className="material-symbols-outlined animate-spin text-[32px]">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[32px] mb-2">add_photo_alternate</span>
                <span className="text-body-sm font-medium">Thêm ảnh</span>
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
      {previewImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
          >
            <span className="material-symbols-outlined text-[32px]">close</span>
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
