import { useEffect, useMemo, useState } from 'react';
import GameFeedback from '@/components/games/GameFeedback';
import WordImage from '@/components/WordImage';
import { useSpeaker } from '@/hooks/useSpeaker';
import { type QuestionProps } from '@/components/games/questions/questionShared';
import { shuffle } from '@/lib/random';
import { toWordResult, type WordResult } from '@/lib/games/types';
import type { Word } from '@/lib/vocabulary';

interface ImageMatchingQuestionProps extends QuestionProps {
  words: Word[];
}

const WRONG_FLASH_MS = 700;

export default function ImageMatchingQuestion({ words, onDone, isSaving }: ImageMatchingQuestionProps) {
  const speak = useSpeaker();
  const imageOrder = useMemo(() => shuffle(words), [words]);
  const wordOrder = useMemo(() => shuffle(words), [words]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<{ imageId: string; wordId: string } | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());

  const visibleImages = imageOrder.filter((w) => !matchedIds.has(w.id));
  const visibleWords = wordOrder.filter((w) => !matchedIds.has(w.id));

  useEffect(() => {
    if (!wrongPair) return;
    const timer = window.setTimeout(() => {
      setSelectedImageId(null);
      setSelectedWordId(null);
      setWrongPair(null);
    }, WRONG_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [wrongPair]);

  const evaluate = (imageId: string, wordId: string) => {
    if (imageId === wordId) {
      const word = words.find((item) => item.id === imageId);
      setMatchedIds((previous) => new Set(previous).add(imageId));
      setSelectedImageId(null);
      setSelectedWordId(null);
      if (word) void speak(word.finnish, 'fi');
      return;
    }
    setWrongIds((previous) => new Set(previous).add(imageId));
    setWrongPair({ imageId, wordId });
  };

  const pickImage = (id: string) => {
    if (matchedIds.has(id) || wrongPair) return;
    setSelectedImageId(id);
    if (selectedWordId) evaluate(id, selectedWordId);
  };

  const pickWord = (id: string) => {
    if (matchedIds.has(id) || wrongPair) return;
    setSelectedWordId(id);
    if (selectedImageId) evaluate(selectedImageId, id);
  };

  const isDone = matchedIds.size === words.length;
  const results: WordResult[] = words.map((word) => toWordResult(word, !wrongIds.has(word.id)));
  const allCorrect = wrongIds.size === 0;

  return (
    <section className="flex min-h-full flex-1 flex-col gap-4">
      <div className="grid flex-1 grid-cols-[1fr_1fr] grid-rows-5 gap-2 sm:gap-4">
        <div className="grid grid-rows-5 gap-1.5 sm:gap-2">
          {visibleImages.map((word) => (
            <button
              key={`img-${word.id}`}
              type="button"
              onClick={() => pickImage(word.id)}
              className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                wrongPair?.imageId === word.id
                  ? 'border-rose-500 animate-pulse'
                  : selectedImageId === word.id
                    ? 'border-blue-600 ring-2 ring-blue-100'
                    : 'border-slate-200 hover:border-blue-400 hover:shadow-sm'
              }`}
            >
              <WordImage
                src={word.image_url}
                alt={word.finnish}
                fit="contain"
                className="h-full w-full bg-slate-50"
              />
            </button>
          ))}
        </div>
        <div className="grid grid-rows-5 gap-1.5 sm:gap-2">
          {visibleWords.map((word) => (
            <button
              key={`word-${word.id}`}
              type="button"
              onClick={() => pickWord(word.id)}
              className={`h-full w-full rounded-lg border-2 px-2 py-2 text-left text-xs font-semibold transition-all duration-300 sm:text-sm ${
                wrongPair?.wordId === word.id
                  ? 'border-rose-500 bg-rose-50 text-rose-800 animate-pulse'
                  : selectedWordId === word.id
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white text-slate-900 hover:border-blue-400 hover:shadow-sm'
              }`}
            >
              {word.finnish}
            </button>
          ))}
        </div>
      </div>

      {isDone && (
        <GameFeedback
          correct={allCorrect}
          title={allCorrect ? 'Tüm eşleşmeler doğru!' : 'Tüm eşleşmeler tamamlandı'}
          detail={allCorrect ? undefined : `${results.filter((result) => result.correct).length} / ${words.length} kelimeyi ilk denemede eşleştirdiniz.`}
          isSaving={isSaving}
          onContinue={() => onDone(results)}
        />
      )}
    </section>
  );
}
