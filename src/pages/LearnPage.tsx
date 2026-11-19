import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, Heart, Pencil, Plus, Search, Sparkles, X } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import LearningBattery from '@/components/LearningBattery';
import Modal from '@/components/Modal';
import { useLibrary } from '@/contexts/LibraryContext';
import { describeError } from '@/lib/errors';
import { getLearningProgress } from '@/lib/learningProgress';
import { CATEGORY_SORT_OPTIONS } from '@/lib/categorySort';
import { DEFAULT_CATEGORY_NAMES, type Category } from '@/lib/vocabulary';
import CategoryDetailPage from '@/pages/CategoryDetailPage';
import { useDismissOnOutside } from '@/hooks/useDismissOnOutside';

interface LearnPageProps {
  initialCategoryId?: string | null;
}

const DRAG_MIME = 'text/category-id';
const FAVORITES_ID = '__favorites__';

export default function LearnPage({ initialCategoryId = null }: LearnPageProps) {
  const {
    categories,
    words,
    addCategory,
    renameCategory,
    deleteCategory,
    seedDefaultCategories,
    reorderCategories,
    categorySortMode,
    setCategorySortMode,
  } = useLibrary();

  const [showPanel, setShowPanel] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [isCategorySearchOpen, setIsCategorySearchOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategoryId);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useDismissOnOutside(panelRef, showPanel, () => setShowPanel(false));

  const wordsByCategory = useMemo(() => {
    const grouped = new Map<string, typeof words>();
    for (const word of words) {
      if (!word.category_id) continue;
      const list = grouped.get(word.category_id) ?? [];
      list.push(word);
      grouped.set(word.category_id, list);
    }
    return grouped;
  }, [words]);

  const uncategorizedWords = useMemo(() => words.filter((word) => !word.category_id), [words]);
  const favoriteWords = useMemo(() => words.filter((word) => word.is_favorite), [words]);

  const UNCAT_ID = '__uncategorized__';
  const selectedCategory: Category | null = selectedCategoryId
    ? selectedCategoryId === UNCAT_ID
      ? { id: UNCAT_ID, name: 'Kategorisiz kelimeler', position: -1, created_at: '' }
      : selectedCategoryId === FAVORITES_ID
        ? { id: FAVORITES_ID, name: 'Favoriler', position: -2, created_at: '' }
        : categories.find((category) => category.id === selectedCategoryId) ?? null
    : null;

  const existingNames = new Set(categories.map((category) => category.name.toLocaleLowerCase('tr-TR')));
  const missingDefaults = DEFAULT_CATEGORY_NAMES.filter(
    (name) => !existingNames.has(name.toLocaleLowerCase('tr-TR')),
  ).length;
  const normalizedCategorySearch = categorySearch.trim().toLocaleLowerCase('tr-TR');
  const visibleCategories = normalizedCategorySearch
    ? categories.filter((category) => category.name.toLocaleLowerCase('tr-TR').includes(normalizedCategorySearch))
    : categories;

  const runAction = async (action: () => Promise<unknown>): Promise<boolean> => {
    setError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setError(describeError(err));
      return false;
    }
  };

  const handleAddCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    if (await runAction(() => addCategory(name))) {
      setNewCategory('');
      setShowAddForm(false);
    }
  };

  const sortHint = categorySortMode === 'manual'
    ? 'Kategorileri sıralamak için bir kategoriye basılı tutup yukarı veya aşağı sürükleyin.'
    : categorySortMode === 'alphabetical'
      ? 'Kategoriler A\'dan Z\'ye alfabetik olarak sıralandı.'
      : 'Kategoriler Z\'den A\'ya ters alfabetik olarak sıralandı.';

  const handleSeed = async () => {
    setIsSeeding(true);
    await runAction(() => seedDefaultCategories());
    setIsSeeding(false);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteCategory(pendingDelete.id);
    setPendingDelete(null);
    setEditingCategory(null);
  };

  const handleDragStart = (event: React.DragEvent, categoryId: string) => {
    setDraggedId(categoryId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(DRAG_MIME, categoryId);
  };

  const handleDragOver = (event: React.DragEvent, categoryId: string) => {
    if (!draggedId || draggedId === categoryId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTargetId(categoryId);
  };

  const handleDrop = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();
    const sourceId = draggedId;
    setDraggedId(null);
    setDropTargetId(null);
    if (!sourceId || sourceId === targetId) return;
    const ids = categories.map((category) => category.id);
    const fromIndex = ids.indexOf(sourceId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);
    void runAction(() => reorderCategories(ids));
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTargetId(null);
  };

  const pendingDeleteMessage = (() => {
    if (!pendingDelete) return '';
    const count = wordsByCategory.get(pendingDelete.id)?.length ?? 0;
    const wordNote =
      count > 0
        ? `Bu kategorideki ${count} kelime silinmez, yalnızca kategori bilgisi temizlenir.`
        : 'Bu kategoride kelime yok.';
    return `"${pendingDelete.name}" kategorisi silinecek. ${wordNote}`;
  })();

  if (selectedCategory) {
    return (
      <CategoryDetailPage
        category={selectedCategory}
        overrideWords={
          selectedCategory.id === FAVORITES_ID
            ? favoriteWords
            : selectedCategory.id === UNCAT_ID
              ? uncategorizedWords
              : undefined
        }
        onBack={() => setSelectedCategoryId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Bir kategori seçin, kelimelerini inceleyin ve oyunlarla pekiştirin.
      </p>

      {missingDefaults > 0 && (
        <div className="flex flex-col gap-3 rounded-xl bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900">
            Hazır konu listesinde {missingDefaults} kategori henüz yok. İsterseniz hepsini tek seferde ekleyebilirsiniz.
          </p>
          <button
            type="button"
            onClick={handleSeed}
            disabled={isSeeding}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-slate-900 transition hover:bg-amber-400 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" /> {isSeeding ? 'Ekleniyor...' : 'Hazır listeyi ekle'}
          </button>
        </div>
      )}

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {(categories.length > 0 || favoriteWords.length > 0) && (
        <>
          <div className="grid gap-3">
            <CategoryCard
              name="Favoriler"
              progress={getLearningProgress(favoriteWords)}
              icon={<Heart className="h-4 w-4 text-rose-500" aria-hidden="true" />}
              onSelect={() => setSelectedCategoryId(FAVORITES_ID)}
              disabled={favoriteWords.length === 0}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{sortHint}</p>
            <button
              type="button"
              onClick={() => {
                setIsCategorySearchOpen((open) => !open);
                if (isCategorySearchOpen) setCategorySearch('');
              }}
              aria-label="Kategori ara"
              aria-expanded={isCategorySearchOpen}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                isCategorySearchOpen ? 'border-blue-400 bg-blue-100 text-blue-800' : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
          {isCategorySearchOpen && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                placeholder="Kategori ara..."
                aria-label="Kategori ara"
                className="w-full rounded-xl border border-blue-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          )}

          <div ref={panelRef} className="relative">
            <button
              type="button"
              onClick={() => setShowPanel((open) => !open)}
              aria-expanded={showPanel}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
            >
              <Plus className="h-5 w-5" /> Kategori ekle veya sırala
              <ChevronDown className={`h-4 w-4 transition ${showPanel ? 'rotate-180' : ''}`} />
            </button>

            {showPanel && (
              <div className="mt-2 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
                {showAddForm ? (
                  <form onSubmit={handleAddCategory} className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={newCategory}
                      onChange={(event) => setNewCategory(event.target.value)}
                      maxLength={80}
                      placeholder="Yeni kategori adı"
                      aria-label="Yeni kategori adı"
                      autoFocus
                      className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowAddForm(false); setNewCategory(''); }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <X className="h-5 w-5" /> Vazgeç
                      </button>
                      <button
                        type="submit"
                        disabled={!newCategory.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-40"
                      >
                        <Plus className="h-5 w-5" /> Ekle
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-800 transition hover:bg-blue-100"
                    >
                      <Plus className="h-5 w-5" /> Yeni Kategori Ekle
                    </button>
                  </div>
                )}

                <div>
                  <h4 className="mb-2 text-sm font-bold text-slate-700">Sıralama</h4>
                  <div className="space-y-1.5">
                    {CATEGORY_SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={categorySortMode === option.value}
                        onClick={() => setCategorySortMode(option.value)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                          categorySortMode === option.value ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {normalizedCategorySearch && visibleCategories.length === 0 && (
            <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">Aradığınız kategori bulunamadı.</p>
          )}

          <div className="grid gap-3">
            {visibleCategories.map((category) => {
              const categoryWords = wordsByCategory.get(category.id) ?? [];
              const progress = getLearningProgress(categoryWords);
              const isDragged = draggedId === category.id;
              const isDropTarget = dropTargetId === category.id && !isDragged;
              return (
                <CategoryCard
                  key={category.id}
                  name={category.name}
                  progress={progress}
                  isDraggable
                  isDragged={isDragged}
                  isDropTarget={isDropTarget}
                  onDragStart={(event) => handleDragStart(event, category.id)}
                  onDragOver={(event) => handleDragOver(event, category.id)}
                  onDrop={(event) => handleDrop(event, category.id)}
                  onDragEnd={handleDragEnd}
                  onSelect={() => setSelectedCategoryId(category.id)}
                  onEdit={() => setEditingCategory(category)}
                  editLabel={`${category.name} kategorisini düzenle`}
                />
              );
            })}
          </div>

          {uncategorizedWords.length > 0 && (
            <CategoryCard
              name="Kategorisiz kelimeler"
              progress={getLearningProgress(uncategorizedWords)}
              onSelect={() => setSelectedCategoryId(UNCAT_ID)}
            />
          )}
        </>
      )}

      {editingCategory && (
        <CategoryEditModal
          category={editingCategory}
          onRename={(name) => renameCategory(editingCategory.id, name)}
          onRequestDelete={() => setPendingDelete(editingCategory)}
          onClose={() => setEditingCategory(null)}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          title="Kategoriyi sil"
          message={pendingDeleteMessage}
          confirmLabel="Evet, sil"
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

function CategoryCard({
  name,
  progress,
  icon,
  isDraggable = false,
  isDragged = false,
  isDropTarget = false,
  disabled = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onSelect,
  onEdit,
  editLabel,
}: {
  name: string;
  progress: ReturnType<typeof getLearningProgress>;
  icon?: ReactNode;
  isDraggable?: boolean;
  isDragged?: boolean;
  isDropTarget?: boolean;
  disabled?: boolean;
  onDragStart?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
  onDragEnd?: () => void;
  onSelect: () => void;
  onEdit?: () => void;
  editLabel?: string;
}) {
  return (
    <article
      draggable={isDraggable && !disabled}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
        isDragged ? 'opacity-40' : isDropTarget ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onSelect}
          disabled={disabled}
          className="flex min-w-0 flex-1 flex-col gap-2 px-5 py-4 text-left transition hover:bg-slate-50"
        >
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="truncate text-base font-bold text-slate-900">{name}</h3>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          </div>
          <LearningBattery progress={progress} />
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={editLabel}
            className="flex shrink-0 items-center border-l border-slate-100 px-3 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
}

function CategoryEditModal({
  category,
  onRename,
  onRequestDelete,
  onClose,
}: {
  category: Category;
  onRename: (name: string) => Promise<void>;
  onRequestDelete: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Ad boş bırakılamaz.');
      return;
    }
    if (trimmed === category.name) {
      onClose();
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onRename(trimmed);
      onClose();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title="Kategoriyi düzenle" onClose={onClose}>
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700" htmlFor="cat-edit-name">Kategori adı</label>
          <input
            id="cat-edit-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            autoFocus
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {error && <p className="text-sm text-rose-700">{error}</p>}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onRequestDelete}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
          >
            Kategoriyi sil
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-blue-700 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
