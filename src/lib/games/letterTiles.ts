import { shuffle } from '@/lib/random';

export interface LetterTile {
  char: string;
  id: number;
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

function pickExtraLetters(existing: string[], count: number): string[] {
  const pool = [...ALPHABET].filter((c) => !existing.includes(c));
  const shuffled = shuffle(pool);
  const extras: string[] = [];
  for (let i = 0; i < shuffled.length && extras.length < count; i++) {
    extras.push(shuffled[i]);
  }
  while (extras.length < count) {
    extras.push(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
  }
  return extras;
}

export function buildLetterTiles(text: string): LetterTile[] {
  const chars = [...text.normalize('NFC')];
  const uniqueChars = [...new Set(chars)];
  const extraCount = Math.max(6, Math.ceil(uniqueChars.length * 1.5));
  const extras = pickExtraLetters(uniqueChars, extraCount);
  const allChars = [...uniqueChars, ...extras].sort((a, b) =>
    a.localeCompare(b, 'fi'),
  );
  return allChars.map((char, index) => ({ char, id: index }));
}
