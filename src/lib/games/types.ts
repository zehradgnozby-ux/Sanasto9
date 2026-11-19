import type { Word } from '@/lib/vocabulary';

export type GameId =
  | 'flashcards'
  | 'choose-word'
  | 'listen-choose'
  | 'read-choose'
  | 'find-image'
  | 'matching'
  | 'image-matching'
  | 'type-word'
  | 'image-type'
  | 'turkish-find-image'
  | 'listen-fi-tr'
  | 'listen-tr-fi';

export type QuizGameId = Exclude<GameId, 'flashcards' | 'listen-fi-tr' | 'listen-tr-fi'>;

export interface WordResult {
  wordId: string;
  finnish: string;
  turkish: string;
  correct: boolean;
}

export type QuizQuestion =
  | { kind: 'image-choice'; word: Word; options: Word[] }
  | { kind: 'listen-choice'; word: Word; options: Word[] }
  | { kind: 'read-choice'; word: Word; options: Word[] }
  | { kind: 'flip-image'; word: Word; options: Word[] }
  | { kind: 'matching'; words: Word[] }
  | { kind: 'image-matching'; words: Word[] }
  | { kind: 'type-word'; word: Word }
  | { kind: 'image-type'; word: Word }
  | { kind: 'turkish-image-choice'; word: Word; options: Word[] };

export type QuizKind = QuizQuestion['kind'];

export function toWordResult(word: Word, correct: boolean): WordResult {
  return { wordId: word.id, finnish: word.finnish, turkish: word.turkish, correct };
}
