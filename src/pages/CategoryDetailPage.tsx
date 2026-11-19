import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Download,
  FileUp,
  ImagePlus,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import AutoImageModal from '@/components/AutoImageModal';
import BulkExportModal from '@/components/BulkExportModal';
import FlashcardGame from '@/components/games/FlashcardGame';
import GameFilterFields from '@/components/games/GameFilterFields';
import GameSession from '@/components/games/GameSession';
import ListeningGame from '@/components/games/ListeningGame';
import ListeningSettingsPanel from '@/components/listening/ListeningSettingsPanel';
import MissingImageNotice from '@/components/MissingImageNotice';
import MultiSelectField from '@/components/MultiSelectField';
import SortDropdown from '@/components/SortDropdown';
import StickyHeader from '@/components/StickyHeader';
import WordFilterBar from '@/components/WordFilterBar';
import WordImportModal from '@/components/WordImportModal';
import WordList from '@/components/WordList';
import { useDismissOnOutside } from '@/hooks/useDismissOnOutside';
import { useGameSettings } from '@/hooks/useGameSettings';
import { useStoredState } from '@/hooks/useStoredState';
import { useLibrary } from '@/contexts/LibraryContext';
import { getLearningProgress } from '@/lib/learningProgress';
import {
  getCandidateWords,
  getSetupIssues,
  selectGameWords,
  type GameSetupConfig,
} from '@/lib/games/gameConfig';
import { EMPTY_WORD_FILTERS, filterWords, type WordFilters } from '@/lib/wordFilters';
import { sortWordsByListMode, WORD_LIST_SORT_OPTIONS, type WordListSort } from '@/lib/wordSort';
import type { Category, Word } from '@/lib/vocabulary';
import { GAME_DEFINITIONS, getGameDefinition, type GameDefinition } from '@/lib/games/gameDefinitions';
import { DEFAULT_LISTENING_SETTINGS, type ListeningSettings } from '@/lib/listening';
import type { GameId, QuizGameId } from '@/lib/games/types';
import { useHideAppHeader } from '@/contexts/AppHeaderContext';

const WORD_SORT_KEY = 'sanasto.wordListSort';
const FAVORITES_CATEGORY_ID = '__favorites__';

type CategoryTab = 'words' | 'games' | 'settings';

interface ActiveGame {
  gameId: GameId;
  words: Word[];
  attempt: number;
}

function isQuizGame(gameId: GameId): gameId is QuizGameId {
  return gameId !== 'flashcards' && gameId !== 'listen-fi-tr' && gameId !== 'listen-tr-fi';
}

function isListeningGame(gameId: GameId): boolean {
  return gameId === 'listen-fi-tr' || gameId === 'listen-tr-fi';
}

function getNextGameDefinition(gameId: GameId): GameDefinition | undefined {
  const index = GAME_DEFINITIONS.findIndex((item) => item.id === gameId);
  return index === -1 ? undefined : GAME_DEFINITIONS[index + 1];
}

interface CategoryDetailPageProps {
  category: Category;
  overrideWords?: Word[];
  onBack: () => void;
}

