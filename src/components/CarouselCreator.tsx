'use client';

import { useState } from 'react';
import CarouselRenderer, { Slide } from '@/components/CarouselRenderer';
import CarouselForm from '@/components/CarouselForm';
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
  userName
}: CarouselCreatorProps) {
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const handleGenerate = async (data: any) => {
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
    } catch (error: any) {
      console.error(error);
      alert(`אירעה שגיאה ביצירת הקרוסלה: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!slides) {
    return isLoading ? (
      <SkeletonLoader />
    ) : (
      <div className="p-8 max-w-4xl mx-auto">
        <header className="mb-10 text-center relative">
          {userName && <div className="text-indigo-600 dark:text-indigo-400 font-bold mb-4">שלום, {userName} 👋</div>}
          <h1 className="text-4xl md:text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 dark:from-indigo-400 to-purple-600 dark:to-purple-400">יצירת קרוסלה חדשה</h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl font-medium">הזן פרטים וקבל קרוסלה מוכנה תוך שניות</p>
        </header>
        <CarouselForm 
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
      <div className="p-8 max-w-3xl mx-auto mt-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <h2 className="text-3xl font-black mb-6 text-indigo-600 dark:text-indigo-400">היי! הנה מה שהכנתי עבורך 💡</h2>
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-8 bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
          {explanation}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsApproved(true)}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-lg"
          >
            מעולה, בוא נראה את הקרוסלה! ➤
          </button>
          <button 
            onClick={() => { setSlides(null); setExplanation(null); }}
            className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-bold rounded-lg transition-colors text-lg"
          >
            חזור וערוך פרטים
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen fixed inset-0 z-50 bg-white dark:bg-gray-900">
      <CarouselRenderer slides={slides} brandColor={brandColor} onGoBack={() => { setSlides(null); setExplanation(null); setIsApproved(false); }} />
    </div>
  );
}
