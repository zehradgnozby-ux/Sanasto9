import { useState } from 'react';
import ListeningPlayer from '@/components/listening/ListeningPlayer';
import GameEndActions from '@/components/games/GameEndActions';
import {
  DEFAULT_LISTENING_SETTINGS,
  selectListeningWordsFromConfig,
  type ListeningOrder,
  type ListeningSettings,
} from '@/lib/listening';
import { useStoredState } from '@/hooks/useStoredState';
import type { GameSetupConfig } from '@/lib/games/gameConfig';
import type { Word } from '@/lib/vocabulary';

interface ListeningGameProps {
  lockedOrder: 'fi_tr' | 'tr_fi';
  words: Word[];
  config: GameSetupConfig;
  title: string;
  onExit: () => void;
  onRestart: () => void;
  onNext?: () => void;
}

export default function ListeningGame({ lockedOrder, words, config, title, onExit, onRestart, onNext }: ListeningGameProps) {
  const [isFinished, setIsFinished] = useState(false);
  const [globalSettings] = useStoredState<ListeningSettings>(
    'sanasto.listeningSettings',
    DEFAULT_LISTENING_SETTINGS,
  );

  const queue = selectListeningWordsFromConfig(words, config);

  const availableOrders: ListeningOrder[] =
    lockedOrder === 'fi_tr' ? ['fi_tr', 'fi_only'] : ['tr_fi', 'tr_only'];

  const lockedSettings: ListeningSettings = {
    ...globalSettings,
    order: availableOrders.includes(globalSettings.order) ? globalSettings.order : lockedOrder,
  };

  if (isFinished || queue.length === 0) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-7rem)] max-w-2xl flex-col justify-center gap-6">
        <h1 className="text-center text-2xl font-bold text-slate-900">{title}</h1>
        <GameEndActions
          onRestart={onRestart}
          onNext={onNext}
          onExit={onExit}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col justify-center gap-4">
      <ListeningPlayer
        queue={queue}
        settings={lockedSettings}
        onBack={onExit}
        onFinish={() => setIsFinished(true)}
      />
    </div>
  );
}
