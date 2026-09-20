import React from 'react';

export default function SkeletonLoader() {
  const skeletonSlides = [1, 2, 3];

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full" dir="rtl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-zinc-100 animate-pulse mb-2">
          בונה חבילת קרוסלה…
        </h2>
        <p className="text-zinc-500 animate-pulse">
          שער, שקפי תוכן, הוכחה, סיום, כיתוב והאשטאגים — עוד רגע
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skeletonSlides.map((index) => (
          <div
            key={index}
            className="border border-white/10 p-2 rounded-xl shadow-sm bg-white/5"
          >
            <div
              className="w-full max-w-sm rounded-lg bg-zinc-800/80 animate-pulse flex flex-col justify-center items-center gap-6 p-8"
              style={{ aspectRatio: '1080/1350' }}
            >
              <div className="w-3/4 h-8 bg-zinc-700 rounded-md"></div>
              <div className="w-5/6 h-8 bg-zinc-700 rounded-md"></div>
              <div className="w-2/3 h-8 bg-zinc-700 rounded-md"></div>

              <div className="mt-8 flex gap-2">
                <div className="w-12 h-12 bg-zinc-700 rounded-full"></div>
                <div className="w-12 h-12 bg-zinc-700 rounded-full"></div>
                <div className="w-12 h-12 bg-zinc-700 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
