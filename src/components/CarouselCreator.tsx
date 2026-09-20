'use client';

import { useState } from 'react';
import CarouselRenderer, { Slide } from '@/components/CarouselRenderer';
import CarouselForm from '@/components/CarouselForm';
import SkeletonLoader from '@/components/SkeletonLoader';

interface CarouselCreatorProps {
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
  brandColor
}: CarouselCreatorProps) {
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      <CarouselForm 
        onSubmit={handleGenerate} 
        isLoading={isLoading} 
        initialWebsiteUrl={initialWebsiteUrl}
        initialReferenceLink1={initialReferenceLink1}
        initialReferenceLink2={initialReferenceLink2}
        initialReferenceLink3={initialReferenceLink3}
      />
    );
  }

  return (
    <div className="flex flex-col items-center">
      <button 
        onClick={() => setSlides(null)}
        className="mb-6 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
      >
        חזור ליצירת קרוסלה חדשה
      </button>
      <CarouselRenderer slides={slides} brandColor={brandColor} />
    </div>
  );
}
