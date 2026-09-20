'use client';

import React, { useState } from 'react';

interface CarouselFormProps {
  onSubmit: (data: { 
    topic: string; 
    audience: string; 
    goal: string; 
    brand: string;
    slideCount: number;
    websiteUrl?: string;
    referenceLink1?: string;
    referenceLink2?: string;
    referenceLink3?: string;
  }) => void;
  isLoading: boolean;
  initialWebsiteUrl?: string;
  initialReferenceLink1?: string;
  initialReferenceLink2?: string;
  initialReferenceLink3?: string;
}

const SLIDE_COUNT_OPTIONS = [3, 5, 7, 8, 10, 12, 15] as const;

export default function CarouselForm({ 
  onSubmit, 
  isLoading,
  initialWebsiteUrl = '',
  initialReferenceLink1 = '',
  initialReferenceLink2 = '',
  initialReferenceLink3 = ''
}: CarouselFormProps) {
  const [topic, setTopic] = useState('');
  
  const [audienceSelect, setAudienceSelect] = useState('');
  const [audienceCustom, setAudienceCustom] = useState('');
  
  const [goalSelect, setGoalSelect] = useState('');
  const [goalCustom, setGoalCustom] = useState('');
  
  const [brandSelect, setBrandSelect] = useState('');
  const [brandCustom, setBrandCustom] = useState('');

  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl);
  const [referenceLink1, setReferenceLink1] = useState(initialReferenceLink1);
  const [referenceLink2, setReferenceLink2] = useState(initialReferenceLink2);
  const [referenceLink3, setReferenceLink3] = useState(initialReferenceLink3);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [slideCount, setSlideCount] = useState(8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalAudience = audienceSelect === 'other' ? audienceCustom : audienceSelect;
    const finalGoal = goalSelect === 'other' ? goalCustom : goalSelect;
    const finalBrand = brandSelect === 'other' ? brandCustom : brandSelect;

    onSubmit({ 
      topic, 
      audience: finalAudience, 
      goal: finalGoal, 
      brand: finalBrand,
      slideCount,
      websiteUrl,
      referenceLink1,
      referenceLink2,
      referenceLink3
    });
  };

  const inputClasses = "w-full text-gray-900 bg-white border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      
      <div>
        <label className="block text-gray-800 font-bold mb-2">נושא הפוסט (חובה)</label>
        <input 
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          className={inputClasses}
          placeholder="לדוגמה: 5 טיפים לניהול זמן אפקטיבי"
        />
        <p className="text-xs text-gray-500 mt-1">ככל שתהיה ספציפי יותר, כך ה-AI יכתוב תוכן מדויק יותר.</p>
      </div>

      <div>
        <label className="block text-gray-800 font-bold mb-2">
          מספר שקפים
          <span className="mr-2 text-indigo-600 font-black">{slideCount}</span>
        </label>
        <input
          type="range"
          min={3}
          max={15}
          step={1}
          value={slideCount}
          onChange={(e) => setSlideCount(Number(e.target.value))}
          className="w-full accent-indigo-600 cursor-pointer"
          aria-label="מספר שקפים בקרוסלה"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {SLIDE_COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSlideCount(n)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                slideCount === n
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">בחרו כמה שקפים לייצר לפני יצירת הקרוסלה (3–15).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 font-bold mb-2 text-sm">מטרת הפוסט (אופציונלי)</label>
          <select 
            value={goalSelect} 
            onChange={(e) => setGoalSelect(e.target.value)}
            className={inputClasses}
          >
            <option value="">בחר מטרה...</option>
            <option value="חינוך ומתן ערך">חינוך ומתן ערך</option>
            <option value="מעורבות ותגובות (Engagement)">מעורבות ותגובות (Engagement)</option>
            <option value="מכירות והמרות (Sales)">מכירות והמרות (Sales)</option>
            <option value="חשיפה ומיתוג (Awareness)">חשיפה ומיתוג (Awareness)</option>
            <option value="other">מטרה אחרת (הזן ידנית)</option>
          </select>
          {goalSelect === 'other' && (
            <input type="text" value={goalCustom} onChange={(e) => setGoalCustom(e.target.value)} placeholder="הקלד מטרה..." className={`mt-2 ${inputClasses}`} required />
          )}
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2 text-sm">קהל יעד (אופציונלי)</label>
          <select 
            value={audienceSelect} 
            onChange={(e) => setAudienceSelect(e.target.value)}
            className={inputClasses}
          >
            <option value="">בחר קהל...</option>
            <option value="עסקים קטנים ובינוניים (B2B)">עסקים קטנים (B2B)</option>
            <option value="צרכנים פרטיים (B2C)">צרכנים (B2C)</option>
            <option value="יזמים וסטארטאפים">יזמים וסטארטאפים</option>
            <option value="יוצרי תוכן ומשפיענים">יוצרי תוכן</option>
            <option value="other">קהל אחר (הזן ידנית)</option>
          </select>
          {audienceSelect === 'other' && (
            <input type="text" value={audienceCustom} onChange={(e) => setAudienceCustom(e.target.value)} placeholder="הקלד קהל יעד..." className={`mt-2 ${inputClasses}`} required />
          )}
        </div>
      </div>

      <div>
        <label className="block text-gray-700 font-bold mb-2 text-sm">סגנון וטון דיבור (אופציונלי)</label>
        <select 
          value={brandSelect} 
          onChange={(e) => setBrandSelect(e.target.value)}
          className={inputClasses}
        >
          <option value="">בחר סגנון...</option>
          <option value="מקצועי, רשמי וסמכותי">מקצועי ורשמי</option>
          <option value="קליל, בגובה העיניים והומוריסטי">קליל והומוריסטי</option>
          <option value="חדשני, טכנולוגי ופורץ דרך">חדשני וטכנולוגי</option>
          <option value="אישי, אותנטי ומרגש">אישי ואותנטי</option>
          <option value="other">סגנון אחר (הזן ידנית)</option>
        </select>
        {brandSelect === 'other' && (
          <input type="text" value={brandCustom} onChange={(e) => setBrandCustom(e.target.value)} placeholder="הקלד סגנון..." className={`mt-2 ${inputClasses}`} required />
        )}
      </div>

      <div className="border-t border-gray-200 pt-4 mt-2">
        <button 
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-indigo-600 font-bold hover:text-indigo-800 transition"
        >
          <span>🧠 למידת מותג אוטומטית ע"י AI (מתקדם)</span>
          <span className="ml-2">{showAdvanced ? '▼' : '◀'}</span>
        </button>
        
        {showAdvanced && (
          <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl space-y-4 border border-indigo-100">
            <div className="bg-white p-3 rounded border border-indigo-200 text-sm text-indigo-800 font-medium">
              הקישורים למטה נמשכו מתוך <strong>הגדרות מרחב העבודה</strong> שלך, ואנו זוכרים אותם (Cache) כדי לייצר לך קרוסלות מיד. <br/>
              אתה יכול לשנות או למחוק אותם כאן באופן חד-פעמי אם הקרוסלה הזו מיועדת לעסק אחר!
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">כתובת אתר העסק</label>
              <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://your-website.com" className={inputClasses} />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">קישור לפוסט/קרוסלה שאהבת 1</label>
              <input type="url" value={referenceLink1} onChange={(e) => setReferenceLink1(e.target.value)} placeholder="לינק לאינסטגרם..." className={inputClasses} />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">קישור לפוסט/קרוסלה שאהבת 2</label>
              <input type="url" value={referenceLink2} onChange={(e) => setReferenceLink2(e.target.value)} placeholder="לינק לאינסטגרם..." className={inputClasses} />
            </div>
          </div>
        )}
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        className="mt-4 w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-none transition-all duration-200"
      >
        {isLoading ? 'מייצר קרוסלה (זה עשוי לקחת חצי דקה)...' : '✨ צור קרוסלה'}
      </button>
    </form>
  );
}
