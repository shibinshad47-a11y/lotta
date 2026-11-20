'use client';

import React, { useState } from 'react';
import { X, Send, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

export interface GallerySelectedImage {
  file: File;
  previewUrl: string;
}

interface GalleryPreviewModalProps {
  isOpen: boolean;
  images: GallerySelectedImage[];
  onClose: () => void;
  onRemoveImage: (index: number) => void;
  onAddMoreImages: (files: FileList) => void;
  onSend: (caption: string) => void;
  isSending?: boolean;
}

export const GalleryPreviewModal: React.FC<GalleryPreviewModalProps> = ({
  isOpen,
  images,
  onClose,
  onRemoveImage,
  onAddMoreImages,
  onSend,
  isSending = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [caption, setCaption] = useState('');

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[selectedIndex] || images[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddMoreImages(e.target.files);
    }
  };

  const handleRemove = (index: number) => {
    onRemoveImage(index);
    if (selectedIndex >= images.length - 1) {
      setSelectedIndex(Math.max(0, images.length - 2));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-navy-950 rounded-3xl border border-indigo-500/20 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-indigo-500/15 flex items-center justify-between bg-navy-900/60 z-10">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-white">
              Preview Photos ({images.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            className="p-1.5 rounded-xl text-indigo-300/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Preview Container */}
        <div className="relative flex-1 bg-black/60 flex items-center justify-center min-h-[300px] max-h-[460px] p-2 overflow-hidden">
          <img
            src={currentImage?.previewUrl}
            alt="Preview"
            className="max-h-[440px] max-w-full object-contain rounded-xl"
          />

          {/* Delete current photo button */}
          <button
            type="button"
            onClick={() => handleRemove(selectedIndex)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-navy-900/80 hover:bg-rose-600/80 text-white transition-colors border border-indigo-500/20"
            title="Remove photo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail Carousel if multiple images */}
        <div className="px-4 py-2.5 bg-navy-900/80 border-t border-indigo-500/15 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {images.map((img, idx) => (
            <div
              key={img.previewUrl + idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                selectedIndex === idx
                  ? 'border-brand-500 scale-105 shadow-glow'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.previewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            </div>
          ))}

          {/* Add more button */}
          <label className="shrink-0 w-14 h-14 rounded-xl border border-dashed border-indigo-500/40 hover:border-brand-400 flex flex-col items-center justify-center text-indigo-300 hover:text-white cursor-pointer bg-white/5 transition-colors">
            <Plus className="w-5 h-5" />
            <span className="text-[9px] font-medium mt-0.5">Add</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Caption & Send */}
        <div className="p-4 bg-navy-900/95 border-t border-indigo-500/15 flex items-center gap-3">
          <input
            type="text"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add an optional caption..."
            disabled={isSending}
            className="flex-1 bg-navy-950/80 border border-indigo-500/20 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-indigo-300/40 focus:outline-none focus:border-brand-500 transition-colors"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSend(caption);
              }
            }}
          />

          <button
            type="button"
            onClick={() => onSend(caption)}
            disabled={isSending || images.length === 0}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-lotta-blue hover:from-brand-500 hover:to-lotta-blue text-white text-xs font-semibold shadow-glow transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSending ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send ({images.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
