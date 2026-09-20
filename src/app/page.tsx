'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-gray-50 font-sans" dir="rtl">
      {/* Navbar */}
      <nav className="w-full bg-white shadow-sm py-4 px-8 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-indigo-700">קרוסל. איי. אי</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-gray-600 hover:text-indigo-600 font-medium hidden md:block">פיצ'רים</a>
          <a href="#pricing" className="text-gray-600 hover:text-indigo-600 font-medium hidden md:block">מחירים</a>
          {session ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700 font-medium hidden md:block">שלום, {session.user?.name}</span>
              <button onClick={() => signOut()} className="text-sm font-medium text-gray-500 hover:text-gray-700">התנתק</button>
              <Link href="/dashboard/create" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition">
                ליצירת קרוסלה
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button onClick={() => signIn()} className="font-medium text-indigo-600 hover:text-indigo-800">התחברות</button>
              <button onClick={() => signIn()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition">
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

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">למה לבחור בקרוסל. איי. אי?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-xl mb-4 text-2xl">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">מהירות שיא</h3>
              <p className="text-gray-600">קבל קרוסלה מעוצבת וכתובה היטב תוך שניות בודדות, ללא צורך בידע מוקדם בעיצוב.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 flex items-center justify-center rounded-xl mb-4 text-2xl">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">מותאם לקהל שלך</h3>
              <p className="text-gray-600">הטקסטים והעיצוב מותאמים בדיוק לקהל היעד שלך, למטרה העסקית ולזהות המותג.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-xl mb-4 text-2xl">🎨</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">עיצוב מקצועי</h3>
              <p className="text-gray-600">טמפלייטים מודרניים המבוססים על העיצובים שעובדים הכי טוב ברשתות החברתיות היום.</p>
            </div>
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
