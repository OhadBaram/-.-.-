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
  const [isApproved, setIsApproved] = useState(false);

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
    return (
      <div
        className="p-6 md:p-8 max-w-3xl mx-auto mt-6 md:mt-10 rounded-3xl border border-white/10 bg-[#111827] shadow-2xl"
        dir="rtl"
      >
        <h2 className="text-2xl md:text-3xl font-black mb-5 text-indigo-300">
          הנה מה שהכנתי עבורך
        </h2>
        <div className="text-zinc-300 text-lg leading-relaxed mb-8 bg-indigo-500/10 p-6 rounded-2xl border border-indigo-400/20">
          {explanation}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setIsApproved(true)}
            className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-colors text-lg"
          >
            מעולה, בוא נראה את הקרוסלה
          </button>
          <button
            onClick={() => {
              setSlides(null);
              setExplanation(null);
            }}
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
        onGoBack={() => {
          setSlides(null);
          setExplanation(null);
          setIsApproved(false);
        }}
      />
    </div>
  );
}
