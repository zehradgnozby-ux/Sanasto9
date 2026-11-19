import { useMemo, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import ImportReviewPanel from '@/components/ImportReviewPanel';
import GoogleAiTranslatePanel from '@/components/GoogleAiTranslatePanel';
import Modal from '@/components/Modal';
import { useLibrary } from '@/contexts/LibraryContext';
import {
  buildImportPreview,
  guessMapping,
  parseImportFile,
  type ColumnMapping,
  type ImportDefaults,
  type ParsedTable,
} from '@/lib/wordImport';
import type { WordFormValues } from '@/lib/vocabulary';

interface WordImportModalProps {
  onClose: () => void;
  defaultCategoryId?: string | null;
}

type Phase = 'pick' | 'review' | 'running' | 'generating_images' | 'done';

export default function WordImportModal({ onClose, defaultCategoryId = null }: WordImportModalProps) {
  const { categories, words, insertWords, generateAiImages } = useLibrary();
  const initialDefaults = useMemo<ImportDefaults>(() => ({ categoryId: defaultCategoryId }), [defaultCategoryId]);
  const [phase, setPhase] = useState<Phase>('pick');
  const [pickError, setPickError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [defaults, setDefaults] = useState<ImportDefaults>(initialDefaults);
  const [progress, setProgress] = useState(0);
  const [toInsertCount, setToInsertCount] = useState(0);
  const [result, setResult] = useState<{ inserted: number; errorMessage: string | null } | null>(null);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiTotal, setAiTotal] = useState(0);
  const [aiSaved, setAiSaved] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);

  const rows = useMemo(
    () => (table ? buildImportPreview(table, mapping, defaults, categories, words) : []),
    [table, mapping, defaults, categories, words],
  );

  const loadParsedTable = (parsed: ParsedTable) => {
    setTable(parsed);
    setMapping(guessMapping(parsed.headers));
    setDefaults(initialDefaults);
    setPhase('review');
  };

  const handlePreview = () => {
    setPickError(null);
    try {
      loadParsedTable(parseImportFile(extractedText, 'txt'));
    } catch (error) {
      setPickError(error instanceof Error ? error.message : 'Metin okunamadı.');
    }
  };

  const handleStart = async () => {
    setAiError(null);
    const toInsert: WordFormValues[] = rows.flatMap((row) => (row.status === 'ready' && row.values ? [row.values] : []));
    setToInsertCount(toInsert.length);
    setProgress(0);
    setPhase('running');
    const outcome = await insertWords(toInsert, setProgress);

    const wordsWithoutImages = outcome.createdWords.filter((word) => !word.image_url);
    if (wordsWithoutImages.length > 0 && !outcome.errorMessage) {
      setAiTotal(wordsWithoutImages.length);
      setAiProgress(0);
      setAiSaved(0);
      setAiError(null);
      setPhase('generating_images');
      const aiOutcome = await generateAiImages(wordsWithoutImages, setAiProgress);
      setAiSaved(aiOutcome.saved);
      setAiError(aiOutcome.errorMessage);
    } else if (outcome.createdWords.length > 0 && !outcome.errorMessage) {
      setAiError('Yapay zeka görseli oluşturulmadı çünkü içe aktarılan kelimelerin hepsinde zaten bir görsel vardı.');
    }

    setResult(outcome);
    setPhase('done');
  };

  const handleBackToPick = () => {
    setTable(null);
    setPickError(null);
    setPhase('pick');
  };

  return (
    <Modal title="Toplu kelime ekle" onClose={onClose} maxWidthClass="max-w-4xl">
      {phase === 'pick' && (
        <div className="space-y-5">
          <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <h3 className="text-sm font-bold text-blue-900">Nasıl kullanılır?</h3>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-blue-800">
              <li>"Google AI Mode ile çevir" butonuna tıklayın. Google AI Mode yeni sekmede açılır ve komut otomatik yazılır.</li>
              <li>Açılan sayfada çevirmek istediğiniz metni yazın veya fotoğraf/belge yükleyin.</li>
              <li>Google, kelimeleri yalın hallerine getirip "Fince - Türkçe" biçiminde listeler.</li>
              <li>Listeyi kopyalayıp buradaki kutuya yapıştırın ve "Önizle"ye tıklayın.</li>
            </ol>
          </div>

          <div className="space-y-3">
            <label htmlFor="word-list" className="block text-sm font-semibold text-slate-700">
              Fince - Türkçe kelime listesi
            </label>
            <textarea
              id="word-list"
              value={extractedText}
              onChange={(event) => setExtractedText(event.target.value)}
              rows={10}
              placeholder={'kissa - kedi\nkoira - köpek\nomena - elma'}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <GoogleAiTranslatePanel />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePreview}
                disabled={extractedText.trim() === ''}
                className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"
              >
                Önizle
              </button>
            </div>
          </div>

          {pickError && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {pickError}
            </p>
          )}
        </div>
      )}

      {phase === 'review' && table && (
        <ImportReviewPanel
          table={table}
          mapping={mapping}
          onMappingChange={setMapping}
          defaults={defaults}
          onDefaultsChange={setDefaults}
          categories={categories}
          rows={rows}
          onStart={handleStart}
          onBack={handleBackToPick}
        />
      )}

      {phase === 'running' && (
        <div className="space-y-4 py-6" role="status">
          <p className="text-center font-semibold text-slate-800">
            {progress} / {toInsertCount} kelime ekleniyor...
          </p>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-700 transition-all duration-300"
              style={{ width: `${toInsertCount === 0 ? 0 : Math.round((progress / toInsertCount) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {phase === 'generating_images' && (
        <div className="space-y-4 py-6" role="status">
          <div className="flex items-center justify-center gap-2 text-slate-800">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <p className="text-center font-semibold">
              Görseller oluşturuluyor: {aiProgress} / {aiTotal}
            </p>
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
              style={{ width: `${aiTotal === 0 ? 0 : Math.round((aiProgress / aiTotal) * 100)}%` }}
            />
          </div>
          <p className="text-center text-sm text-slate-500">
            Yapay zeka (SDXL) görselsiz kelimeler için fotogerçekçi görsel üretiyor.
          </p>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="space-y-4" role="status">
          {result.errorMessage ? (
            <>
              <p className="font-semibold text-rose-700">
                {result.inserted} kelime eklendi, işlem bir hata nedeniyle durdu.
              </p>
              <p className="text-sm text-slate-600">{result.errorMessage}</p>
              <p className="text-sm text-slate-600">
                Aynı kelimeleri tekrar eklediğinizde zaten kayıtlı olanlar atlanır; kalanlar eklenir.
              </p>
            </>
          ) : (
            <p className="font-semibold text-emerald-700">{result.inserted} kelime eklendi.</p>
          )}
          {(aiTotal > 0 || aiError) && (
            <>
              <p className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <Sparkles className="h-4 w-4" />
                {aiSaved} / {aiTotal} kelimenin görseli yapay zeka ile oluşturuldu.
              </p>
              {aiError && <p className="text-sm font-medium text-amber-700">{aiError}</p>}
            </>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={handleBackToPick}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Yeni ekleme yap
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
