import Link from 'next/link';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
            תמחור פשוט ומשתלם
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            ללא הפתעות. בטל בכל עת. שדרג כשאתה מוכן.
          </p>
          <div className="mt-6 inline-block bg-indigo-50 border border-indigo-200 rounded-xl px-6 py-3">
            <p className="text-indigo-700 font-semibold">
              🎁 בהרשמה ראשונה – קרדיט חד-פעמי של 5 קרוסלות לשבוע הראשון, בחינם!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

          {/* Free Tier */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">חינמי</h2>
            <p className="text-gray-500 mb-6 flex-grow text-sm">להתנסות ולגלות את הפלטפורמה ללא סיכון.</p>
            <div className="text-4xl font-extrabold text-gray-900 mb-6">
              ₪0 <span className="text-lg font-normal text-gray-500">/חודש</span>
            </div>
            <ul className="space-y-3 mb-8 flex-grow text-sm">
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> 2 קרוסלות בחודש
              </li>
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> 5 קרוסלות בשבוע הראשון (קרדיט פתיחה)
              </li>
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> כל 12 תבניות העיצוב
              </li>
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> הורדה בפורמט תמונה
              </li>
            </ul>
            <Link href="/api/auth/signin" className="w-full py-3 px-4 bg-indigo-50 text-indigo-700 font-bold text-center rounded-lg hover:bg-indigo-100 transition-colors">
              התחל חינם
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-indigo-600 rounded-2xl shadow-xl border border-indigo-700 p-8 flex flex-col transform md:-translate-y-4">
            <div className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2">הכי פופולרי</div>
            <h2 className="text-2xl font-bold text-white mb-2">פרו</h2>
            <p className="text-indigo-100 mb-6 flex-grow text-sm">לבעלי עסקים שרוצים נוכחות עקבית ומקצועית.</p>
            <div className="text-4xl font-extrabold text-white mb-6">
              ₪89 <span className="text-xl font-normal text-indigo-200">/חודש</span>
            </div>
            <ul className="space-y-3 mb-8 flex-grow text-sm">
              <li className="flex items-center text-white">
                <span className="text-indigo-200 ml-2">✓</span> 25 קרוסלות בחודש
              </li>
              <li className="flex items-center text-white">
                <span className="text-indigo-200 ml-2">✓</span> AI לומד את האתר שלך ואת הסגנון שלך
              </li>
              <li className="flex items-center text-white">
                <span className="text-indigo-200 ml-2">✓</span> ספריית מותג – צבע, טון, זהות
              </li>
              <li className="flex items-center text-white">
                <span className="text-indigo-200 ml-2">✓</span> כל 12 תבניות העיצוב
              </li>
              <li className="flex items-center text-white">
                <span className="text-indigo-200 ml-2">✓</span> עורך שקופיות מתקדם
              </li>
            </ul>
            <Link href="/api/auth/signin" className="w-full py-3 px-4 bg-white text-indigo-600 font-bold text-center rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              שדרג לפרו
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">פרימיום</h2>
            <p className="text-gray-500 mb-6 flex-grow text-sm">לעסקים פעילים שמייצרים תוכן יומיומי.</p>
            <div className="text-4xl font-extrabold text-gray-900 mb-6">
              ₪149 <span className="text-lg font-normal text-gray-500">/חודש</span>
            </div>
            <ul className="space-y-3 mb-8 flex-grow text-sm">
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> 60 קרוסלות בחודש
              </li>
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> AI לומד את האתר שלך ואת הסגנון שלך
              </li>
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> ספריית מותג – צבע, טון, זהות
              </li>
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> כל 12 תבניות העיצוב
              </li>
              <li className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span> עורך שקופיות מתקדם
              </li>
            </ul>
            <Link href="/api/auth/signin" className="w-full py-3 px-4 bg-indigo-50 text-indigo-700 font-bold text-center rounded-lg hover:bg-indigo-100 transition-colors">
              שדרג לפרימיום
            </Link>
          </div>

        </div>

        {/* AI Value Section */}
        <div className="mt-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-10 text-center text-white">
          <div className="text-5xl mb-4">🧠</div>
          <h2 className="text-3xl font-black mb-4">ה-AI שלנו לומד את העסק שלך</h2>
          <p className="text-indigo-100 text-lg max-w-2xl mx-auto mb-8">
            לא עוד תוכן גנרי. המערכת שלנו קוראת את האתר שלך, לומדת מהפרסומים שאהבת, ומבינה את הסגנון והטון הייחודיים לך. כל קרוסלה שתיצור תישמע ותראה בדיוק כמוך – רק מהר יותר.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
            <div className="bg-white/10 rounded-2xl p-6">
              <div className="text-3xl mb-2">🌐</div>
              <h3 className="font-bold text-lg mb-1">קורא את האתר שלך</h3>
              <p className="text-indigo-200 text-sm">מזין את כתובת הדף ו-AI קורא את התוכן שלך ומבין את העסק לעומק</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6">
              <div className="text-3xl mb-2">📸</div>
              <h3 className="font-bold text-lg mb-1">לומד מהסגנון האהוב</h3>
              <p className="text-indigo-200 text-sm">מוסיף קישורים לקרוסלות שעשית בעבר ואהבת – ה-AI מנתח ומשכפל את הסגנון</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-bold text-lg mb-1">חוסך שעות בשבוע</h3>
              <p className="text-indigo-200 text-sm">מה שלקח שעתיים של עיצוב וקופירייטינג – מתבצע תוך 30 שניות, בדיוק בסגנון שלך</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
