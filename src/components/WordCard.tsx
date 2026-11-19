import { useState } from 'react';
import { ChevronDown, Heart, ImageOff, Pencil, Trash2 } from 'lucide-react';
import FlashcardStatusPicker from '@/components/games/FlashcardStatusPicker';
import SpeakButton from '@/components/SpeakButton';
import WordImage from '@/components/WordImage';
import { useLibrary } from '@/contexts/LibraryContext';
import { describeError } from '@/lib/errors';
import type { LearningStatus, Word } from '@/lib/vocabulary';

interface WordCardProps {
  word: Word;
  onEdit: (word: Word) => void;
  onDelete: (word: Word) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function WordCard({ word, onEdit, onDelete, isExpanded, onToggle }: WordCardProps) {
  const { categories, toggleFavorite, updateWordStatus } = useLibrary();
  const [error, setError] = useState<string | null>(null);

  const categoryName = categories.find((item) => item.id === word.category_id)?.name;
  const hasImage = Boolean(word.image_url);

  const handleFavorite = async () => {
    setError(null);
    try {
      await toggleFavorite(word.id, !word.is_favorite);
    } catch (err) {
      setError(describeError(err));
    }
  };

  const handleStatusChange = async (status: LearningStatus) => {
    setError(null);
    try {
      await updateWordStatus(word.id, status);
    } catch (err) {
      setError(describeError(err));
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToggle(); } }}
        aria-expanded={isExpanded}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left transition hover:bg-slate-50 sm:p-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-bold text-slate-900">{word.finnish}</h3>
            <SpeakButton text={word.finnish} language="fi" label="Fince telaffuzu dinle" />
          </div>
          <p className="truncate text-sm text-slate-600">{word.turkish}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {categoryName && (
            <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 sm:inline">
              {categoryName}
            </span>
          )}
          <span className="flex shrink-0 items-center gap-1">
            <span onClick={(event) => event.stopPropagation()}>
              <FlashcardStatusPicker status={word.learning_status} disabled={false} onSelect={handleStatusChange} />
            </span>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); handleFavorite(); }}
              aria-label={word.is_favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
              aria-pressed={word.is_favorite}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
                word.is_favorite ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'text-slate-400 hover:bg-slate-100 hover:text-rose-600'
              }`}
            >
              <Heart className={`h-4 w-4 ${word.is_favorite ? 'fill-rose-600' : ''}`} />
            </button>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); onEdit(word); }}
              aria-label="Kelimeyi düzenle"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-blue-700"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); onDelete(word); }}
              aria-label="Kelimeyi sil"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-slate-400 transition ${isExpanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 p-4 sm:p-5">
          <div className="flex gap-4">
            <WordImage
              src={word.image_url}
              alt={word.finnish}
              className="h-20 w-20 shrink-0 rounded-xl sm:h-24 sm:w-24"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-bold text-slate-900">{word.finnish}</h3>
                  <p className="truncate text-base text-slate-600">{word.turkish}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                {categoryName && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{categoryName}</span>
                )}
                {!hasImage && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-orange-900">
                    <ImageOff className="h-3.5 w-3.5" /> Taslak, görsel yok
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
                <span className="text-xs text-slate-500">
                  Doğru {word.correct_count} · Yanlış {word.wrong_count}
                </span>
              </div>
            </div>
          </div>

          {(word.example_fi || word.example_tr || word.grammar_note) && (
            <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
              {word.example_fi && <p className="italic text-slate-800">{word.example_fi}</p>}
              {word.example_tr && <p>{word.example_tr}</p>}
              {word.grammar_note && <p className="text-slate-500">Not: {word.grammar_note}</p>}
            </div>
          )}

          {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </div>
      )}
    </article>
  );
}
