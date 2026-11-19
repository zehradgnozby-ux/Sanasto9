import { Search, X } from 'lucide-react';
import CategoryFilterField from '@/components/CategoryFilterField';
import LearningStatusField from '@/components/LearningStatusField';
import { useLibrary } from '@/contexts/LibraryContext';
import { EMPTY_WORD_FILTERS, type WordFilters } from '@/lib/wordFilters';
import type { LearningStatus } from '@/lib/vocabulary';

interface WordFilterBarProps {
  filters: WordFilters;
  onChange: (filters: WordFilters) => void;
  hideCategoryFilter?: boolean;
}

export default function WordFilterBar({ filters, onChange, hideCategoryFilter = false }: WordFilterBarProps) {
  const { categories, words } = useLibrary();
  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_WORD_FILTERS);

  const update = (patch: Partial<WordFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => update({ search: event.target.value })}
          placeholder="Fince veya Türkçe kelime ara"
          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {!hideCategoryFilter && (
          <CategoryFilterField
            label="Kategoriler"
            categories={categories}
            words={words}
            selected={filters.categoryIds}
            onChange={(categoryIds) => update({ categoryIds })}
          />
        )}
        <LearningStatusField
          statuses={filters.statuses}
          onChange={(statuses) => update({ statuses: statuses as LearningStatus[] })}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={filters.favoritesOnly}
              onChange={(event) => update({ favoritesOnly: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
            />
            Sadece favoriler
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={filters.noImage}
              onChange={(event) => update({ noImage: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
            />
            Sadece görselsiz
          </label>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_WORD_FILTERS })}
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
          >
            <X className="h-4 w-4" /> Filtreleri temizle
          </button>
        )}
      </div>
    </div>
  );
}
