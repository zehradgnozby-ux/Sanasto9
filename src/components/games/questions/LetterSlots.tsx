interface LetterSlotsProps {
  chars: string[];
  hiddenIndexes: number[];
  values: (string | null)[];
  tone: 'default' | 'correct' | 'wrong';
  errorSlot: number | null;
}

export default function LetterSlots({ chars, hiddenIndexes, values, tone, errorSlot }: LetterSlotsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {chars.map((char, index) => {
        const isHidden = hiddenIndexes.includes(index);
        const value = values[index];
        const isError = errorSlot === index;
        const baseClass = 'flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold sm:h-12 sm:w-12 sm:text-xl';
        if (!isHidden) {
          return (
            <span key={index} className={`${baseClass} bg-slate-100 text-slate-700`}>
              {char}
            </span>
          );
        }
        let toneClass = 'border-2 border-blue-300 bg-white text-slate-900';
        if (tone === 'correct') toneClass = 'border-2 border-emerald-500 bg-emerald-50 text-emerald-900';
        else if (tone === 'wrong' || isError) toneClass = 'border-2 border-rose-500 bg-rose-50 text-rose-900';
        return (
          <span key={index} className={`${baseClass} ${toneClass}`}>
            {value ?? ''}
          </span>
        );
      })}
    </div>
  );
}
