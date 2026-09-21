'use client';

import { useMemo, useState } from 'react';
import {
  DEFAULT_WIZARD_OPTIONS,
  type WizardOptions,
} from '@/lib/wizard';
import {
  clampPalette,
  parseBrandPalette,
  recommendPaletteLocal,
  type BrandPalette,
} from '@/lib/brand-palette';
import ImagePickerControl from '@/components/ImagePickerControl';
import {
  DEFAULT_PUBLISH_TARGET,
  getPublishTargetProfile,
  PUBLISH_TARGETS,
  type PublishTarget,
} from '@/lib/contracts/publish-target';
import {
  buildCreationSubmitPayload,
  defaultNarrativeDirection,
  type CreationSubmitPayload,
} from '@/lib/creation-flow/build-payload';
import { recommendedSlideCountForTopic } from '@/lib/wizard-intake';

const QUICK_TOPICS = [
  '5 טעויות שמרחיקות לקוחות מהעסק',
  'טיפים לשבוע עבודה פרודוקטיבי',
  'לפני ואחרי: שינוי קטן עם השפעה גדולה',
  'שאלות־תשובות שהלקוחות שואלים כל הזמן',
] as const;

type FastStep = 'target' | 'topic' | 'image';

export interface FastPathWizardProps {
  userName?: string;
  isLoading: boolean;
  onSubmit: (data: CreationSubmitPayload) => void;
  onRequestFullPath: () => void;
  initialWebsiteUrl?: string;
  initialReferenceLink1?: string;
  initialReferenceLink2?: string;
  initialReferenceLink3?: string;
  initialBrandPalette?: BrandPalette | string;
}

function initialPalette(
  initialBrandPalette?: BrandPalette | string
): BrandPalette {
  if (Array.isArray(initialBrandPalette)) {
    return clampPalette(initialBrandPalette);
  }
  if (typeof initialBrandPalette === 'string') {
    return parseBrandPalette(initialBrandPalette);
  }
  return recommendPaletteLocal({ visualStyle: 'minimal' });
}

/**
 * מסלול יצירה מהיר: יעד → נושא → תמונה אופציונלית → יצירה.
 * משתמש באותו חוזה submit כמו המסלול המלא.
 */
