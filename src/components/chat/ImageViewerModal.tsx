'use client';

import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  imageName?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  imageUrl,
  imageName = 'lotta_image.jpg',
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = imageName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      // Fallback direct open/save
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = imageName;
      a.target = '_blank';
      a.click();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Top Toolbar */}
      <div
        onClick={e => e.stopPropagation()}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={handleDownload}
          className="p-2.5 rounded-2xl bg-navy-900/80 hover:bg-navy-800 text-white border border-indigo-500/20 shadow-lg transition-colors flex items-center gap-2 text-xs font-medium"
          title="Download photo"
        >
          <Download className="w-4 h-4 text-brand-300" />
          <span className="hidden sm:inline">Download</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-2xl bg-navy-900/80 hover:bg-navy-800 text-white border border-indigo-500/20 shadow-lg transition-colors"
          title="Close viewer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image Display */}
      <div
        onClick={e => e.stopPropagation()}
        className="relative max-w-4xl max-h-[85vh] flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl"
      >
        <img
          src={imageUrl}
          alt={imageName}
          className="max-h-[85vh] max-w-full object-contain rounded-2xl select-none"
        />
      </div>
    </div>
  );
};
