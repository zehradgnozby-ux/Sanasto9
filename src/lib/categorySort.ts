import { sortByAlphabet } from '@/lib/wordSort';
import type { Category } from '@/lib/vocabulary';

export type CategorySortMode = 'manual' | 'alphabetical' | 'alphabetical_desc';

export const CATEGORY_SORT_KEY = 'sanasto.categorySort';

export const CATEGORY_SORT_OPTIONS: { value: CategorySortMode; label: string }[] = [
  { value: 'manual', label: 'Varsayılan sıralama' },
  { value: 'alphabetical', label: "A'dan Z'ye (Alfabetik)" },
  { value: 'alphabetical_desc', label: "Z'den A'ya (Ters Alfabetik)" },
];

export function orderCategories(categories: Category[], mode: CategorySortMode): Category[] {
  if (mode === 'alphabetical') return sortByAlphabet(categories, (category) => category.name, 'turkish');
  if (mode === 'alphabetical_desc') {
    return [...categories].sort((a, b) => b.name.localeCompare(a.name, 'tr-TR'));
  }
  return [...categories].sort((a, b) => a.position - b.position);
}
