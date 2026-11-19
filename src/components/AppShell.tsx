import { useState, type ReactNode } from 'react';
import { BookOpen, LibraryBig, LogIn, LogOut, GraduationCap, Settings, Trash2, RotateCcw, ChevronDown, TriangleAlert, type LucideIcon } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import StickyHeader from '@/components/StickyHeader';
import { AppHeaderProvider } from '@/contexts/AppHeaderContext';

import { useAuth } from '@/contexts/AuthContext';
import { useLibrary } from '@/contexts/LibraryContext';
import { isSpeechSupported } from '@/lib/speech';
import { useAutoPickVoices, useVoices } from '@/hooks/useSpeechSettings';
import { describeError } from '@/lib/errors';

export type TabId = 'learn' | 'words' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

export const TABS: Tab[] = [
  { id: 'learn', label: 'Kategoriler ve Oyunlar', icon: GraduationCap },
  { id: 'words', label: 'Tüm Kelimeler', icon: LibraryBig },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
];

const TAB_TITLES: Record<TabId, string> = {
  learn: 'Kategoriler ve Oyunlar',
  words: 'Tüm Kelimeler',
  settings: 'Ayarlar',
};

interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}

export default function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const [headerHidden, setHeaderHidden] = useState(false);
  useAutoPickVoices();
  const finnishVoices = useVoices('fi');
  const showVoiceWarning = isSpeechSupported() && finnishVoices.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {showVoiceWarning && (
        <div className="border-b border-amber-200 bg-amber-50">
          <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-3 text-sm text-amber-900 sm:px-6">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Bu cihazda Fince ses kurulmamuş. Tarayıcınızın veya işletim sisteminizin dil ayarlarından Fince (suomi) ses paketini ekleyebilirsiniz. Fince kelimeler yine de okunabilir ama telaffuz kalitesi düşük olabilir.
          </p>
        </div>
      )}

      <AppHeaderProvider value={setHeaderHidden}>
        {!headerHidden && <StickyHeader title={TAB_TITLES[activeTab]} />}

        <main
          className={`mx-auto max-w-6xl px-4 pb-28 sm:px-6 md:pb-12 md:pt-8 ${headerHidden ? 'pt-0' : 'pt-6'}`}
        >
          {children}
        </main>
      </AppHeaderProvider>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
        aria-label="Ana menü"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 px-2 pb-[calc(env(safe-area-inset-bottom)+2px)] pt-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[11px] font-semibold transition ${
                  isActive ? 'text-blue-800' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${isActive ? 'bg-blue-100' : ''}`}>
                  <tab.icon className="h-4.5 w-4.5" />
                </span>
                <span className="leading-none">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { getDeletedWords, restoreWord, restoreWords, permanentlyDeleteWord, permanentlyDeleteWords } = useLibrary();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [recycleOpen, setRecycleOpen] = useState(false);
  const [recycleError, setRecycleError] = useState<string | null>(null);
  const [confirmPurge, setConfirmPurge] = useState<string | null>(null);
  const [confirmPurgeMany, setConfirmPurgeMany] = useState<string[] | null>(null);

  const deletedWords = getDeletedWords();

  const handleSignOut = async () => {
    setSignOutError(null);
    try {
      await signOut();
    } catch (err) {
      setSignOutError(describeError(err));
    }
  };

  const handleRestore = async (id: string) => {
    setRecycleError(null);
    try {
      await restoreWord(id);
    } catch (err) {
      setRecycleError(describeError(err));
    }
  };

  const handlePurge = async (id: string) => {
    setRecycleError(null);
    try {
      await permanentlyDeleteWord(id);
      setConfirmPurge(null);
    } catch (err) {
      setRecycleError(describeError(err));
    }
  };

  const handleRestoreMany = async (ids: string[]) => {
    setRecycleError(null);
    try {
      await restoreWords(ids);
    } catch (err) {
      setRecycleError(describeError(err));
    }
  };

  const handlePurgeMany = async (ids: string[]) => {
    setRecycleError(null);
    try {
      await permanentlyDeleteWords(ids);
      setConfirmPurgeMany(null);
    } catch (err) {
      setRecycleError(describeError(err));
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">Hesap ve oturum işlemleri.</p>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-slate-900">Sanasto</span>
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Oturum açmış hesap</p>
          <p className="truncate text-sm font-semibold text-slate-900">{user?.email ?? 'Bilinmiyor'}</p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Çıkış yap
        </button>
        {signOutError && (
          <p role="alert" className="text-sm text-rose-700">{signOutError}</p>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setRecycleOpen((open) => !open)}
          aria-expanded={recycleOpen}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
        >
          <span className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Trash2 className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-bold text-slate-900">Geri Dönüşüm Kutusu</span>
              <span className="block text-sm text-slate-500">
                {deletedWords.length > 0 ? `${deletedWords.length} silinmiş kelime` : 'Silinmiş kelime yok'}
              </span>
            </span>
          </span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${recycleOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {recycleOpen && (
          <div className="border-t border-slate-100 p-4 sm:p-5">
            {deletedWords.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">
                Geri dönüşüm kutusu boş. Sildiğiniz kelimeler burada görünür ve istediğinizde geri yükleyebilirsiniz.
              </p>
            ) : (
              <div className="space-y-2">
                {deletedWords.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{word.finnish}</p>
                      <p className="truncate text-sm text-slate-500">{word.turkish}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestore(word.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
                      >
                        <RotateCcw className="h-4 w-4" /> Geri yükle
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmPurge(word.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" /> Kalıcı sil
                      </button>
                    </div>
                  </div>
                ))}
                {deletedWords.length > 1 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRestoreMany(deletedWords.map((word) => word.id))}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
                    >
                      <RotateCcw className="h-4 w-4" /> Tümünü geri yükle
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmPurgeMany(deletedWords.map((word) => word.id))}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" /> Tümünü kalıcı sil
                    </button>
                  </div>
                )}
                {recycleError && (
                  <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{recycleError}</p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {confirmPurge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Kalıcı olarak sil</h2>
            <p className="mt-2 text-sm text-slate-600">
              Bu kelime kalıcı olarak silinecek ve geri yüklenemeyecek. Emin misiniz?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmPurge(null)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => handlePurge(confirmPurge)}
                className="rounded-xl bg-rose-600 px-5 py-2.5 font-semibold text-white transition hover:bg-rose-700"
              >
                Evet, kalıcı sil
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmPurgeMany && (
        <ConfirmModal
          title="Tümünü kalıcı olarak sil"
          message={`${confirmPurgeMany.length} kelime kalıcı olarak silinecek ve geri yüklenemeyecek. Emin misiniz?`}
          confirmLabel="Evet, tümünü kalıcı sil"
          onConfirm={() => handlePurgeMany(confirmPurgeMany)}
          onClose={() => setConfirmPurgeMany(null)}
        />
      )}

      <p className="flex items-center gap-2 px-1 text-sm text-slate-400">
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Oturum açma/kapama işlemleri artık bu ekrandan yapılır.
      </p>
    </div>
  );
}
