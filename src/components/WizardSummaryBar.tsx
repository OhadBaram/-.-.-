'use client';

import { useState } from 'react';
import {
  formatWizardSummaryLine,
  type WizardPackageMeta,
} from '@/lib/wizard';

interface WizardSummaryBarProps {
  meta: WizardPackageMeta;
  onChangeSettings: () => void;
  caption?: string;
  hashtags?: string[];
  /** הסבר אסטרטגיה מהיצירה — במגירה, לא כשער */
  explanation?: string | null;
}

export default function WizardSummaryBar({
  meta,
  onChangeSettings,
  caption = '',
  hashtags = [],
  explanation = null,
}: WizardSummaryBarProps) {
  const [showCaptionPanel, setShowCaptionPanel] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  const summary = formatWizardSummaryLine(meta);
  const explanationText = explanation?.trim() || '';
  const hasCaptionPack =
    Boolean(caption.trim()) ||
    hashtags.length > 0 ||
    Boolean(explanationText);
  const hashtagLine = hashtags.join(' ');

  const copyText = async (value: string, okMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback(okMessage);
      setTimeout(() => setCopyFeedback(''), 2200);
    } catch {
      setCopyFeedback('לא הצלחתי להעתיק — סמנו ידנית.');
    }
  };

  return (
    <div
      className="shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800 z-20"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 md:px-4">
        <p
          className="text-sm text-gray-700 dark:text-gray-200 truncate min-w-0 flex-1"
          title={summary}
        >
          {summary}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {hasCaptionPack ? (
            <button
              type="button"
              onClick={() => setShowCaptionPanel((v) => !v)}
              aria-expanded={showCaptionPanel}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
            >
              כיתוב והאשטאגים
            </button>
          ) : null}
          <button
            type="button"
            onClick={onChangeSettings}
            className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="חוזרים לאשף — הקרוסלה נשמרת"
          >
            הגדרות אשף
          </button>
        </div>
      </div>

      {showCaptionPanel && hasCaptionPack ? (
        <div className="px-3 pb-3 md:px-4 space-y-3 border-t border-gray-100 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-900/40">
          {explanationText ? (
            <div className="pt-3">
              <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100 mb-1.5">
                למה החבילה הזו
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
                {explanationText}
              </p>
            </div>
          ) : null}

          {caption.trim() ? (
            <div className={explanationText ? '' : 'pt-3'}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100">
                  כיתוב לפוסט
                </h3>
                <button
                  type="button"
                  onClick={() => void copyText(caption, 'הכיתוב הועתק')}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  העתק
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
                {caption}
              </p>
            </div>
          ) : null}

          {hashtags.length > 0 ? (
            <div className={caption.trim() || explanationText ? '' : 'pt-3'}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100">
                  האשטאגים
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(hashtagLine, 'ההאשטאגים הועתקו')
                  }
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  העתק
                </button>
              </div>
              <p className="text-xs text-sky-700 dark:text-sky-300/90 leading-relaxed break-words">
                {hashtagLine}
              </p>
            </div>
          ) : null}

          {copyFeedback ? (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-300">
              {copyFeedback}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
