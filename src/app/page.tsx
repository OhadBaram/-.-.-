'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300" dir="rtl">
      {/* Navbar */}
      <nav className="w-full bg-white dark:bg-gray-900 shadow-sm py-4 px-4 md:px-8 flex justify-between items-center relative z-10 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <span className="text-xl md:text-2xl font-black text-indigo-700 dark:text-indigo-400">קרוסל. איי. אי</span>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium hidden md:block">פיצ'רים</a>
          <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium hidden md:block">מחירים</a>
          <ThemeToggle />
          {session ? (
            <div className="flex items-center gap-2 md:gap-4">
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium hidden md:block">שלום, {session.user?.name}</span>
              <button onClick={() => signOut()} className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hidden sm:block">התנתק</button>
              <Link href="/dashboard/create" className="px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm md:text-base hover:bg-indigo-700 transition">
                ליצירת קרוסלה
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={() => signIn()} className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm md:text-base hidden sm:block">התחברות</button>
              <button onClick={() => signIn()} className="px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm md:text-base hover:bg-indigo-700 transition">
                התחל בחינם
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
          הפוך כל רעיון ל<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">קרוסלה מנצחת</span> תוך שניות
        </h1>
        <p className="text-xl text-gray-800 font-semibold mb-2 max-w-2xl mx-auto">
          מבית <span className="text-indigo-700 font-bold">בינה לתעשייה</span>
        </p>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          המערכת המובילה ליצירת קרוסלות לאינסטגרם ולינקדאין בעזרת בינה מלאכותית. חסוך שעות של עיצוב וקופירייטינג – פשוט הקלד נושא, קהל יעד ומטרה, והבינה המלאכותית שלנו תעשה את השאר.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
          <Link href="/dashboard/create" className="px-8 py-4 bg-indigo-600 text-white rounded-full text-lg font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto text-center">
            התחל ליצור עכשיו
          </Link>
          <a href="#features" className="px-8 py-4 bg-white text-indigo-600 border border-indigo-200 rounded-full text-lg font-bold hover:bg-gray-50 transition shadow-sm w-full sm:w-auto text-center">
            איך זה עובד?
          </a>
        </div>
      </section>

      {/* AI Value Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block bg-indigo-50 text-indigo-700 font-bold px-4 py-2 rounded-full text-sm mb-4">
              🧠 הכוח האמיתי של המערכת
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              ה-AI שלנו לא רק כותב – הוא <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">מכיר את העסק שלך</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              המערכת לומדת מהאתר שלך, מהפרסומים שאהבת, ומהסגנון הייחודי לך. התוצאה: קרוסלות שנשמעות ונראות בדיוק כמוך – רק מוכנות תוך 30 שניות.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100">
              <div className="w-14 h-14 bg-indigo-600 text-white flex items-center justify-center rounded-2xl mb-5 text-3xl">🌐</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">קורא את האתר שלך</h3>
              <p className="text-gray-600 leading-relaxed">מזין כתובת האתר שלך פעם אחת, וה-AI לומד את המוצרים, הערכים, השפה והייחוד שלך לעומק. כל קרוסלה עתידית תגלם את זה.</p>
            </div>
            <div className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl border border-purple-100">
              <div className="w-14 h-14 bg-purple-600 text-white flex items-center justify-center rounded-2xl mb-5 text-3xl">📸</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">לומד מהסגנון שאהבת</h3>
              <p className="text-gray-600 leading-relaxed">מוסיף קישורים לקרוסלות הטובות שיצרת בעבר, וה-AI ינתח את המבנה, הטון והאסתטיקה – ויחזור אליך עם עוד מאותו הדבר שעבד.</p>
            </div>
            <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100">
              <div className="w-14 h-14 bg-blue-600 text-white flex items-center justify-center rounded-2xl mb-5 text-3xl">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">חיסכון של שעות בשבוע</h3>
              <p className="text-gray-600 leading-relaxed">מה שלקח שעתיים של עיצוב, קופירייטינג ותיקונים – קורה עכשיו ב-30 שניות. בדיוק בסגנון שלך, בדיוק לקהל שלך, בדיוק בזמן שלך.</p>
            </div>
          </div>

          {/* Social proof strip */}
          <div className="bg-gray-900 rounded-3xl p-8 text-center text-white">
            <p className="text-2xl font-bold mb-2">שעתיים עיצוב = 30 שניות עם CarouselAI</p>
            <p className="text-gray-400">הגיוון, הצבעים, התבניות, הטקסט – הכל אוטומטי, הכל בסגנון שלך</p>
          </div>
        </div>
      </section>

      {/* CTA / Pricing Section */}
      <section id="pricing" className="py-20 bg-indigo-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">מוכנים לקחת את התוכן שלכם לשלב הבא?</h2>
          <p className="text-indigo-100 mb-10 text-lg">
            הצטרפו למאות יוצרי תוכן ובעלי עסקים שכבר משתמשים במערכת שלנו כדי לייצר תוכן ויראלי.
          </p>
          <Link href="/dashboard/create" className="inline-block px-10 py-4 bg-white text-indigo-600 rounded-full text-xl font-black hover:bg-gray-100 transition shadow-xl transform hover:-translate-y-1 text-center">
            למעבר ליצירת קרוסלה
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400 text-center text-sm">
        <div className="mb-4">
          <p>© {new Date().getFullYear()} קרוסל. איי. אי מבית בינה לתעשייה. כל הזכויות שמורות.</p>
        </div>
        <div className="flex justify-center gap-6">
          <Link href="/privacy" className="hover:text-white transition">מדיניות פרטיות</Link>
          <Link href="/terms" className="hover:text-white transition">תנאי שימוש</Link>
        </div>
      </footer>
    </main>
  );
}
