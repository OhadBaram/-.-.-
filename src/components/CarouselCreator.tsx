'use client';

import { useState } from 'react';
import CarouselRenderer, { Slide } from '@/components/CarouselRenderer';
import CreationWizard, {
  type CreationWizardSubmitPayload,
} from '@/components/CreationWizard';
import SkeletonLoader from '@/components/SkeletonLoader';
import WizardSummaryBar from '@/components/WizardSummaryBar';
import {
  formatWizardSummaryLine,
  type WizardPackageMeta,
} from '@/lib/wizard';
import {
  clampPalette,
  parseBrandPalette,
  primaryBrandColor,
  type BrandPalette,
} from '@/lib/brand-palette';

interface CarouselCreatorProps {
  userName?: string;
  initialWebsiteUrl: string;
  initialReferenceLink1: string;
  initialReferenceLink2: string;
  initialReferenceLink3: string;
  brandColor: string;
}

function metaFromSubmit(
  data: CreationWizardSubmitPayload
): WizardPackageMeta {
  return {
    slideCount: data.slideCount,
    density: data.density,
    visualStyle: data.visualStyle,
    visualStyleCustom: data.visualStyleCustom,
    directionTitle: data.narrativeDirection?.title || null,
  };
}

export default function CarouselCreator({
  initialWebsiteUrl,
  initialReferenceLink1,
  initialReferenceLink2,
  initialReferenceLink3,
  brandColor,
  userName,
}: CarouselCreatorProps) {
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [wizardMeta, setWizardMeta] = useState<WizardPackageMeta | null>(null);
  const [showWizardOverDraft, setShowWizardOverDraft] = useState(false);
  const [brandPalette, setBrandPalette] = useState<BrandPalette>(() =>
    parseBrandPalette(brandColor)
  );

  const hasDraft = Boolean(slides && slides.length > 0);

  const clearPackage = () => {
    setSlides(null);
    setExplanation(null);
    setCaption('');
    setHashtags([]);
    setCopyFeedback('');
    setIsApproved(false);
    setWizardMeta(null);
    setShowWizardOverDraft(false);
  };

  const goToWizardKeepDraft = () => {
    setShowWizardOverDraft(true);
  };

  const resumeEditor = () => {
    if (!hasDraft) return;
    setShowWizardOverDraft(false);
    setIsApproved(true);
    setExplanation(null);
  };

  const discardDraftAndStayInWizard = () => {
    const ok = window.confirm(
      'למחוק את הקרוסלה שבעריכה ולהתחיל מחדש באשף? הפעולה אינה הפיכה.'
    );
    if (!ok) return;
    clearPackage();
  };

  const handleGenerate = async (data: CreationWizardSubmitPayload) => {
    if (hasDraft) {
      const ok = window.confirm(
        'יצירה מחדש תחליף את הקרוסלה שבעריכה. להמשיך?'
      );
      if (!ok) return;
    }

    setIsLoading(true);
    setShowWizardOverDraft(false);
    setWizardMeta(metaFromSubmit(data));
    if (data.brandColors) {
      setBrandPalette(clampPalette(data.brandColors));
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'API error');
      }

      setSlides(result.slides);
      setCaption(typeof result.caption === 'string' ? result.caption : '');
      setHashtags(Array.isArray(result.hashtags) ? result.hashtags : []);
      if (result.wizardMeta && typeof result.wizardMeta === 'object') {
        setWizardMeta({
          slideCount:
            result.wizardMeta.slideCount ?? data.slideCount,
          density: result.wizardMeta.density ?? data.density,
          visualStyle:
            result.wizardMeta.visualStyle ?? data.visualStyle,
          visualStyleCustom:
            result.wizardMeta.visualStyleCustom ??
            data.visualStyleCustom,
          directionTitle:
            result.wizardMeta.directionTitle ??
            data.narrativeDirection?.title ??
            null,
        });
      }
      if (result.explanation) {
        setExplanation(result.explanation);
        setIsApproved(false);
      } else {
        setExplanation(null);
        setIsApproved(true);
      }
    } catch (error: unknown) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : 'שגיאה לא ידועה';
      alert(`אירעה שגיאה ביצירת הקרוסלה: ${message}`);
      if (!hasDraft) setWizardMeta(null);
      else setShowWizardOverDraft(true);
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = async (value: string, okMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback(okMessage);
      setTimeout(() => setCopyFeedback(''), 2200);
    } catch {
      setCopyFeedback('לא הצלחתי להעתיק — סמנו ידנית.');
    }
  };

  const wizardNode = (
    <div className="p-3 md:p-6 max-w-6xl mx-auto space-y-3">
      {hasDraft && showWizardOverDraft ? (
        <div
          className="rounded-2xl border border-amber-400/40 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
          dir="rtl"
        >
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
              הקרוסלה שערכתם שמורה ({slides!.length} שקפים)
            </p>
            <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-0.5">
              אפשר לחזור לעורך בלי לאבד שינויים. יצירה מחדש תחליף אותה.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={resumeEditor}
              className="text-sm font-bold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white transition"
            >
              חזרה לעורך
            </button>
            <button
              type="button"
              onClick={discardDraftAndStayInWizard}
              className="text-sm font-bold px-4 py-2 rounded-xl border border-amber-500/50 text-amber-900 dark:text-amber-100 hover:bg-amber-100/80 dark:hover:bg-amber-900/50 transition"
            >
              מחק והתחל מחדש
            </button>
          </div>
        </div>
      ) : null}

        <CreationWizard
          userName={userName}
          onSubmit={handleGenerate}
          isLoading={isLoading}
          initialWebsiteUrl={initialWebsiteUrl}
          initialReferenceLink1={initialReferenceLink1}
          initialReferenceLink2={initialReferenceLink2}
          initialReferenceLink3={initialReferenceLink3}
          initialBrandPalette={brandPalette}
        />
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c0f14] flex items-center justify-center p-4">
        <SkeletonLoader />
      </div>
    );
  }

  // אשף — מצב ראשוני, או חזרה מהעורך עם טיוטה שמורה
  if (!hasDraft || showWizardOverDraft) {
    return wizardNode;
  }

  // מסך סיכום חבילה לפני העורך
  if (!isApproved && explanation) {
    const hashtagLine = hashtags.join(' ');
    return (
      <div
        className="p-6 md:p-8 max-w-3xl mx-auto mt-6 md:mt-10 rounded-3xl border border-white/10 bg-[#111827] shadow-2xl"
        dir="rtl"
      >
        <h2 className="text-2xl md:text-3xl font-black mb-5 text-indigo-300">
          החבילה מוכנה
        </h2>
        {wizardMeta ? (
          <p className="text-sm text-zinc-400 mb-4">
            {formatWizardSummaryLine(wizardMeta)}
          </p>
        ) : null}
        <div className="text-zinc-300 text-lg leading-relaxed mb-6 bg-indigo-500/10 p-6 rounded-2xl border border-indigo-400/20">
          {explanation}
        </div>

        {(caption || hashtags.length > 0) && (
          <div className="space-y-4 mb-8">
            {caption ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="font-bold text-zinc-100">כיתוב לפוסט</h3>
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(caption, 'הכיתוב הועתק')
                    }
                    className="text-xs font-bold text-indigo-200 hover:text-white transition"
                  >
                    העתק
                  </button>
                </div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {caption}
                </p>
              </div>
            ) : null}

            {hashtags.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="font-bold text-zinc-100">חבילת האשטאגים</h3>
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(hashtagLine, 'ההאשטאגים הועתקו')
                    }
                    className="text-xs font-bold text-indigo-200 hover:text-white transition"
                  >
                    העתק
                  </button>
                </div>
                <p className="text-sm text-sky-200/90 leading-relaxed break-words">
                  {hashtagLine}
                </p>
              </div>
            ) : null}

            {copyFeedback ? (
              <p className="text-xs text-emerald-300/90">{copyFeedback}</p>
            ) : null}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setIsApproved(true)}
            className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-colors text-lg"
          >
            מעולה, בוא נראה את הקרוסלה
          </button>
          <button
            onClick={goToWizardKeepDraft}
            className="py-3 px-6 bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 font-bold rounded-xl transition-colors text-lg"
          >
            חזרה לאשף (הקרוסלה נשמרת)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      {wizardMeta ? (
        <WizardSummaryBar
          meta={wizardMeta}
          onChangeSettings={goToWizardKeepDraft}
          caption={caption}
          hashtags={hashtags}
        />
      ) : null}
      <div className="flex-1 min-h-0 relative">
        <CarouselRenderer
          slides={slides!}
          brandColor={primaryBrandColor(brandPalette)}
          brandPalette={brandPalette}
          onBrandPaletteChange={setBrandPalette}
          onGoBack={goToWizardKeepDraft}
        />
      </div>
    </div>
  );
}
