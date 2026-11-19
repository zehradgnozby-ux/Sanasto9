import type { Category, Word } from '@/lib/vocabulary';

export interface LearningProgress {
  learned: number;
  total: number;
}

export interface CategoryOption {
  value: string;
  label: string;
  progress: LearningProgress;
}

export const FAVORITES_OPTION_ID = '__favorites__';

export function getLearningProgress(words: Word[]): LearningProgress {
  return {
    learned: words.filter((word) => word.learning_status === 'learned').length,
    total: words.length,
  };
}

function matchesCategoryFilter(word: Pick<Word, 'category_id' | 'is_favorite'>, categoryIds: string[]): boolean {
  if (categoryIds.length === 0) return true;
  return categoryIds.some((id) =>
    id === FAVORITES_OPTION_ID ? word.is_favorite : word.category_id === id,
  );
}

export function getSelectionProgress(words: Word[], categoryIds: string[]): LearningProgress {
  if (categoryIds.length === 0) return getLearningProgress(words);
  return getLearningProgress(words.filter((word) => matchesCategoryFilter(word, categoryIds)));
}

export function getCategoryOptions(categories: Category[], words: Word[]): CategoryOption[] {
  const wordsByCategory = new Map<string, Word[]>();
  for (const word of words) {
    if (!word.category_id) continue;
    const list = wordsByCategory.get(word.category_id) ?? [];
    list.push(word);
    wordsByCategory.set(word.category_id, list);
  }
  const favoriteWords = words.filter((word) => word.is_favorite);
  return [
    {
      value: FAVORITES_OPTION_ID,
      label: 'Favoriler',
      progress: getLearningProgress(favoriteWords),
    },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
      progress: getLearningProgress(wordsByCategory.get(category.id) ?? []),
    })),
  ];
}
