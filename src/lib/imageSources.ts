import type { ImageSource } from '@/lib/vocabulary';

export type PickerSourceId = 'auto_ai' | 'google_ai_mode' | 'upload';

export interface ImageCandidate {
  id: string;
  title: string;
  previewUrl: string;
  imageUrl: string;
  credit: string;
  source: ImageSource;
}

export interface PickerSource {
  id: PickerSourceId;
  label: string;
}

export const PICKER_SOURCES: PickerSource[] = [
  { id: 'auto_ai', label: 'Otomatik görsel ata' },
  { id: 'google_ai_mode', label: 'Google AI Mode' },
  { id: 'upload', label: 'Telefondan veya bilgisayardan seç' },
];

export function buildImagePrompt(finnish: string, turkish: string): string {
  const meaning = turkish.trim();
  const capitalized = meaning.charAt(0).toLocaleUpperCase('tr-TR') + meaning.slice(1);
  return [
    `${capitalized} (Fince: ${finnish.trim()}) kelimesini temsil eden, gerçekçi, yüksek kaliteli, eğitim amaçlı bir görsel oluştur.`,
    'Görselde bu kavram açıkça görünsün.',
    'Görselin üzerinde hiçbir yazı, harf, kelime veya filigran bulunmasın.',
    '1:1 aspect ratio, square format — kare formatında olsun.',
    'Bir Fince kelime öğrenme uygulamasında kullanılmaya uygun, sade ve anlaşılır bir görsel olsun.',
  ].join(' ');
}
