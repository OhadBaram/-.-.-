import Link from 'next/link';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            תמחור פשוט ומשתלם
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            בחר את המסלול המתאים ביותר לעסק שלך, שדרג או בטל בכל עת.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Freemium Tier */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">חינם</h2>
            <p className="text-gray-500 mb-6 flex-grow">התנסות בסיסית בפלטפורמה, מושלם ליוצרי תוכן מתחילים.</p>
            <div className="text-4xl font-extrabold text-gray-900 mb-6">
              ₪0 <span className="text-lg font-normal text-gray-500">/חודש</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> 3 קרוסלות בחודש
              </li>
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> יצירה בסיסית מבוססת בינה מלאכותית
              </li>
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> הורדה בפורמט תמונות
              </li>
            </ul>
            <Link href="/api/auth/signin" className="w-full py-3 px-4 bg-indigo-50 text-indigo-700 font-bold text-center rounded-lg hover:bg-indigo-100 transition-colors">
              התחל חינם
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-indigo-600 rounded-2xl shadow-xl border border-indigo-700 p-8 flex flex-col transform md:-translate-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">מקצוען (Pro)</h2>
            <p className="text-indigo-100 mb-6 flex-grow">לבעלי עסקים ויועצים שרוצים נוכחות עקבית באינסטגרם.</p>
            <div className="text-4xl font-extrabold text-white mb-6">
              ₪99 <span className="text-xl font-normal text-indigo-200">/חודש</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center text-white">
                <span className="text-indigo-200 ml-2">✓</span> 50 קרוסלות בחודש
              </li>
              <li className="flex items-center text-white">
                <span className="text-indigo-200 ml-2">✓</span> ניהול ספריית מותג וצבעים
              </li>
              <li className="flex items-center text-white">
                <span className="text-indigo-200 ml-2">✓</span> עריכת טקסט ידנית מתקדמת
              </li>
              <li className="flex items-center text-white">
                <span className="text-indigo-200 ml-2">✓</span> מודלי שפה מתקדמים יותר
              </li>
            </ul>
            <Link href="/api/auth/signin" className="w-full py-3 px-4 bg-white text-indigo-600 font-bold text-center rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              שדרג למקצוען
            </Link>
          </div>

          {/* Agency Tier */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">סוכנות (Agency)</h2>
            <p className="text-gray-500 mb-6 flex-grow">לסוכנויות דיגיטל ומנהלי סושיאל שמנהלים מספר לקוחות.</p>
            <div className="text-4xl font-extrabold text-gray-900 mb-6">
              ₪299 <span className="text-lg font-normal text-gray-500">/חודש</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> קרוסלות ללא הגבלה
              </li>
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> ניהול מספר מרחבי עבודה במקביל
              </li>
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> תמיכת פרימיום
              </li>
            </ul>
            <Link href="/api/auth/signin" className="w-full py-3 px-4 bg-indigo-50 text-indigo-700 font-bold text-center rounded-lg hover:bg-indigo-100 transition-colors">
              צור קשר
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
