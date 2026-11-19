import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { GOOGLE_AI_IMPORT_PROMPT, GOOGLE_AI_MODE_SEARCH_URL } from '@/lib/googleAiMode';

export default function GoogleAiTranslatePanel() {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const openAiMode = () => {
    window.open(`${GOOGLE_AI_MODE_SEARCH_URL}${encodeURIComponent(GOOGLE_AI_IMPORT_PROMPT)}`, '_blank', 'noopener,noreferrer');
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_AI_IMPORT_PROMPT);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    window.setTimeout(() => setCopyState('idle'), 2500);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={openAiMode}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" /> Google AI Mode ile çevir
      </button>
      <button
        type="button"
        onClick={copyPrompt}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        {copyState === 'copied' ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        {copyState === 'copied' ? 'Kopyalandı' : 'Komutu kopyala'}
      </button>
      {copyState === 'failed' && <p className="text-xs font-medium text-amber-700">Komut kopyalanamadı.</p>}
    </div>
  );
}
