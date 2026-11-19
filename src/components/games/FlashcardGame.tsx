import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Heart, Pencil, Trophy } from 'lucide-react';
import GameEndActions from '@/components/games/GameEndActions';
import FlashcardStatusPicker from '@/components/games/FlashcardStatusPicker';
import SpeakButton from '@/components/SpeakButton';
import WordFormModal from '@/components/WordFormModal';
import WordImage from '@/components/WordImage';
import { useLibrary } from '@/contexts/LibraryContext';
import { useSpeaker } from '@/hooks/useSpeaker';
import { stopSpeech } from '@/lib/speech';
import { describeError } from '@/lib/errors';
import { type LearningStatus, type Word } from '@/lib/vocabulary';

interface FlashcardGameProps {
  title: string;
  words: Word[];
  onExit: () => void;
  onRestart: () => void;
  onNext?: () => void;
}

export default function FlashcardGame({ title, words, onExit, onRestart, onNext }: FlashcardGameProps) {
  const speak = useSpeaker();
  const { words: libraryWords, updateWordStatus, toggleFavorite } = useLibrary();
  const [index, setIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const snapshot = words[index];
  const word = libraryWords.find((item) => item.id === snapshot.id) ?? snapshot;
  const isLast = index === words.length - 1;

  useEffect(() => {
    if (isFinished) return;
    void speak(word.finnish, 'fi');
    return () => stopSpeech();
  }, [word.id, word.finnish, speak, isFinished]);

  useEffect(() => {
    setStatusError(null);
  }, [word.id]);

  const handleStatusChange = async (status: LearningStatus) => {
    if (status === word.learning_status || isSavingStatus) return;
    setIsSavingStatus(true);
    setStatusError(null);
    try {
      await updateWordStatus(word.id, status);
    } catch {
      setStatusError('Durum kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleFavorite = async () => {
    setStatusError(null);
    try {
      await toggleFavorite(word.id, !word.is_favorite);
    } catch (err) {
      setStatusError(describeError(err));
    }
  };

  if (isFinished) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-7rem)] max-w-2xl flex-col justify-center gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Trophy className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-medium text-slate-500">Kelime kartları tamamlandı</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">{words.length} kart</p>
        </div>
        <GameEndActions onRestart={onRestart} onNext={onNext} onExit={onExit} />
      </div>
    );
  }

  const progress = Math.round(((index + 1) / words.length) * 100);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-7rem)] max-w-2xl flex-col gap-4">
      <div className="flex flex-1 flex-col justify-center gap-4">
      <article key={word.id} className="animate-modal-in overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
        <WordImage src={word.image_url} alt="" fit="cover" className="aspect-square w-full" />
        <div className="space-y-3 p-5 text-center sm:p-6">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleFavorite}
              aria-label={word.is_favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
              aria-pressed={word.is_favorite}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                word.is_favorite
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-rose-600'
              }`}
            >
              <Heart className={`h-4.5 w-4.5 ${word.is_favorite ? 'fill-rose-600' : ''}`} aria-hidden="true" />
            </button>
            <FlashcardStatusPicker status={word.learning_status} disabled={isSavingStatus} onSelect={handleStatusChange} />
            <div>
              <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{word.finnish}</p>
              <p className="text-lg text-slate-600">{word.turkish}</p>
            </div>
            <SpeakButton text={word.finnish} language="fi" label="Fince telaffuz" />
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              aria-label="Kelimeyi düzenle"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-blue-700"
            >
              <Pencil className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          </div>
          {statusError && (
            <p role="alert" className="text-sm font-medium text-red-700">{statusError}</p>
          )}
        </div>
      </article>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIndex((current) => Math.max(0, current - 1))}
          disabled={index === 0}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Önceki
        </button>
        <button
          type="button"
          onClick={() => (isLast ? setIsFinished(true) : setIndex((current) => current + 1))}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          Sonraki
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      </div>

      {isEditing && <WordFormModal word={word} onClose={() => setIsEditing(false)} />}

      <div className="sticky bottom-0 -mx-4 space-y-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={words.length}
          aria-valuenow={index + 1}
        >
          <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Oyundan çık
          </button>
          <p className="min-w-0 truncate text-sm font-bold text-slate-900">{title}</p>
          <p className="shrink-0 text-sm font-semibold text-slate-600">
            {index + 1} / {words.length}
          </p>
        </div>
      </div>
    </div>
  );
}
