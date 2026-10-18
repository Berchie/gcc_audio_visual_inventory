import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Upload,
  Link as LinkIcon,
  Globe,
  Check,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface ImageResultItem {
  id: string;
  title: string;
  url: string;
  thumbUrl: string;
  source: string;
  license?: string;
}

interface ItemImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  initialQuery?: string;
  category?: string;
  currentImage?: string;
  itemName?: string;
}

const PRESET_TAGS = [
  'Shure Wireless',
  'Sennheiser Mic',
  'Broadcast Camera',
  'Sony Cinema',
  'PTZ Camera',
  'Video Switcher',
  'Stage Lighting',
  'Aputure LED',
  'Audio Console',
  'Studio Tripod',
  'Stage Multicore',
  'In-Ear Monitors',
];

export const ItemImageSearchModal: React.FC<ItemImageSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  initialQuery = '',
  category = '',
  currentImage = '',
  itemName = '',
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'upload' | 'url'>('search');
  const [query, setQuery] = useState(initialQuery || itemName || '');
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL input state
  const [customUrl, setCustomUrl] = useState('');
  const [urlPreviewValid, setUrlPreviewValid] = useState<boolean | null>(null);

  // File upload state
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Perform search
  const handleSearch = useCallback(async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsLoading(true);
    setError(null);

    try {
      const url = `/api/images/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&limit=24`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setResults(data.results);
      } else {
        setResults([]);
        setError('No images found for this search. Try a broader search term like "camera" or "microphone".');
      }
    } catch (err: any) {
      console.warn('Search request error:', err);
      // Fallback: search Wikimedia Commons directly from client
      try {
        const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}&gsrlimit=16&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=500&format=json&origin=*`;
        const wikiRes = await fetch(wikiUrl);
        const wikiData = await wikiRes.json();
        const pages = wikiData?.query?.pages;
        if (pages) {
          const directResults: ImageResultItem[] = [];
          for (const pid in pages) {
            const page = pages[pid];
            const info = page?.imageinfo?.[0];
            if (info?.url) {
              directResults.push({
                id: pid,
                title: (page.title || '').replace(/^File:/i, '').replace(/\.[^/.]+$/, ''),
                url: info.url,
                thumbUrl: info.thumburl || info.url,
                source: 'Wikimedia Commons',
              });
            }
          }
          setResults(directResults);
        } else {
          setResults([]);
          setError('No images found.');
        }
      } catch {
        setError('Unable to load images. Please check network connection.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  // Initial trigger
  useEffect(() => {
    if (isOpen) {
      const startQuery = initialQuery || itemName || category || 'microphone';
      setQuery(startQuery);
      handleSearch(startQuery);
      setCustomUrl('');
      setUrlPreviewValid(null);
      setUploadedDataUrl(null);
    }
  }, [isOpen, initialQuery, itemName, category, handleSearch]);

  if (!isOpen) return null;

  // Handle local file upload
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }
    setUploadError('');
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Add / Change Item Image</span>
                {itemName && (
                  <span className="text-xs font-normal text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                    for &ldquo;{itemName}&rdquo;
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Search online across verified public archives, upload a local photo, or paste a link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 px-5 pt-3 bg-slate-900/60 shrink-0 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 transition cursor-pointer ${
              activeTab === 'search'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search Online</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 transition cursor-pointer ${
              activeTab === 'upload'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Device Photo</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 transition cursor-pointer ${
              activeTab === 'url'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Direct Image Link</span>
          </button>
        </div>

        {/* Tab 1: Search Online */}
        {activeTab === 'search' && (
          <div className="flex flex-col flex-1 overflow-hidden p-5 space-y-4">
            {/* Search Input Bar */}
            <div className="space-y-2 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch(query);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search equipment model, brand, or category (e.g. Shure SM58, Sony FX3, Moving Head)..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  <span>Search</span>
                </button>
              </form>

              {/* Preset quick tag chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                <span className="text-slate-400 shrink-0 font-medium mr-0.5">Quick search:</span>
                {PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setQuery(tag);
                      handleSearch(tag);
                    }}
                    className="rounded-lg border border-slate-800 bg-slate-800/70 hover:bg-slate-700 hover:text-sky-300 px-2 py-0.5 text-slate-300 transition whitespace-nowrap cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid / Loading / Empty */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-[260px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                  <Loader2 className="h-7 w-7 animate-spin text-sky-400" />
                  <p className="text-xs">Searching online image repositories...</p>
                </div>
              ) : error && results.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-850/40 p-8 text-center space-y-2">
                  <ImageIcon className="mx-auto h-8 w-8 text-slate-500" />
                  <p className="text-xs text-slate-400">{error}</p>
                  <button
                    type="button"
                    onClick={() => handleSearch('Microphone')}
                    className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" /> Try general equipment library
                  </button>
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {results.map((item) => {
                    const isSelected = currentImage === item.url;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectImage(item.url);
                          onClose();
                        }}
                        className={`group relative flex flex-col overflow-hidden rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'border-sky-500 ring-2 ring-sky-500/40 bg-sky-950/20'
                            : 'border-slate-800 bg-slate-850/80 hover:border-sky-500/60 hover:bg-slate-800 shadow-sm'
                        }`}
                      >
                        {/* Image Preview Container */}
                        <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-900 flex items-center justify-center">
                          <img
                            src={item.thumbUrl}
                            alt={item.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                            onError={(e) => {
                              // If thumb fails, try direct URL
                              if (e.currentTarget.src !== item.url) {
                                e.currentTarget.src = item.url;
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <span className="flex items-center gap-1 rounded-md bg-sky-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">
                              <Check className="h-3 w-3" /> Select Photo
                            </span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 rounded-full bg-sky-500 p-1 text-slate-950 shadow">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        {/* Caption */}
                        <div className="p-2 text-left space-y-0.5">
                          <p className="text-[11px] font-medium text-white truncate group-hover:text-sky-300" title={item.title}>
                            {item.title}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate">
                            {item.source}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Tab 2: Upload Device Photo */}
        {activeTab === 'upload' && (
          <div className="p-6 space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
                isDragging
                  ? 'border-sky-500 bg-sky-950/20'
                  : 'border-slate-700 bg-slate-850/50 hover:border-slate-600 hover:bg-slate-800/50'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                id="equipment-file-input"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="equipment-file-input" className="cursor-pointer space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner">
                  <Upload className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Click to browse or drag & drop equipment photo
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    PNG, JPG, WebP, or SVG up to 10MB
                  </p>
                </div>
              </label>
            </div>

            {uploadError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
                {uploadError}
              </div>
            )}

            {uploadedDataUrl && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={uploadedDataUrl}
                    alt="Preview"
                    className="h-16 w-24 object-cover rounded-lg border border-slate-700 bg-slate-900"
                  />
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-xs">{uploadFileName || 'Uploaded Photo'}</p>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Ready to apply
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedDataUrl(null);
                      setUploadFileName('');
                    }}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectImage(uploadedDataUrl);
                      onClose();
                    }}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                  >
                    Use This Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Direct URL */}
        {activeTab === 'url' && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Image Web Address (URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    setUrlPreviewValid(null);
                  }}
                  placeholder="https://images.unsplash.com/photo-... or https://example.com/item.jpg"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Paste any publicly accessible HTTPS image link from manufacturers, retailers, or photo platforms.
              </p>
            </div>

            {customUrl && (
              <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-850 p-4">
                <p className="text-xs font-semibold text-slate-300">Image Preview:</p>
                <div className="relative aspect-video max-h-56 w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <img
                    src={customUrl}
                    alt="Preview"
                    className="h-full w-full object-contain"
                    onLoad={() => setUrlPreviewValid(true)}
                    onError={() => setUrlPreviewValid(false)}
                  />
                  {urlPreviewValid === false && (
                    <div className="absolute inset-0 bg-rose-950/80 flex flex-col items-center justify-center text-rose-300 p-4 text-center">
                      <X className="h-6 w-6 mb-1" />
                      <p className="text-xs font-semibold">Could not load image from this URL.</p>
                      <p className="text-[11px] text-rose-400">Verify the link allows direct image embedding.</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCustomUrl('')}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    disabled={urlPreviewValid === false}
                    onClick={() => {
                      if (customUrl.trim()) {
                        onSelectImage(customUrl.trim());
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-1.5 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Apply Image URL</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-5 py-3 shrink-0 text-xs">
          <div className="text-slate-400 text-[11px]">
            {currentImage ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Check className="h-3.5 w-3.5" /> Current image assigned
              </span>
            ) : (
              <span>No image currently assigned to this asset</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentImage && (
              <button
                type="button"
                onClick={() => {
                  onSelectImage('');
                  onClose();
                }}
                className="rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 px-3 py-1.5 transition cursor-pointer"
              >
                Remove Current Photo
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-slate-300 hover:bg-slate-750 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
