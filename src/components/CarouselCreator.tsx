'use client';

import { useState } from 'react';
import CarouselRenderer, { Slide } from '@/components/CarouselRenderer';
import CreationWizard, {
  type CreationWizardSubmitPayload,
} from '@/components/CreationWizard';
import SkeletonLoader from '@/components/SkeletonLoader';

interface CarouselCreatorProps {
  userName?: string;
  initialWebsiteUrl: string;
  initialReferenceLink1: string;
  initialReferenceLink2: string;
  initialReferenceLink3: string;
  brandColor: string;
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

  const resetPackage = () => {
    setSlides(null);
    setExplanation(null);
    setCaption('');
    setHashtags([]);
    setCopyFeedback('');
    setIsApproved(false);
  };

  const handleGenerate = async (data: CreationWizardSubmitPayload) => {
    setIsLoading(true);

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
      if (result.explanation) setExplanation(result.explanation);
      else setIsApproved(true);
    } catch (error: unknown) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : 'שגיאה לא ידועה';
      alert(`אירעה שגיאה ביצירת הקרוסלה: ${message}`);
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

  if (!slides) {
    return isLoading ? (
      <div className="min-h-screen bg-[#0c0f14] flex items-center justify-center p-4">
        <SkeletonLoader />
      </div>
    ) : (
      <div className="p-3 md:p-6 max-w-6xl mx-auto">
        <CreationWizard
          userName={userName}
          onSubmit={handleGenerate}
          isLoading={isLoading}
          initialWebsiteUrl={initialWebsiteUrl}
          initialReferenceLink1={initialReferenceLink1}
          initialReferenceLink2={initialReferenceLink2}
          initialReferenceLink3={initialReferenceLink3}
        />
      </div>
    );
  }

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
            onClick={resetPackage}
            className="py-3 px-6 bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 font-bold rounded-xl transition-colors text-lg"
          >
            חזרה לאשף
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen fixed inset-0 z-50 bg-white dark:bg-gray-900">
      <CarouselRenderer
        slides={slides}
        brandColor={brandColor}
        onGoBack={resetPackage}
      />
    </div>
  );
}