export default function FastPathWizard({
  userName,
  isLoading,
  onSubmit,
  onRequestFullPath,
  initialWebsiteUrl = '',
  initialReferenceLink1 = '',
  initialReferenceLink2 = '',
  initialReferenceLink3 = '',
  initialBrandPalette,
}: FastPathWizardProps) {
  const [step, setStep] = useState<FastStep>('target');
  const [publishTarget, setPublishTarget] = useState<PublishTarget>(
    DEFAULT_PUBLISH_TARGET
  );
  const [topic, setTopic] = useState('');
  const [coverImageDataUrl, setCoverImageDataUrl] = useState<string | null>(
    null
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [options] = useState<WizardOptions>(DEFAULT_WIZARD_OPTIONS);
  const [brandPalette] = useState<BrandPalette>(() =>
    initialPalette(initialBrandPalette)
  );

  const topicTrimmed = topic.trim();
  const canContinueTopic = topicTrimmed.length > 0;

  const stepIndex = step === 'target' ? 1 : step === 'topic' ? 2 : 3;

  const slideHint = useMemo(() => {
    if (!topicTrimmed) return options.slideCount;
    return recommendedSlideCountForTopic(topicTrimmed);
  }, [topicTrimmed, options.slideCount]);

  const selectTarget = (target: PublishTarget) => {
    setPublishTarget(target);
    setFormError(null);
    setStep('topic');
  };

  const goToImage = () => {
    if (!canContinueTopic) {
      setFormError('כתבו נושא לקרוסלה כדי להמשיך.');
      return;
    }
    setFormError(null);
    setStep('image');
  };

  const submitFast = (coverOverride?: string | null) => {
    const cover =
      coverOverride === undefined ? coverImageDataUrl : coverOverride;
    try {
      const payload = buildCreationSubmitPayload({
        topic: topicTrimmed,
        options: {
          ...options,
          slideCount: slideHint,
        },
        brandPalette,
        narrativeDirection: defaultNarrativeDirection(topicTrimmed),
        flowVariant: 'fast',
        publishTarget,
        coverImageDataUrl: cover,
        coverImageApplyTo: 'first',
        websiteUrl: initialWebsiteUrl || undefined,
        referenceLink1: initialReferenceLink1 || undefined,
        referenceLink2: initialReferenceLink2 || undefined,
        referenceLink3: initialReferenceLink3 || undefined,
      });
      setFormError(null);
      onSubmit(payload);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'TOPIC_REQUIRED') {
        setFormError('כתבו נושא לקרוסלה כדי להמשיך.');
        setStep('topic');
        return;
      }
      setFormError('לא הצלחנו להתחיל יצירה. בדקו את הפרטים ונסו שוב.');
    }
  };

  return (
    <div
      className="relative mx-auto max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c0f14] text-zinc-100 shadow-2xl"
      dir="rtl"
      style={{ fontFamily: 'Heebo, Assistant, sans-serif' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 100% -10%, rgba(99,102,241,0.22), transparent 55%), linear-gradient(180deg, #0c0f14 0%, #111827 100%)',
        }}
      />

      <div className="relative p-5 md:p-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-bold text-indigo-300/90">
            שלב {stepIndex} מתוך 3 · מסלול מהיר
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            קרוסל. איי. אי
          </h1>
          <p className="text-sm text-zinc-400">
            {userName
              ? `${userName}, ניצור קרוסלה מוכנה בדקות — בלי סיבוב מיותר.`
              : 'ניצור קרוסלה מוכנה בדקות — בלי סיבוב מיותר.'}
          </p>
        </header>

        {step === 'target' ? (
          <section className="space-y-4" aria-labelledby="fast-target-title">
            <div>
              <h2
                id="fast-target-title"
                className="text-lg font-bold text-zinc-50"
              >
                איפה תפרסמו את הקרוסלה?
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                נכוון את הפורמט ואת ההורדה בהתאם. אפשר לשנות אחר כך בעורך.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PUBLISH_TARGETS.map((id) => {
                const profile = getPublishTargetProfile(id);
                const selected = publishTarget === id;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => selectTarget(id)}
                    className={`text-right rounded-2xl border px-4 py-4 transition ${
                      selected
                        ? 'border-sky-400/60 bg-sky-500/15 text-sky-50'
                        : 'border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/5'
                    } disabled:opacity-50`}
                  >
                    <div className="font-black text-base">{profile.labelHe}</div>
                    <p className="text-sm opacity-80 mt-1">{profile.hintHe}</p>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => selectTarget(DEFAULT_PUBLISH_TARGET)}
              className="text-sm font-bold text-zinc-400 hover:text-zinc-200 underline underline-offset-2 disabled:opacity-50"
            >
              עדיין לא בטוחים — נתחיל באינסטגרם
            </button>
          </section>
        ) : null}

        {step === 'topic' ? (
          <section className="space-y-4" aria-labelledby="fast-topic-title">
            <div>
              <h2 id="fast-topic-title" className="text-lg font-bold text-zinc-50">
                על מה הקרוסלה?
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                יעד נבחר: {getPublishTargetProfile(publishTarget).labelHe}
              </p>
            </div>
            <textarea
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (formError) setFormError(null);
              }}
              rows={3}
              placeholder="למשל: 5 טעויות שמרחיקות לקוחות מהעסק"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-400/50"
              disabled={isLoading}
            />
            <div className="flex flex-wrap gap-2">
              {QUICK_TOPICS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setTopic(prompt);
                    setFormError(null);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>
            {formError ? (
              <p className="text-sm text-red-300 font-medium" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isLoading || !canContinueTopic}
                onClick={goToImage}
                className="flex-1 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 disabled:opacity-40 transition"
              >
                המשך
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setStep('target')}
                className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-white/5 disabled:opacity-40"
              >
                חזרה
              </button>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <button
                type="button"
                disabled={isLoading}
                onClick={onRequestFullPath}
                className="font-bold text-sky-300 hover:text-sky-200 underline underline-offset-2 disabled:opacity-40"
              >
                שליטה מלאה (סגנון, כיוון, מספר)
              </button>
            </div>
          </section>
        ) : null}

        {step === 'image' ? (
          <section className="space-y-4" aria-labelledby="fast-image-title">
            <div>
              <h2 id="fast-image-title" className="text-lg font-bold text-zinc-50">
                הוסיפו תמונה אחת
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                זה מה שהופך את הקרוסלה לשלכם. אפשר גם בלי — תמיד אפשר להחליף
                בעורך.
              </p>
            </div>
            <ImagePickerControl
              variant="dropzone"
              value={coverImageDataUrl}
              onChange={setCoverImageDataUrl}
              disabled={isLoading}
            />
            {coverImageDataUrl ? (
              <p className="text-xs text-emerald-300/90 font-medium">
                מעולה. נשים אותה על שקף הפתיחה.
              </p>
            ) : null}
            {formError ? (
              <p className="text-sm text-red-300 font-medium" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => submitFast()}
                className="flex-1 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 disabled:opacity-40 transition"
              >
                {isLoading ? 'יוצרים…' : 'צור חבילה ופתח בעורך'}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setCoverImageDataUrl(null);
                  submitFast(null);
                }}
                className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-white/5 disabled:opacity-40"
              >
                דלגו בינתיים
              </button>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setStep('topic')}
              className="text-sm font-bold text-zinc-400 hover:text-zinc-200 underline underline-offset-2 disabled:opacity-40"
            >
              חזרה לנושא
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
}
