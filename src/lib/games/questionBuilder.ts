import { normalizeAnswer } from '@/lib/games/answerCheck';
import { hasImage } from '@/lib/games/gameConfig';
import type { QuizGameId, QuizQuestion } from '@/lib/games/types';
import { shuffle } from '@/lib/random';
import type { Word } from '@/lib/vocabulary';

const MATCHING_BATCH_SIZE = 8;
const IMAGE_MATCHING_BATCH_SIZE = 5;
const CHOICE_DISTRACTOR_COUNT = 3;
const TWO_CHOICE_DISTRACTOR_COUNT = 1;

type SingleQuestionKind = Exclude<QuizQuestion['kind'], 'matching' | 'image-matching'>;

const SINGLE_KIND_BY_GAME: Record<Exclude<QuizGameId, 'matching' | 'image-matching'>, SingleQuestionKind> = {
  'choose-word': 'image-choice',
  'listen-choose': 'listen-choice',
  'read-choose': 'read-choice',
  'find-image': 'flip-image',
  'type-word': 'type-word',
  'image-type': 'image-type',
  'turkish-find-image': 'turkish-image-choice',
};

export function buildQuestions(gameId: QuizGameId, words: Word[], library: Word[]): QuizQuestion[] {
  if (gameId === 'matching') {
    const questions: QuizQuestion[] = [];
    for (let start = 0; start < words.length; start += MATCHING_BATCH_SIZE) {
      questions.push({ kind: 'matching', words: words.slice(start, start + MATCHING_BATCH_SIZE) });
    }
    return questions;
  }

  if (gameId === 'image-matching') {
    const questions: QuizQuestion[] = [];
    for (let start = 0; start < words.length; start += IMAGE_MATCHING_BATCH_SIZE) {
      questions.push({ kind: 'image-matching', words: words.slice(start, start + IMAGE_MATCHING_BATCH_SIZE) });
    }
    return questions;
  }

  const kind = SINGLE_KIND_BY_GAME[gameId];
  const distractorCount = gameId === 'choose-word' ? TWO_CHOICE_DISTRACTOR_COUNT : CHOICE_DISTRACTOR_COUNT;
  return words.map((word) => createSingleQuestion(kind, word, library, distractorCount));
}

function createSingleQuestion(kind: SingleQuestionKind, word: Word, library: Word[], distractorCount: number): QuizQuestion {
  switch (kind) {
    case 'image-choice':
      return { kind, word, options: buildOptions(word, library, distractorCount) };
    case 'read-choice':
    case 'listen-choice':
    case 'flip-image':
    case 'turkish-image-choice':
      return { kind, word, options: buildOptions(word, library.filter(hasImage), distractorCount) };
    case 'type-word':
    case 'image-type':
      return { kind, word };
  }
}

function buildOptions(word: Word, candidates: Word[], distractorCount: number): Word[] {
  const finnish = normalizeAnswer(word.finnish);
  const turkish = normalizeAnswer(word.turkish);
  const distractors = shuffle(
    candidates.filter(
      (candidate) =>
        candidate.id !== word.id &&
        normalizeAnswer(candidate.finnish) !== finnish &&
        normalizeAnswer(candidate.turkish) !== turkish,
    ),
  ).slice(0, distractorCount);
  return shuffle([word, ...distractors]);
}
