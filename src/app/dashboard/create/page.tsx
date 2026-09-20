'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import CarouselRenderer, { Slide } from '@/components/CarouselRenderer';
import CarouselForm from '@/components/CarouselForm';
import SkeletonLoader from '@/components/SkeletonLoader';
import Link from 'next/link';

export default function CreateCarouselPage() {
  const { data: session } = useSession();
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (data: { topic: string; audience: string; goal: string; brand: string }) => {
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

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50" dir="rtl">
      <header className="mb-10 text-center relative">
        <div className="absolute top-0 right-0">
          <Link href="/dashboard" className="text-sm underline text-indigo-600 hover:text-indigo-800">
            חזרה ללוח הבקרה
          </Link>
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">יצירת קרוסלה חדשה</h1>
        <p className="text-gray-600 text-lg md:text-xl font-medium">הזן פרטים וקבל קרוסלה מוכנה תוך שניות</p>
      </header>
      
      {!slides ? (
        isLoading ? (
          <SkeletonLoader />
        ) : (
          <CarouselForm onSubmit={handleGenerate} isLoading={isLoading} />
        )
      ) : (
        <div className="flex flex-col items-center">
          <button 
            onClick={() => setSlides(null)}
            className="mb-6 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            חזור ליצירת קרוסלה חדשה
          </button>
          <CarouselRenderer slides={slides} />
        </div>
      )}
    </main>
  );
}
