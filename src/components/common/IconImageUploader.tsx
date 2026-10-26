import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles, Check } from 'lucide-react';

interface IconImageUploaderProps {
  value: string;
  onChange: (dataUrl: string) => void;
  appName?: string;
}

const PRESET_ICONS = [
  {
    name: 'Blue Rocket',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%231d4ed8"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23g)"/><path d="M50 20 C65 20 75 35 75 55 L70 65 L50 55 L30 65 L25 55 C25 35 35 20 50 20 Z" fill="white"/><circle cx="50" cy="40" r="7" fill="%231d4ed8"/></svg>`,
  },
  {
    name: 'Purple Shield',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%236d28d9"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23g)"/><path d="M50 22 L75 32 C75 58 50 78 50 78 C50 78 25 58 25 32 Z" fill="white"/><path d="M44 48 L48 52 L58 40" stroke="%236d28d9" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  },
  {
    name: 'Emerald Pulse',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%23047857"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23g)"/><polyline points="22,52 38,52 45,30 55,70 62,52 78,52" fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    name: 'Amber Bolt',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23d97706"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23g)"/><polygon points="54,20 30,52 48,52 44,80 70,44 52,44" fill="white"/></svg>`,
  },
  {
    name: 'Cyan Cloud',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="100%" stop-color="%230891b2"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23g)"/><path d="M35 62 A12 12 0 0 1 32 38 A18 18 0 0 1 64 34 A14 14 0 0 1 72 62 Z" fill="white"/></svg>`,
  },
  {
    name: 'Rose Gem',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23f43f5e"/><stop offset="100%" stop-color="%23be123c"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23g)"/><polygon points="50,22 75,40 50,78 25,40" fill="white"/><polygon points="50,22 65,40 50,55 35,40" fill="%23be123c" opacity="0.3"/></svg>`,
  },
];

export const IconImageUploader: React.FC<IconImageUploaderProps> = ({ value, onChange, appName }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (PNG, JPG, WebP, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5 MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        {/* Live Icon Preview */}
        <div className="relative group shrink-0">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 shadow-xs flex items-center justify-center">
            {value ? (
              <img
                src={value}
                alt="App Icon Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-neutral-400" />
            )}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              title="Remove icon"
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs opacity-80 hover:opacity-100 shadow-sm transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Upload Zone */}
        <div className="flex-1 min-w-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-800/40'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-neutral-800 dark:text-neutral-200">
              <Upload className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>{value ? 'Upload replacement icon' : 'Upload App Icon image'}</span>
            </div>
            <span className="text-[11px] text-neutral-400 block mt-0.5">
              PNG, JPG, WebP, or SVG (square recommended, up to 5 MB)
            </span>
          </div>

          {errorMsg && (
            <span className="text-[11px] text-red-600 dark:text-red-400 mt-1 block">
              {errorMsg}
            </span>
          )}
        </div>
      </div>

      {/* Preset Icons Selection */}
      <div className="pt-1">
        <span className="text-[11px] text-neutral-500 block mb-1.5 font-medium">
          Or select a styled preset icon:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_ICONS.map((preset) => {
            const isSelected = value === preset.svg;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => onChange(preset.svg)}
                title={preset.name}
                className={`relative h-9 w-9 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                    : 'border-neutral-200 dark:border-neutral-700 hover:opacity-90'
                }`}
              >
                <img src={preset.svg} alt={preset.name} className="w-full h-full object-cover" />
                {isSelected && (
                  <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center text-white">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