export default function CategoryDetailPage({ category, overrideWords, onBack }: CategoryDetailPageProps) {
  const isUncategorized = category.id === '__uncategorized__';
  const { words: allWords, categories, isLoading } = useLibrary();
  const categoryWords = useMemo(
    () =>
      overrideWords ??
      allWords.filter((word) =>
        isUncategorized ? !word.category_id : word.category_id === category.id,
      ),
    [allWords, category.id, isUncategorized, overrideWords],
  );

  const [tab, setTab] = useState<CategoryTab>('games');
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);

  const gameConfig = useGameSettings();
  const isFavoritesCategory = category.id === FAVORITES_CATEGORY_ID;
  const [favoriteCategoryIds, setFavoriteCategoryIds] = useState<string[]>([]);
  const [gameCategoryIds, setGameCategoryIds] = useState<string[]>(
    isUncategorized || isFavoritesCategory ? [] : [category.id],
  );
  useEffect(() => {
    setGameCategoryIds(isUncategorized || isFavoritesCategory ? [] : [category.id]);
  }, [category.id, isUncategorized, isFavoritesCategory]);
  const categoryConfig: GameSetupConfig = useMemo(
    () => ({
      ...gameConfig.config,
      categoryIds: gameCategoryIds,
      favoritesOnly: isFavoritesCategory || gameConfig.config.favoritesOnly,
    }),
    [gameConfig.config, gameCategoryIds, isFavoritesCategory],
  );

  const gameWords = useMemo(() => {
    const favoritesFilter = (word: Word) => !categoryConfig.favoritesOnly || word.is_favorite;
    if (isFavoritesCategory) {
      if (favoriteCategoryIds.length === 0) return categoryWords.filter(favoritesFilter);
      return categoryWords.filter((word) => word.category_id !== null && favoriteCategoryIds.includes(word.category_id) && favoritesFilter(word));
    }
    if (gameCategoryIds.length === 0) return allWords.filter(favoritesFilter);
    return allWords.filter((word) => word.category_id !== null && gameCategoryIds.includes(word.category_id) && favoritesFilter(word));
  }, [allWords, categoryWords, gameCategoryIds, favoriteCategoryIds, isFavoritesCategory, categoryConfig.favoritesOnly]);
  const updateCategoryConfig = (next: GameSetupConfig) => {
    gameConfig.updateConfig({ ...next, categoryIds: gameConfig.config.categoryIds });
  };

  const poolByGame = useMemo(() => {
    const map = new Map<GameId, Word[]>();
    for (const def of GAME_DEFINITIONS) {
      map.set(def.id, getCandidateWords(gameWords, categoryConfig, def.requiresImage));
    }
    return map;
  }, [gameWords, categoryConfig]);

  useHideAppHeader(true);

  const launchGame = (gameId: GameId) => {
    const def = getGameDefinition(gameId);
    const gameWordList = selectGameWords(gameWords, categoryConfig, def.requiresImage);
    const pool = poolByGame.get(gameId) ?? [];
    if (gameWordList.length === 0 || getSetupIssues(def, pool, gameWords, categoryConfig).length > 0) {
      return;
    }
    setActiveGame({ gameId, words: gameWordList, attempt: 0 });
  };

  const startNextGame = (currentId: GameId) => {
    const next = getNextGameDefinition(currentId);
    if (!next) return;
    launchGame(next.id);
  };

  const exitToList = () => {
    setActiveGame(null);
    setTab('games');
  };

  const retryWrong = (wordIds: string[]) => {
    setActiveGame((previous) =>
      previous && isQuizGame(previous.gameId)
        ? {
            gameId: previous.gameId,
            words: gameWords.filter((word) => wordIds.includes(word.id)),
            attempt: previous.attempt + 1,
          }
        : previous,
    );
  };

  const restart = () => {
    setActiveGame((previous) => (previous ? { ...previous, attempt: previous.attempt + 1 } : previous));
  };

  if (isLoading) return null;

  if (tab === 'settings') {
    return (
      <div className="space-y-6">
        <StickyHeader title="Oyun ayarları" onBack={() => setTab('games')} />
        <CategoryGamesTab
          categoryWords={categoryWords}
          gameWords={gameWords}
          isFavoritesCategory={isFavoritesCategory}
          gameCategoryIds={gameCategoryIds}
          onGameCategoryIdsChange={setGameCategoryIds}
          favoriteCategoryIds={favoriteCategoryIds}
          onFavoriteCategoryIdsChange={setFavoriteCategoryIds}
          categoryConfig={categoryConfig}
          updateCategoryConfig={updateCategoryConfig}
          poolByGame={poolByGame}
          saveError={gameConfig.saveError}
          onLaunchGame={launchGame}
          onManageWords={() => setTab('words')}
          showSettings
          settingsPage
          onShowSettingsChange={() => {}}
        />
      </div>
    );
  }

  if (activeGame) {
    const title = GAME_DEFINITIONS.find((item) => item.id === activeGame.gameId)?.title ?? '';
    const hasNextGame = getNextGameDefinition(activeGame.gameId) !== undefined;
    const sessionKey = `${activeGame.gameId}-${activeGame.attempt}`;
    const onNext = hasNextGame ? () => startNextGame(activeGame.gameId) : undefined;
    return (
      <div className="space-y-4">
        {isListeningGame(activeGame.gameId) ? (
          <ListeningGame
            key={sessionKey}
            lockedOrder={activeGame.gameId === 'listen-fi-tr' ? 'fi_tr' : 'tr_fi'}
            words={activeGame.words}
            config={categoryConfig}
            title={title}
            onExit={exitToList}
            onRestart={restart}
            onNext={onNext}
          />
        ) : isQuizGame(activeGame.gameId) ? (
          <GameSession
            key={sessionKey}
            gameId={activeGame.gameId}
            words={activeGame.words}
            onExit={exitToList}
            onRetryWrong={retryWrong}
            onRestart={restart}
            onNext={onNext}
          />
        ) : (
          <FlashcardGame
            key={sessionKey}
            title={title}
            words={activeGame.words}
            onExit={exitToList}
            onRestart={restart}
            onNext={onNext}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StickyHeader
        title={category.name}
        onBack={onBack}
        subtitle={`${getLearningProgress(categoryWords).learned}/${categoryWords.length}`}
      />

      {tab === 'games' && (
        <CategoryGamesTab
          categoryWords={categoryWords}
          gameWords={gameWords}
          isFavoritesCategory={isFavoritesCategory}
          gameCategoryIds={gameCategoryIds}
          onGameCategoryIdsChange={setGameCategoryIds}
          favoriteCategoryIds={favoriteCategoryIds}
          onFavoriteCategoryIdsChange={setFavoriteCategoryIds}
          categoryConfig={categoryConfig}
          updateCategoryConfig={updateCategoryConfig}
          poolByGame={poolByGame}
          saveError={gameConfig.saveError}
          onLaunchGame={launchGame}
          onManageWords={() => setTab('words')}
          showSettings={false}
          onShowSettingsChange={(open) => {
            if (open) setTab('settings');
          }}
        />
      )}
      {tab === 'words' && (
        <CategoryWordsTab
          categoryId={category.id}
          isUncategorized={isUncategorized}
          categoryWords={categoryWords}
          allWords={allWords}
          categories={categories}
          onBackToGames={() => setTab('games')}
          showPageHeader
        />
      )}
    </div>
  );
}

function CategoryWordsTab({
  categoryId,
  isUncategorized,
  categoryWords,
  allWords,
  categories,
  onBackToGames,
  showPageHeader,
}: {
  categoryId: string;
  isUncategorized: boolean;
  categoryWords: Word[];
  allWords: Word[];
  categories: Category[];
  onBackToGames: () => void;
  showPageHeader: boolean;
}) {
  const [filters, setFilters] = useState<WordFilters>(EMPTY_WORD_FILTERS);
  const [isExporting, setIsExporting] = useState(false);
  const [isAutoImaging, setIsAutoImaging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  useDismissOnOutside(filterContainerRef, showFilters, () => setShowFilters(false));
  const [sortSettings, setSortSettings] = useStoredState<{ mode: WordListSort }>(WORD_SORT_KEY, { mode: 'added' });
  const sortMode = sortSettings.mode;

  const scopedFilters = useMemo<WordFilters>(
    () => ({ ...filters, categoryIds: [categoryId] }),
    [filters, categoryId],
  );

  const visibleWords = useMemo(
    () => sortWordsByListMode(filterWords(categoryWords, scopedFilters), sortMode),
    [categoryWords, scopedFilters, sortMode],
  );

  const hasNonCategoryFilters =
    filters.search !== '' ||
    filters.statuses.length > 0 ||
    filters.favoritesOnly ||
    filters.noImage;

  return (
    <div className="space-y-4">
      {showPageHeader && <StickyHeader title="Kelime ekle ve düzenle" onBack={onBackToGames} />}
      <div className="grid w-full grid-cols-1 gap-2 sm:max-w-xs">
        <button
          type="button"
          onClick={() => setIsExporting(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
        >
          <Download className="h-4 w-4 shrink-0" /> <span>Dışa aktar</span>
        </button>
        <button
          type="button"
          onClick={() => setIsAutoImaging(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
        >
          <ImagePlus className="h-4 w-4 shrink-0" /> <span>Toplu otomatik görsel ata</span>
        </button>
        <button
          type="button"
          onClick={() => setIsImporting(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
        >
          <FileUp className="h-4 w-4 shrink-0" /> <span>Yeni Kelime Ekle</span>
        </button>
      </div>

      <MissingImageNotice
        count={categoryWords.filter((word) => !word.image_url).length}
        onShow={() => setFilters({ ...EMPTY_WORD_FILTERS, noImage: true })}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div ref={filterContainerRef} className="w-full">
          <div className="grid w-full grid-cols-2 gap-2">
            <div className="relative min-w-0">
              <div className={`flex min-w-0 items-center rounded-xl border text-sm font-semibold transition ${
                hasNonCategoryFilters
                  ? 'border-teal-400 bg-teal-100 text-teal-900'
                  : 'border-teal-200 bg-teal-50 text-teal-800'
              }`}>
                <button
                  type="button"
                  aria-label="Filtrele"
                  aria-expanded={showFilters}
                  onClick={() => setShowFilters((open) => !open)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2.5 text-left outline-none focus:ring-4 focus:ring-blue-100"
                >
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="truncate">{hasNonCategoryFilters ? 'Filtrele (aktif)' : 'Filtrele'}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${showFilters ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {hasNonCategoryFilters && (
                  <button
                    type="button"
                    onClick={() => setFilters(EMPTY_WORD_FILTERS)}
                    className="shrink-0 px-2 text-xs font-semibold text-blue-700 transition hover:text-blue-900"
                  >
                    <X className="h-3.5 w-3.5" aria-label="Filtreleri temizle" />
                  </button>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <SortDropdown
                label="Kelime sıralaması"
                options={WORD_LIST_SORT_OPTIONS}
                value={sortMode}
                buttonClassName="flex min-w-0 w-full items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5 text-left text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100"
                onChange={(mode) => setSortSettings({ mode })}
              />
            </div>
          </div>
          {showFilters && (
            <div className="mt-2">
              <CategoryWordFilterBar filters={filters} onChange={setFilters} />
            </div>
          )}
        </div>
      </div>

      <WordList
        words={visibleWords}
        emptyTitle={hasNonCategoryFilters ? 'Bu filtrelere uyan kelime yok' : 'Bu kategoride henüz kelime yok'}
        emptyText={
          hasNonCategoryFilters
            ? 'Filtreleri temizleyerek bütün kelimeleri tekrar görebilirsiniz.'
            : 'Yukarıdaki "Yeni Kelime Ekle" butonuyla ilk kelimenizi ekleyin.'
        }
      />

      {isExporting && (
        <BulkExportModal
          words={allWords}
          visibleWords={visibleWords}
          categories={categories}
          onClose={() => setIsExporting(false)}
        />
      )}
      {isAutoImaging && <AutoImageModal onClose={() => setIsAutoImaging(false)} words={categoryWords} />}
      {isImporting && (
        <WordImportModal
          onClose={() => setIsImporting(false)}
          defaultCategoryId={isUncategorized ? null : categoryId}
        />
      )}
    </div>
  );
}

function CategoryWordFilterBar({ filters, onChange }: { filters: WordFilters; onChange: (filters: WordFilters) => void }) {
  return <WordFilterBar filters={filters} onChange={onChange} hideCategoryFilter />;
}

interface CategoryGamesTabProps {
  categoryWords: Word[];
  gameWords: Word[];
  isFavoritesCategory: boolean;
  gameCategoryIds: string[];
  onGameCategoryIdsChange: (ids: string[]) => void;
  favoriteCategoryIds: string[];
  onFavoriteCategoryIdsChange: (ids: string[]) => void;
  categoryConfig: GameSetupConfig;
  updateCategoryConfig: (config: GameSetupConfig) => void;
  poolByGame: Map<GameId, Word[]>;
  saveError: string | null;
  onLaunchGame: (gameId: GameId) => void;
  onManageWords: () => void;
  showSettings: boolean;
  settingsPage?: boolean;
  onShowSettingsChange: (open: boolean) => void;
}

function CategoryGamesTab({
  categoryWords,
  gameWords,
  isFavoritesCategory,
  gameCategoryIds,
  onGameCategoryIdsChange,
  favoriteCategoryIds,
  onFavoriteCategoryIdsChange,
  categoryConfig,
  updateCategoryConfig,
  poolByGame,
  saveError,
  onLaunchGame,
  onManageWords,
  showSettings,
  settingsPage = false,
  onShowSettingsChange,
}: CategoryGamesTabProps) {
  const { categories } = useLibrary();
  const settingsRef = useRef<HTMLDivElement>(null);
  useDismissOnOutside(settingsRef, showSettings && !settingsPage, () => onShowSettingsChange(false));
  const settingsVisible = showSettings || settingsPage;
  const [listeningSettings, setListeningSettings] = useStoredState<ListeningSettings>(
    'sanasto.listeningSettings',
    DEFAULT_LISTENING_SETTINGS,
  );
  const categoryOptions = useMemo(
    () => categories.map((item) => ({ value: item.id, label: item.name })),
    [categories],
  );

  return (
    <div ref={settingsRef} className="space-y-4">
      {gameWords.length === 0 && (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          {isFavoritesCategory && categoryWords.length > 0
            ? 'Seçili kategorilerde favori kelime yok. Filtreden başka kategoriler de seçebilirsiniz.'
            : 'Bu kategoride henüz kelime yok. İlk kelimenizi eklemek için "Kelime ekle ve düzenle" düğmesine dokunun.'}
        </p>
      )}

      {!settingsPage && (
        <div className="grid w-full grid-cols-1 gap-2">
          <button
            type="button"
            onClick={onManageWords}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
          >
            <span className="truncate">Kelime ekle ve düzenle</span>
          </button>
          <button
            type="button"
            onClick={() => onShowSettingsChange(!showSettings)}
            aria-expanded={showSettings}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" /> <span className="truncate">Oyun ayarları</span>
            <ChevronDown className={`h-4 w-4 shrink-0 transition ${showSettings ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {settingsVisible && (
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {isFavoritesCategory ? (
              <div className="space-y-2">
                <MultiSelectField
                  label="Kategoriler"
                  options={categoryOptions}
                  selected={favoriteCategoryIds}
                  allLabel="Tüm kategoriler"
                  onChange={onFavoriteCategoryIdsChange}
                />
                <p className="text-xs text-slate-500">Hiç kategori seçilmemişse bütün favori kelimeler kullanılır.</p>
              </div>
            ) : (
              <MultiSelectField
                label="Kategoriler"
                options={categoryOptions}
                selected={gameCategoryIds}
                allLabel="Tüm kategoriler"
                onChange={onGameCategoryIdsChange}
              />
            )}
            <GameFilterFields
              config={categoryConfig}
              onChange={updateCategoryConfig}
              categories={categories}
              words={gameWords}
              hideCategoryFilter
              showFavoritesToggle
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Dinleme ayarları</h3>
            <ListeningSettingsPanel
              settings={listeningSettings}
              onChange={setListeningSettings}
              hideOrderSelector
            />
          </div>

          {saveError && (
            <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">Ayarlar kaydedilemedi: {saveError}</p>
          )}
        </div>
      )}

      {!settingsPage && (
        <ul className="grid grid-cols-2 gap-2 sm:gap-4">
          {GAME_DEFINITIONS.map((game) => {
            const Icon = game.icon;
            const pool = poolByGame.get(game.id) ?? [];
            const issues = getSetupIssues(game, pool, gameWords, categoryConfig);
            const canPlay = pool.length > 0 && issues.length === 0;
            return (
              <li key={game.id}>
                <button
                  type="button"
                  onClick={() => (canPlay ? onLaunchGame(game.id) : onShowSettingsChange(true))}
                  className="group flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:rounded-3xl sm:p-6"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="block text-base font-bold leading-tight text-slate-900 sm:text-lg">
                    {game.title}
                  </span>
                  {canPlay ? (
                    <span className="text-sm font-semibold text-blue-700">Oyna</span>
                  ) : (
                    <span className="text-sm font-semibold text-slate-400">Ayar gerekli</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
