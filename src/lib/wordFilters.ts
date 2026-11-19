import { foldForSearch, type LearningStatus, type Word } from '@/lib/vocabulary';

export interface WordFilters {
  search: string;
  categoryIds: string[];
  statuses: LearningStatus[];
  favoritesOnly: boolean;
  noImage: boolean;
}

export const EMPTY_WORD_FILTERS: WordFilters = {
  search: '',
  categoryIds: [],
  statuses: [],
  favoritesOnly: false,
  noImage: false,
};


export const FAVORITES_OPTION_ID = '__favorites__';

export function matchesCategories(word: Pick<Word, 'category_id' | 'is_favorite'>, categoryIds: string[]): boolean {
  if (categoryIds.length === 0) return true;
  return categoryIds.some((id) =>
    id === FAVORITES_OPTION_ID ? word.is_favorite : word.category_id === id,
  );
}

export const ALL_LEARNING_STATUSES: LearningStatus[] = ['learned', 'learning', 'not_studied', 'review'];

export interface WordSelectionFilters {
  categoryIds: string[];
  learningStatuses: LearningStatus[];
  favoritesOnly: boolean;
}

export function matchesSelectionFilters(word: Word, filters: WordSelectionFilters): boolean {
  if (!matchesCategories(word, filters.categoryIds)) return false;
  if (filters.favoritesOnly && !word.is_favorite) return false;
  return filters.learningStatuses.includes(word.learning_status);
}

export function filterWords(words: Word[], filters: WordFilters): Word[] {
  const query = foldForSearch(filters.search);
  return words.filter((word) => {
    if (query && !foldForSearch(word.finnish).includes(query) && !foldForSearch(word.turkish).includes(query)) {
      return false;
    }
    if (!matchesCategories(word, filters.categoryIds)) return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(word.learning_status)) return false;
    if (filters.noImage && word.image_url) return false;
    if (filters.favoritesOnly && !word.is_favorite) return false;
    return true;
  });
}
