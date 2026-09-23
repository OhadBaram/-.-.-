'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureHttps } from '@/lib/normalize-url';
import BrandLearnedSummary from '@/components/BrandLearnedSummary';
import { buildBrandLearnedFacts } from '@/lib/brand-learned-summary';
import type { ScrapeUrlResult } from '@/lib/scrape-result';
import { isInstagramUrl } from '@/lib/reference-links';

export default function OnboardingPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  
  // Step 1: Personal
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Step 2: URLs
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [referenceLink1, setReferenceLink1] = useState('');
  
  // Step 3: Analysis
  const [brandIdentity, setBrandIdentity] = useState('');
  const [scrapeReport, setScrapeReport] = useState<ScrapeUrlResult[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const learnedFacts = useMemo(
    () =>
      buildBrandLearnedFacts({
        websiteUrl,
        referenceLink1,
        brandIdentity,
        scrapeReport,
      }),
    [websiteUrl, referenceLink1, brandIdentity, scrapeReport]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setError('יש למלא שם וטלפון');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // נרמול לפני שליחה: דומיין בלי פרוטוקול נדחה בוולידציית הדפדפן
    const normalizedWebsite = ensureHttps(websiteUrl);
    const normalizedReference = ensureHttps(referenceLink1);
    setWebsiteUrl(normalizedWebsite);
    setReferenceLink1(normalizedReference);
    
    // אם אין קישורים — דילוג על ניתוח ושמירה סופית
    if (!normalizedWebsite && !normalizedReference) {
      handleFinalSave('', '', '');
      return;
    }

    setStep(3);
    setIsAnalyzing(true);
    
    try {
      const res = await fetch('/api/analyze-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: normalizedWebsite,
          referenceLink1: normalizedReference,
        }),
      });

      if (!res.ok) throw new Error('שגיאה בניתוח המותג');
      
      const data = await res.json();
      setBrandIdentity(data.brandIdentity || '');
      if (Array.isArray(data.scrapeReport)) {
        setScrapeReport(data.scrapeReport);
      }
    } catch (err: any) {
      console.error(err);
      setError('לא הצלחנו לנתח את הקישורים. תוכל להזין את תיאור העסק ידנית.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinalSave = async (
    finalBrandIdentity = brandIdentity,
    finalWebsiteUrl = websiteUrl,
    finalReferenceLink1 = referenceLink1
  ) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/user/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          phone,
          websiteUrl: ensureHttps(finalWebsiteUrl),
          referenceLink1: ensureHttps(finalReferenceLink1),
          brandIdentity: finalBrandIdentity
        }),
      });

      if (!res.ok) throw new Error('Failed to save profile');

      router.push('/dashboard/create');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'אירעה שגיאה בשמירת הנתונים');
      setLoading(false);
    }
  };

  const refIsInstagram = isInstagramUrl(referenceLink1);

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50" dir="rtl">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl w-full max-w-lg border border-indigo-50">
        
        {/* Progress steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${step >= 1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>1</div>
            <div className={`w-10 h-1 rounded transition-colors ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-100'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${step >= 2 ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>2</div>
            <div className={`w-10 h-1 rounded transition-colors ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-100'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${step >= 3 ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>3</div>
          </div>
        </div>

        {error && <div className="text-red-600 text-sm mb-6 text-center bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-gray-900 mb-2">ברוך הבא! 👋</h1>
              <p className="text-gray-500">בוא נכיר קצת לפני שנתחיל ליצור.</p>
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">איך קוראים לך?</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-colors" placeholder="ישראל ישראלי" required />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-2">מה מספר הטלפון שלך?</label>
              <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left bg-gray-50 focus:bg-white transition-colors" placeholder="050-0000000" dir="ltr" required />
            </div>

            <button type="submit" className="w-full py-4 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg mt-8">
              המשך לשלב הבא
            </button>
          </form>
        )}

        {step === 2 && (
          // ולידציית דפדפן כבויה כאן — הנרמול קורה בטיפול בשליחה
          <form noValidate onSubmit={handleNextStep2} className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-block bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full text-sm mb-3">למידת מותג אוטומטית</div>
              <h1 className="text-2xl font-black text-gray-900 mb-3">תן ל-AI ללמוד אותך 🧠</h1>
              <p className="text-gray-600 text-sm leading-relaxed">
                <span className="font-bold text-indigo-600">שלב זה מומלץ מאוד (אך אופציונלי).</span><br/>
                נקרא את האתר שלכם ונלמד טון וזהות. פוסטי אינסטגרם לא נקראים
                אוטומטית — אפשר לשמור קישור כרמז חלש (שם משתמש) בלבד.
              </p>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">כתובת אתר העסק</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  onBlur={() => setWebsiteUrl(ensureHttps(websiteUrl))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left bg-gray-50 focus:bg-white transition-colors"
                  placeholder="https://your-website.com"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">קישור לפוסט/קרוסלה אהובה באינסטגרם</label>
                <input
                  type="url"
                  value={referenceLink1}
                  onChange={(e) => setReferenceLink1(e.target.value)}
                  onBlur={() => setReferenceLink1(ensureHttps(referenceLink1))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left bg-gray-50 focus:bg-white transition-colors"
                  placeholder="https://instagram.com/p/..."
                  dir="ltr"
                />
                {refIsInstagram ? (
                  <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
                    פוסטי אינסטגרם לא נקראים אוטומטית. נחלץ לכל היותר שם משתמש
                    מהכתובת כרמז חלש. מומלץ גם אתר עסקי או תיאור ידני בשלב הבא.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setStep(1)} className="w-1/3 py-4 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                חזור
              </button>
              <button type="submit" className="w-2/3 py-4 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md">
                {(websiteUrl || referenceLink1) ? 'נתח את המותג שלי ✨' : 'דלג והמשך'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            {isAnalyzing ? (
              <div className="py-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">קוראים את האתר שלכם...</h2>
                <p className="text-gray-500 text-sm leading-relaxed max-w-sm">זה עשוי לקחת כ־15 שניות. קישורי אינסטגרם לא ייקראו אוטומטית — רק האתר (אם הוזן).</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-2">
                  <h1 className="text-2xl font-black text-gray-900 mb-2">הנה מה שלמדנו עליך</h1>
                  <p className="text-gray-600 text-sm">בדקו את שקיפות הלמידה למטה, ואז דייקו את זהות המותג.</p>
                </div>

                <BrandLearnedSummary facts={learnedFacts} variant="onboarding" />

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">זהות המותג וטון הדיבור:</label>
                  <textarea 
                    value={brandIdentity} 
                    onChange={(e) => setBrandIdentity(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white min-h-[150px] leading-relaxed resize-y"
                    placeholder="תאר את העסק, קהל היעד והסגנון..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setStep(2)} className="w-1/3 py-4 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                    חזור
                  </button>
                  <button onClick={() => handleFinalSave()} disabled={loading} className="w-2/3 py-4 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-lg disabled:opacity-50">
                    {loading ? 'שומר...' : 'שמור ובוא ניצור קרוסלה! 🚀'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
