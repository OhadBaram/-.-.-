import React from 'react';

export default function SkeletonLoader() {
  const skeletonSlides = [1, 2, 3];

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 animate-pulse mb-2">מייצר קרוסלה...</h2>
        <p className="text-gray-500 animate-pulse">ה-AI שלנו מכין עבורך תוכן איכותי, זה ייקח מספר שניות</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skeletonSlides.map((index) => (
          <div key={index} className="border p-2 rounded-lg shadow-sm bg-white">
            <div 
              className="w-full max-w-sm rounded bg-gray-100 animate-pulse flex flex-col justify-center items-center gap-6 p-8"
              style={{ aspectRatio: '1080/1350' }}
            >
              <div className="w-3/4 h-8 bg-gray-200 rounded-md"></div>
              <div className="w-5/6 h-8 bg-gray-200 rounded-md"></div>
              <div className="w-2/3 h-8 bg-gray-200 rounded-md"></div>
              
              <div className="mt-8 flex gap-2">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
