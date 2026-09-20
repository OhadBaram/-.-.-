'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import CarouselRenderer, { Slide } from '@/components/CarouselRenderer';
import CarouselForm from '@/components/CarouselForm';
import SkeletonLoader from '@/components/SkeletonLoader';

export default function Home() {
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
    <main className="min-h-screen p-8 bg-gray-50" dir="rtl">
      <div className="absolute top-4 left-4">
        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">שלום, {session.user?.name}</span>
            <a href="/dashboard" className="text-sm underline text-indigo-600 hover:text-indigo-800">לוח בקרה</a>
            <button onClick={() => signOut()} className="text-sm underline text-indigo-600 hover:text-indigo-800">התנתק</button>
          </div>
        ) : (
          <button onClick={() => signIn('google')} className="text-sm underline text-indigo-600 hover:text-indigo-800">התחברות</button>
        )}
      </div>

      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-1 text-gray-900">קרוסל. איי. אי</h1>
        <p className="text-md font-medium text-indigo-600 mb-6">מבית בינה לתעשייה</p>
        <p className="text-gray-600 text-lg">הזן פרטים וקבל קרוסלה מוכנה תוך שניות</p>
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
