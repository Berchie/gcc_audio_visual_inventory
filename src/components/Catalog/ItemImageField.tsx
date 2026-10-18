import React, { useState } from 'react';
import {
  Globe,
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  ExternalLink,
  Camera,
} from 'lucide-react';
import { ItemImageSearchModal } from './ItemImageSearchModal';

interface ItemImageFieldProps {
  imageUrl: string;
  onChange: (url: string) => void;
  itemName?: string;
  category?: string;
  brand?: string;
  model?: string;
}

export const ItemImageField: React.FC<ItemImageFieldProps> = ({
  imageUrl,
  onChange,
  itemName = '',
  category = '',
  brand = '',
  model = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileError, setFileError] = useState<string>('');

  const initialSearchQuery = [brand, model].filter(Boolean).join(' ') || itemName || category || 'Microphone';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFileError('Please choose an image file (PNG, JPG, WebP, SVG).');
      return;
    }
    setFileError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-300">
          Equipment Item Photo
        </label>
        {imageUrl && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
          >
            <X className="h-3 w-3" /> Remove Photo
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 rounded-xl border border-slate-800 bg-slate-850/70 p-3">
        {/* Thumbnail Preview */}
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 flex items-center justify-center group shadow-xs">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={itemName || 'Equipment'}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 text-center p-1">
              <Camera className="h-6 w-6 stroke-[1.5]" />
              <span className="text-[9px] mt-0.5">No photo</span>
            </div>
          )}

          {imageUrl && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              title="Change Image"
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-semibold cursor-pointer"
            >
              Change
            </button>
          )}
        </div>

        {/* Action Buttons & Guidance */}
        <div className="flex-1 space-y-2 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Search Online</span>
            </button>

            <label
              htmlFor="direct-device-upload"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 px-3 py-1.5 text-xs font-medium text-slate-200 transition cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 text-slate-400" />
              <span>Upload Photo</span>
            </label>
            <input
              type="file"
              id="direct-device-upload"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {fileError && (
            <p className="text-[11px] text-rose-400 font-medium">{fileError}</p>
          )}

          <p className="text-[11px] text-slate-400">
            {imageUrl
              ? 'Photo assigned and will show in catalog cards, spec sheets, and checkout views.'
              : 'Add a photo from your computer or search online public archives with one click.'}
          </p>
        </div>
      </div>

      {/* Online Search Modal */}
      <ItemImageSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectImage={(newUrl) => onChange(newUrl)}
        initialQuery={initialSearchQuery}
        category={category}
        currentImage={imageUrl}
        itemName={itemName}
      />
    </div>
  );
};
