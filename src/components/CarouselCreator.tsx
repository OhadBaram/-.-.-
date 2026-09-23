'use client';

import { useState } from 'react';
import CarouselRenderer, { Slide } from '@/components/CarouselRenderer';
import CreationWizard, {
  type CreationWizardSubmitPayload,
} from '@/components/CreationWizard';
import FastPathWizard from '@/components/FastPathWizard';
import type { CreationSubmitPayload } from '@/lib/creation-flow/build-payload';
import SkeletonLoader from '@/components/SkeletonLoader';
import WizardSummaryBar from '@/components/WizardSummaryBar';
import { type WizardPackageMeta } from '@/lib/wizard';
import {
  clampPalette,
  parseBrandPalette,
  primaryBrandColor,
  type BrandPalette,
} from '@/lib/brand-palette';
import { applyCoverImageToSlides } from '@/lib/contracts/cover-image';
import {
  EMPTY_WIZARD_DRAFT,
  normalizeWizardDraft,
  type WizardSharedDraft,
} from '@/lib/creation-flow/wizard-draft';
import {
  DEFAULT_PUBLISH_TARGET,
  parsePublishTarget,
  type PublishTarget,
} from '@/lib/contracts/publish-target';
import type { BrandLearnedFacts } from '@/lib/brand-learned-summary';

interface CarouselCreatorProps {
  userName?: string;
  initialWebsiteUrl: string;
  initialReferenceLink1: string;
  initialReferenceLink2: string;
  initialReferenceLink3: string;
  brandColor: string;
  learnedBrand?: BrandLearnedFacts;
}

