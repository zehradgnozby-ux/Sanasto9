import type { LetterTile } from '@/lib/games/letterTiles';

interface LetterPickerProps {
  tiles: LetterTile[];
  values: (string | null)[];
  disabled: boolean;
  onPick: (tile: LetterTile) => void;
}

export default function LetterPicker({ tiles, values, disabled, onPick }: LetterPickerProps) {
  const filledCount = values.filter((v) => v !== null).length;
  const maxSlots = values.length;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {tiles.map((tile) => {
        const isFullyUsed = filledCount >= maxSlots;
        return (
          <button
            key={tile.id}
            type="button"
            disabled={disabled || isFullyUsed}
            onClick={() => onPick(tile)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold transition sm:h-12 sm:w-12 sm:text-xl ${
              disabled || isFullyUsed
                ? 'cursor-default bg-blue-100/40 text-blue-300'
                : 'bg-blue-100/70 text-blue-800 shadow-sm hover:bg-blue-200/80 active:scale-95 disabled:opacity-40'
            }`}
          >
            {tile.char}
          </button>
        );
      })}
    </div>
  );
}
