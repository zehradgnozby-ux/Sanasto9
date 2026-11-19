import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import WordImage from '@/components/WordImage';
import { validateImageFile } from '@/lib/imageUpload';
import type { ImageSource } from '@/lib/vocabulary';

export interface ImageDraft {
  file: File | null;
  url: string | null;
  source: ImageSource | null;
}

interface ImageFieldProps {
  value: ImageDraft;
  onChange: (value: ImageDraft) => void;
}

export default function ImageField({ value, onChange }: ImageFieldProps) {
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value.file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value.file]);

  const hasImage = Boolean(value.file || value.url);
  const shownSrc = value.file ? previewUrl : value.url;

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    onChange({ file, url: null, source: 'upload' });
  };

  const removeImage = () => {
    setError(null);
    onChange({ file: null, url: null, source: null });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-slate-200 sm:h-40 sm:w-40 sm:shrink-0">
          {hasImage ? (
            <WordImage src={shownSrc} alt="Kelime görseli" className="h-full w-full" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400">
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm">Görsel yok</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                handleFile(event.target.files?.[0]);
                event.target.value = '';
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 px-4 py-4 text-sm font-semibold text-slate-600 transition hover:border-blue-400 hover:text-blue-700"
            >
              <Upload className="mr-2 inline h-4 w-4" />
              Bilgisayardan veya telefondan görsel seç
            </button>
            <p className="mt-2 text-xs text-slate-500">PNG, JPG, JPEG veya WEBP. En fazla 5 MB.</p>
          </div>

          {hasImage && (
            <button
              type="button"
              onClick={removeImage}
              className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 transition hover:text-rose-700"
            >
              <Trash2 className="h-4 w-4" /> Görseli kaldır
            </button>
          )}
        </div>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