function metaFromSubmit(
  data: CreationWizardSubmitPayload | CreationSubmitPayload
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
  learnedBrand,
}: CarouselCreatorProps) {
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [wizardMeta, setWizardMeta] = useState<WizardPackageMeta | null>(null);
  const [showWizardOverDraft, setShowWizardOverDraft] = useState(false);
  const [publishTarget, setPublishTarget] = useState<PublishTarget>(
    DEFAULT_PUBLISH_TARGET
  );
  const [wizardMode, setWizardMode] = useState<'fast' | 'full'>('fast');
  const [wizardDraft, setWizardDraft] =
    useState<WizardSharedDraft>(EMPTY_WIZARD_DRAFT);
  const [brandPalette, setBrandPalette] = useState<BrandPalette>(() =>
    parseBrandPalette(brandColor)
  );

  const hasDraft = Boolean(slides && slides.length > 0);

  const clearPackage = () => {
    setSlides(null);
    setExplanation(null);
    setCaption('');
    setHashtags([]);
    setWizardMeta(null);
    setShowWizardOverDraft(false);
    setPublishTarget(DEFAULT_PUBLISH_TARGET);
  };

  const goToWizardKeepDraft = () => {
    setShowWizardOverDraft(true);
  };

  const resumeEditor = () => {
    if (!hasDraft) return;
    setShowWizardOverDraft(false);
  };

  const discardDraftAndStayInWizard = () => {
    const ok = window.confirm(
      'למחוק את הקרוסלה שבעריכה ולהתחיל מחדש באשף? הפעולה אינה הפיכה.'
    );
    if (!ok) return;
    clearPackage();
  };

  const handleGenerate = async (
    data: CreationWizardSubmitPayload | CreationSubmitPayload
  ) => {
    if (hasDraft) {
      const ok = window.confirm(
        'יצירה מחדש תחליף את הקרוסלה שבעריכה. להמשיך?'
      );
      if (!ok) return;
    }

    const target = parsePublishTarget(data.publishTarget);
    setIsLoading(true);
    setShowWizardOverDraft(false);
    setWizardMeta(metaFromSubmit(data));
    setPublishTarget(target);
    if (data.brandColors) {
      setBrandPalette(clampPalette(data.brandColors));
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          publishTarget: target,
          coverImageDataUrl: data.coverImageDataUrl,
          coverImageApplyTo: data.coverImageApplyTo ?? 'first',
          flowVariant: data.flowVariant ?? 'full',
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'API error');
      }

      const rawSlides = Array.isArray(result.slides) ? result.slides : [];
      const withCover = applyCoverImageToSlides(
        rawSlides as Slide[],
        data.coverImageDataUrl,
        data.coverImageApplyTo ?? 'first'
      );

      setSlides(withCover);
      setCaption(typeof result.caption === 'string' ? result.caption : '');
      setHashtags(Array.isArray(result.hashtags) ? result.hashtags : []);
      setPublishTarget(parsePublishTarget(result.publishTarget ?? target));
      if (result.wizardMeta && typeof result.wizardMeta === 'object') {
        setWizardMeta({
          slideCount: result.wizardMeta.slideCount ?? data.slideCount,
          density: result.wizardMeta.density ?? data.density,
          visualStyle: result.wizardMeta.visualStyle ?? data.visualStyle,
          visualStyleCustom:
            result.wizardMeta.visualStyleCustom ?? data.visualStyleCustom,
          directionTitle:
            result.wizardMeta.directionTitle ??
            data.narrativeDirection?.title ??
            null,
        });
      }
      setExplanation(
        typeof result.explanation === 'string' && result.explanation.trim()
          ? result.explanation
          : null
      );
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

  const wizardNode = (
    <div
      className={
        wizardMode === 'full'
          ? 'p-3 md:p-6 max-w-6xl mx-auto space-y-3 lg:flex lg:h-[calc(100dvh-1.5rem)] lg:max-h-[calc(100dvh-1.5rem)] lg:min-h-0 lg:flex-col lg:space-y-0 lg:gap-3'
          : 'p-3 md:p-6 max-w-6xl mx-auto space-y-3'
      }
    >
      <div
        className="md:hidden rounded-2xl border border-amber-300/70 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-700/50 px-4 py-3 text-center"
        role="note"
        dir="rtl"
      >
        <p className="text-sm font-bold text-amber-950 dark:text-amber-100">
          מומלץ לפתוח במחשב
        </p>
        <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mt-1 leading-snug">
          יצירה אפשרית גם בטלפון, אבל עריכת צבעים, גופן ותצוגה מקדימה נוחים הרבה
          יותר במסך רחב.
        </p>
      </div>

      {hasDraft && showWizardOverDraft ? (
        <div
          className="shrink-0 rounded-2xl border border-amber-400/40 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
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

      {wizardMode === 'fast' ? (
        <FastPathWizard
          key={`fast-${wizardDraft.topic}-${wizardDraft.publishTarget}`}
          userName={userName}
          onSubmit={handleGenerate}
          isLoading={isLoading}
          initialDraft={wizardDraft}
          onRequestFullPath={(draft) => {
            setWizardDraft(normalizeWizardDraft(draft));
            setWizardMode('full');
          }}
          initialWebsiteUrl={initialWebsiteUrl}
          initialReferenceLink1={initialReferenceLink1}
          initialReferenceLink2={initialReferenceLink2}
          initialReferenceLink3={initialReferenceLink3}
          initialBrandPalette={brandPalette}
          learnedBrand={learnedBrand}
        />
      ) : (
        <div className="space-y-3 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:space-y-0 lg:gap-3">
          <div
            className="shrink-0 rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 flex flex-wrap items-center justify-between gap-3"
            dir="rtl"
          >
            <p className="text-sm text-zinc-300">
              מצב שליטה מלאה — צ׳אט, הגדרות וכיווני תוכן.
            </p>
            <button
              type="button"
              onClick={() => {
                setWizardDraft((prev) => normalizeWizardDraft(prev));
                setWizardMode('fast');
              }}
              className="text-sm font-bold text-sky-300 hover:text-sky-200 underline underline-offset-2"
            >
              חזרה למסלול המהיר
            </button>
          </div>
          <div className="min-h-0 lg:h-full lg:flex-1">
            <CreationWizard
              key={`full-${wizardDraft.topic}`}
              userName={userName}
              onSubmit={handleGenerate}
              isLoading={isLoading}
              initialTopic={wizardDraft.topic}
              onTopicChange={(topic) =>
                setWizardDraft((prev) => normalizeWizardDraft({ topic }, prev))
              }
              initialWebsiteUrl={initialWebsiteUrl}
              initialReferenceLink1={initialReferenceLink1}
              initialReferenceLink2={initialReferenceLink2}
              initialReferenceLink3={initialReferenceLink3}
              initialBrandPalette={brandPalette}
              learnedBrand={learnedBrand}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c0f14] flex items-center justify-center p-4">
        <SkeletonLoader />
      </div>
    );
  }

  if (!hasDraft || showWizardOverDraft) {
    return wizardNode;
  }

  return (
    <div className="w-full h-[100dvh] fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      {wizardMeta ? (
        <WizardSummaryBar
          meta={wizardMeta}
          onChangeSettings={goToWizardKeepDraft}
          caption={caption}
          hashtags={hashtags}
          explanation={explanation}
        />
      ) : null}
      <div className="flex-1 min-h-0 relative">
        <CarouselRenderer
          slides={slides!}
          brandColor={primaryBrandColor(brandPalette)}
          brandPalette={brandPalette}
          onBrandPaletteChange={setBrandPalette}
          onGoBack={goToWizardKeepDraft}
          publishTarget={publishTarget}
          onPublishTargetChange={setPublishTarget}
        />
      </div>
    </div>
  );
}
