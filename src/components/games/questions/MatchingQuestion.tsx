import { useEffect, useMemo, useState } from 'react';
import GameFeedback from '@/components/games/GameFeedback';
import WordImage from '@/components/WordImage';
import { useSpeaker } from '@/hooks/useSpeaker';
import { type QuestionProps } from '@/components/games/questions/questionShared';
import { shuffle } from '@/lib/random';
import { toWordResult, type WordResult } from '@/lib/games/types';
import type { Word } from '@/lib/vocabulary';

interface MatchingQuestionProps extends QuestionProps {
  words: Word[];
}

interface Pair {
  finnishId: string;
  turkishId: string;
}

const WRONG_FLASH_MS = 700;

export default function MatchingQuestion({ words, onDone, isSaving }: MatchingQuestionProps) {
  const speak = useSpeaker();
  const leftOrder = useMemo(() => shuffle(words), [words]);
  const rightOrder = useMemo(() => shuffle(words), [words]);
  const [selectedFinnishId, setSelectedFinnishId] = useState<string | null>(null);
  const [selectedTurkishId, setSelectedTurkishId] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<Pair | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  const [lastMatch, setLastMatch] = useState<Word | null>(null);

  useEffect(() => {
    if (!wrongPair) return;
    const timer = window.setTimeout(() => {
      setSelectedFinnishId(null);
      setSelectedTurkishId(null);
      setWrongPair(null);
    }, WRONG_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [wrongPair]);

  const evaluate = (finnishId: string, turkishId: string) => {
    if (finnishId === turkishId) {
      const word = words.find((item) => item.id === finnishId);
      setMatchedIds((previous) => new Set(previous).add(finnishId));
      setLastMatch(word ?? null);
      setSelectedFinnishId(null);
      setSelectedTurkishId(null);
      if (word) void speak(word.finnish, 'fi');
      return;
    }
    setWrongIds((previous) => new Set(previous).add(finnishId));
    setWrongPair({ finnishId, turkishId });
  };

  const pickFinnish = (id: string) => {
    if (matchedIds.has(id) || wrongPair) return;
    setSelectedFinnishId(id);
    if (selectedTurkishId) evaluate(id, selectedTurkishId);
  };

  const pickTurkish = (id: string) => {
    if (matchedIds.has(id) || wrongPair) return;
    setSelectedTurkishId(id);
    if (selectedFinnishId) evaluate(selectedFinnishId, id);
  };

  const isDone = matchedIds.size === words.length;
  const results: WordResult[] = words.map((word) => toWordResult(word, !wrongIds.has(word.id)));
  const allCorrect = wrongIds.size === 0;

  return (
    <section className="flex min-h-full flex-1 flex-col gap-4">
      <div className="grid flex-1 grid-cols-2 grid-rows-8 gap-2 sm:gap-4">
        <div className="grid grid-rows-8 gap-1.5 sm:gap-2">
          {leftOrder.map((word) => (
            <MatchButton
              key={`fi-${word.id}`}
              label={word.finnish}
              matched={matchedIds.has(word.id)}
              selected={selectedFinnishId === word.id}
              wrong={wrongPair?.finnishId === word.id}
              onClick={() => pickFinnish(word.id)}
            />
          ))}
        </div>
        <div className="grid grid-rows-8 gap-1.5 sm:gap-2">
          {rightOrder.map((word) => (
            <MatchButton
              key={`tr-${word.id}`}
              label={word.turkish}
              matched={matchedIds.has(word.id)}
              selected={selectedTurkishId === word.id}
              wrong={wrongPair?.turkishId === word.id}
              onClick={() => pickTurkish(word.id)}
            />
          ))}
        </div>
      </div>

      {lastMatch && (
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 animate-modal-in">
          <WordImage src={lastMatch.image_url} alt="" className="h-16 w-20 shrink-0 rounded-xl" />
          <div>
            <p className="font-bold text-emerald-900">{lastMatch.finnish}</p>
            <p className="text-sm text-emerald-800">{lastMatch.turkish}</p>
          </div>
        </div>
      )}

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

function MatchButton({
  label,
  matched,
  selected,
  wrong,
  onClick,
}: {
  label: string;
  matched: boolean;
  selected: boolean;
  wrong: boolean;
  onClick: () => void;
}) {
  const stateClass = matched
    ? 'border-emerald-400 bg-emerald-50 text-emerald-800 opacity-70'
    : wrong
      ? 'border-rose-500 bg-rose-50 text-rose-800 animate-pulse'
      : selected
        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-4 ring-blue-100'
        : 'border-slate-200 bg-white text-slate-900 hover:border-blue-400 hover:shadow-sm';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={matched}
      className={`h-full w-full rounded-xl border-2 px-2.5 py-1.5 text-left text-sm font-semibold leading-5 transition sm:px-3 sm:py-2 sm:text-base ${stateClass}`}
    >
      {label}
    </button>
  );
}
