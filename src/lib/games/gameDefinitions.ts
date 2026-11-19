import {
  Eye,
  Headphones,
  Image,
  Languages,
  Layers,
  Link,
  ListChecks,
  Type,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import type { GameId } from '@/lib/games/types';

export interface GameDefinition {
  id: GameId;
  title: string;
  description: string;
  icon: LucideIcon;
  requiresImage: boolean;
  optionCount: number | null;
  optionsNeedImage: boolean;
  isListening?: boolean;
  lockedOrder?: 'fi_tr' | 'tr_fi' | 'fi_only' | 'tr_only';
}

export const GAME_DEFINITIONS: GameDefinition[] = [
  {
    id: 'flashcards',
    title: '1. Kelime Kartları',
    description: 'Kelimeleri kart kart gözden geçirin, bildiklerinizi işaretleyin.',
    icon: Layers,
    requiresImage: false,
    optionCount: null,
    optionsNeedImage: false,
  },
  {
    id: 'choose-word',
    title: '2. Doğru Kelimeyi Seç',
    description: 'Görseli ve Türkçe anlamı görün, doğru Fince kelimeyi seçin.',
    icon: ListChecks,
    requiresImage: true,
    optionCount: 2,
    optionsNeedImage: false,
  },
  {
    id: 'find-image',
    title: '3. Türkcesini Bul',
    description: 'Fince kelimeye uyan Türkçe anlamı, kartları çevirerek bulun.',
    icon: Image,
    requiresImage: true,
    optionCount: 4,
    optionsNeedImage: true,
  },
  {
    id: 'turkish-find-image',
    title: '4. Fincesini Bul',
    description: 'Türkçe kelimeyi görün ve ona uyan Fince kelimeli resmi seçin.',
    icon: Languages,
    requiresImage: true,
    optionCount: 4,
    optionsNeedImage: true,
  },
  {
    id: 'read-choose',
    title: '5. Oku ve Resmi Bul',
    description: 'Fince kelimeyi okuyun, dört görselden doğrusunu bulun.',
    icon: Eye,
    requiresImage: true,
    optionCount: 4,
    optionsNeedImage: true,
  },
  {
    id: 'listen-choose',
    title: '6. Dinle ve Resmi Bul',
    description: 'Fince kelimeyi dinleyin, dört görselden doğrusunu bulun.',
    icon: Headphones,
    requiresImage: true,
    optionCount: 4,
    optionsNeedImage: true,
  },
  {
    id: 'matching',
    title: '7. Fince - Türkçe Eşleştirme',
    description: 'Fince ve Türkçe kelime çiftlerini doğru şekilde eşleştirin.',
    icon: Link,
    requiresImage: false,
    optionCount: null,
    optionsNeedImage: false,
  },
  {
    id: 'image-matching',
    title: '8. Kelime - Resim Eşleştirme',
    description: 'Görseller ve Fince kelimeleri doğru şekilde eşleştirin.',
    icon: Image,
    requiresImage: true,
    optionCount: null,
    optionsNeedImage: true,
  },
  {
    id: 'type-word',
    title: '9. Kelimenin Fincesini Yaz',
    description: 'Türkçe anlamdan yararlanarak Fince kelimeyi yazın.',
    icon: Type,
    requiresImage: false,
    optionCount: null,
    optionsNeedImage: false,
  },
  {
    id: 'image-type',
    title: '10. Resmin Fincesini Yaz',
    description: 'Yalnızca görseli görün, Fince karşılığını yazın.',
    icon: Eye,
    requiresImage: true,
    optionCount: null,
    optionsNeedImage: false,
  },
  {
    id: 'listen-fi-tr',
    title: '11. Fince - Türkçe Dinle',
    description: 'Kelimeleri önce Fince, sonra Türkçe olarak dinleyin.',
    icon: Volume2,
    requiresImage: false,
    optionCount: null,
    optionsNeedImage: false,
    isListening: true,
    lockedOrder: 'fi_tr',
  },
  {
    id: 'listen-tr-fi',
    title: '12. Türkçe - Fince Dinle',
    description: 'Kelimeleri önce Türkçe, sonra Fince olarak dinleyin.',
    icon: Volume2,
    requiresImage: false,
    optionCount: null,
    optionsNeedImage: false,
    isListening: true,
    lockedOrder: 'tr_fi',
  },
];

export function getGameDefinition(id: GameId): GameDefinition {
  const definition = GAME_DEFINITIONS.find((item) => item.id === id);
  if (!definition) throw new Error(`Bilinmeyen oyun: ${id}`);
  return definition;
}
