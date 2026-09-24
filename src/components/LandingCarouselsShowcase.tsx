'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CarouselSlide {
  label: string;
  headline: string;
  body: string;
  tip?: string;
}

interface ShowcaseCarousel {
  id: string;
  category: 'tech' | 'marketing' | 'business' | 'lifestyle';
  categoryLabel: string;
  title: string;
  templateLabel: string;
  views: string;
  saves: string;
  shares: string;
  styleClass: string;
  slides: CarouselSlide[];
}

const SHOWCASE_CAROUSELS: ShowcaseCarousel[] = [
  {
    id: 'tech-ai',
    category: 'tech',
    categoryLabel: 'טכנולוגיה & AI',
    title: '5 כלי בינה מלאכותית שיחסכו לך 10 שעות בשבוע',
    templateLabel: 'יוקרה כהה (Dark Luxury)',
    views: '16.4K',
    saves: '1,280',
    shares: '490',
    styleClass: 'bg-zinc-950 border-amber-500/30 text-amber-50',
    slides: [
      {
        label: 'שקף 1 · שער',
        headline: '5 כלי בינה מלאכותית שיחסכו לך 10 שעות בשבוע',
        body: 'הכלים הסודיים שהופכים יוצרי תוכן ובעלי עסקים למכונות עבודה משומנות.',
        tip: 'החליקו שמאלה לגילוי ❯',
      },
      {
        label: 'שקף 2 · כלי 1',
        headline: '1. תמלול וסיכום פגישות אוטומטי',
        body: 'במקום לסכם שיחות זום של שעה ידנית – קבלו נקודות פעולה מדויקות ב-10 שניות.',
        tip: 'חיסכון ממוצע: 3 שעות בשבוע',
      },
      {
        label: 'שקף 3 · כלי 2',
        headline: '2. מיחזור תוכן רב-ערוצי',
        body: 'קחו סרטון יוטיוב או פודקאסט אחד, וייצרו ממנו 5 קרוסלות ומאמר לינקדאין בלחיצה.',
        tip: 'חיסכון ממוצע: 4 שעות בשבוע',
      },
      {
        label: 'שקף 4 · כלי 3',
        headline: '3. ניתוח דאטה ללא אקסל',
        body: 'העלו את קובץ המכירות ושאלו בשפה חופשית מהם המוצרים הרווחיים ביותר החודש.',
        tip: 'חיסכון ממוצע: 3 שעות בשבוע',
      },
      {
        label: 'שקף 5 · סיום והנעה',
        headline: 'איזה כלי אתם חייבים לנסות ראשון?',
        body: 'שמרו את הפוסט כדי ליישם כבר השבוע, ושתפו חבר שחייב להתייעל 📌',
        tip: 'שמירה = הצלחה',
      },
    ],
  },
  {
    id: 'marketing-social',
    category: 'marketing',
    categoryLabel: 'שיווק & סושיאל',
    title: '3 חוקים לפצח את האלגוריתם של אינסטגרם ב-2026',
    templateLabel: 'נועז (Bold)',
    views: '24.2K',
    saves: '2,640',
    shares: '820',
    styleClass: 'bg-gradient-to-br from-indigo-900 to-purple-900 border-indigo-400/40 text-white',
    slides: [
      {
        label: 'שקף 1 · שער',
        headline: 'האלגוריתם השתנה שוב: 3 חוקים שחייבים להכיר',
        body: 'למה לייקים כבר לא משפיעים, ומה גורם לאינסטגרם להפיץ את הפוסט שלכם לאלפי אנשים חדשים?',
        tip: 'גלו את הסודות בפנים ❯',
      },
      {
        label: 'שקף 2 · חוק 1',
        headline: 'חוק 1: זמן שהייה (Dwell Time) מנצח הכל',
        body: 'ככל שהגולש מתעכב יותר על השקפים וקורא את הטקסט, הציון של הפוסט מזנק.',
        tip: 'קרוסלות ארוכות של 7-9 שקפים מנצחות תמונות בודדות',
      },
      {
        label: 'שקף 3 · חוק 2',
        headline: 'חוק 2: מדד השמירות והשיתופים',
        body: 'פוסט שנשמר מקבל פי 5 יותר חשיפה. תנו ערך מעשי שהגולש ירצה לחזור אליו שוב ושוב.',
        tip: 'מדריכים מעשיים מייצרים שיא שמירות',
      },
      {
        label: 'שקף 4 · חוק 3',
        headline: 'חוק 3: הוק חזק ב-3 המילים הראשונות',
        body: 'אם השער לא עוצר את הגלילה בשנייה הראשונה, כל העיצוב יורד לטמיון.',
        tip: 'השתמשו במספרים וסקרנות',
      },
      {
        label: 'שקף 5 · סיום והנעה',
        headline: 'רוצים עוד טיפים לחשיפה אורגנית?',
        body: 'שתפו בסטורי כדי לעזור ליוצרים נוספים, וכתבו בתגובות מה האתגר הגדול שלכם 🚀',
        tip: 'שתפו עכשיו ↗',
      },
    ],
  },
  {
    id: 'business-finance',
    category: 'business',
    categoryLabel: 'עסקים & פיננסים',
    title: '3 טעויות של משקיעים מתחילים ואיך להימנע מהן',
    templateLabel: 'מינימליסטי אלגנטי (Minimal)',
    views: '11.8K',
    saves: '940',
    shares: '310',
    styleClass: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white',
    slides: [
      {
        label: 'שקף 1 · שער',
        headline: '3 טעויות של משקיעים מתחילים שעולות ביוקר',
        body: 'מדריך פיננסי מעשי לבניית ביטחון כלכלי בלי להסתכן בהרפתקאות מסוכנות.',
        tip: 'קראו לפני ההשקעה הבאה ❯',
      },
      {
        label: 'שקף 2 · טעות 1',
        headline: 'טעות 1: להשקיע בלי כרית ביטחון',
        body: 'לפני ששמים שקל בשוק ההון או בנדל״ן – חייבים 3-6 חודשי הוצאות סגורים בחשבון נזיל.',
        tip: 'בטיחות קודמת לתשואה',
      },
      {
        label: 'שקף 3 · טעות 2',
        headline: 'טעות 2: ניסיון לתזמן את השוק',
        body: 'אף אחד לא יודע מתי השוק בשיא או בשפל. השקעה קבועה ועקבית מנצחת תמיד ניסיונות תזמון.',
        tip: 'זמן בשוק עדיף על תזמון השוק',
      },
      {
        label: 'שקף 4 · טעות 3',
        headline: 'טעות 3: ריכוזיות והיעדר פיזור',
        body: 'לשים את כל הכסף על מניה אחת או על טרנד רגעי זו הזמנה להפסד כבד ברגע של תנודתיות.',
        tip: 'מדדים רחבים ופיזור נכסים',
      },
      {
        label: 'שקף 5 · סיום והנעה',
        headline: 'מה היה הצעד הכלכלי הראשון שלכם?',
        body: 'ספרו לנו בתגובות, ושמרו את המדריך לעתיד 💬',
        tip: 'דיון פתוח למטה',
      },
    ],
  },
  {
    id: 'lifestyle-habits',
    category: 'lifestyle',
    categoryLabel: 'התפתחות & הרגלים',
    title: 'שגרת הבוקר של אנשים אפקטיביים: 4 הרגלים פשוטים',
    templateLabel: 'מגזין מודרני (Magazine)',
    views: '19.5K',
    saves: '2,110',
    shares: '670',
    styleClass: 'bg-emerald-950/80 border-emerald-500/30 text-emerald-100',
    slides: [
      {
        label: 'שקף 1 · שער',
        headline: '4 הרגלים קטנים בבוקר שמשנים את כל היום',
        body: 'איך להתחיל את היום בפוקוס, אנרגיה ושקט פנימי ב-20 דקות בלבד.',
        tip: 'לשגרה מנצחת החליקו ❯',
      },
      {
        label: 'שקף 2 · הרגל 1',
        headline: '1. 10 דקות ללא מסכים מההתעוררות',
        body: 'במקום להציף את המוח בחדשות ורשתות מיד שפותחים עיניים – תנו לנשימה ולמוח להתעורר בשקט.',
        tip: 'מוריד רמות קורטיזול וחרדה',
      },
      {
        label: 'שקף 3 · הרגל 2',
        headline: '2. כוס מים גדולה לפני הקפה הראשון',
        body: 'הגוף מתעורר מיובש לאחר 7-8 שעות שינה. החזרת נוזלים מיידית מחזירה חדות מחשבתית.',
        tip: 'אנרגיה טבעית מיידית',
      },
      {
        label: 'שקף 4 · הרגל 3',
        headline: '3. כתיבת 3 המשימות הקריטיות להיום',
        body: 'אם הכל דחוף – שום דבר לא חשוב. הגדירו מראש 3 הישגים שיהפכו את היום למוצלח.',
        tip: 'מיקוד במקום פיזור',
      },
      {
        label: 'שקף 5 · סיום והנעה',
        headline: 'איזה הרגל תנסו מחר בבוקר?',
        body: 'שמרו את הפוסט לתזכורת הבוקר שלכם, ושתפו עם מי שזקוק לסדר ביום ☀️',
        tip: 'שתפו עכשיו 📌',
      },
    ],
  },
];

type CategoryFilter = 'all' | 'tech' | 'marketing' | 'business' | 'lifestyle';

export default function LandingCarouselsShowcase() {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [activeSlideMap, setActiveSlideMap] = useState<Record<string, number>>({});

  const filteredCarousels =
    filter === 'all'
      ? SHOWCASE_CAROUSELS
      : SHOWCASE_CAROUSELS.filter((c) => c.category === filter);

  const getActiveSlide = (id: string) => activeSlideMap[id] || 0;

  const nextSlide = (id: string, total: number) => {
    setActiveSlideMap((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) + 1) % total,
    }));
  };

  const prevSlide = (id: string, total: number) => {
    setActiveSlideMap((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) - 1 + total) % total,
    }));
  };

  const setSlide = (id: string, index: number) => {
    setActiveSlideMap((prev) => ({
      ...prev,
      [id]: index,
    }));
  };

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-sm font-bold mb-4">
            <span>✨</span>
            <span>גלריית תוצרים מובילים</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
            קרוסלות מוצלחות <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">שנוצרו במערכת</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
            הקרוסלות האמיתיות שהניבו אלפי שמירות ומעורבות שיא. החליקו בין השקפים וגלו את העיצוב והקופי:
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12">
          {[
            { id: 'all', label: 'כל הקטגוריות' },
            { id: 'tech', label: 'טכנולוגיה & AI' },
            { id: 'marketing', label: 'שיווק & סושיאל' },
            { id: 'business', label: 'עסקים & פיננסים' },
            { id: 'lifestyle', label: 'התפתחות & הרגלים' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id as CategoryFilter)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                filter === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Carousel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredCarousels.map((carousel) => {
            const currentIdx = getActiveSlide(carousel.id);
            const slide = carousel.slides[currentIdx];
            const totalSlides = carousel.slides.length;

            return (
              <div
                key={carousel.id}
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-between transition-all hover:shadow-2xl"
              >
                {/* Header & Meta */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                    {carousel.categoryLabel}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    תבנית: {carousel.templateLabel}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 line-clamp-1">
                  {carousel.title}
                </h3>

                {/* Interactive Slide Viewer Canvas */}
                <div
                  className={`aspect-[4/5] rounded-2xl p-6 md:p-8 flex flex-col justify-between text-right relative overflow-hidden shadow-inner border transition-all ${carousel.styleClass}`}
                >
                  {/* Top Slide indicator */}
                  <div className="flex items-center justify-between text-xs opacity-80 font-bold">
                    <span>{slide.label}</span>
                    <span className="font-mono">{currentIdx + 1} / {totalSlides}</span>
                  </div>

                  {/* Main Slide Content */}
                  <div className="space-y-4 my-auto">
                    <h4 className="text-xl md:text-2xl font-black leading-tight tracking-tight">
                      {slide.headline}
                    </h4>
                    <p className="text-sm md:text-base opacity-90 leading-relaxed font-medium">
                      {slide.body}
                    </p>
                  </div>

                  {/* Bottom footer / tip */}
                  {slide.tip && (
                    <div className="pt-3 border-t border-current/20 text-xs font-semibold opacity-75">
                      {slide.tip}
                    </div>
                  )}

                  {/* Slide controls overlay (arrows) */}
                  <div className="absolute inset-y-0 left-2 flex items-center">
                    <button
                      onClick={() => nextSlide(carousel.id, totalSlides)}
                      aria-label="השקף הבא"
                      className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition shadow-lg text-lg"
                    >
                      ‹
                    </button>
                  </div>
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <button
                      onClick={() => prevSlide(carousel.id, totalSlides)}
                      aria-label="השקף הקודם"
                      className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition shadow-lg text-lg"
                    >
                      ›
                    </button>
                  </div>
                </div>

                {/* Slide dots switcher */}
                <div className="flex items-center justify-center gap-1.5 mt-4 mb-2">
                  {carousel.slides.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setSlide(carousel.id, dotIdx)}
                      aria-label={`שקף ${dotIdx + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        currentIdx === dotIdx
                          ? 'w-6 bg-indigo-600'
                          : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>

                {/* Engagement stats */}
                <div className="flex items-center justify-around py-3 px-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl my-4 text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1">
                    <span>👀</span>
                    <span>{carousel.views} צפיות</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📌</span>
                    <span>{carousel.saves} שמירות</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🚀</span>
                    <span>{carousel.shares} שיתופים</span>
                  </div>
                </div>

                {/* Card Action */}
                <Link
                  href={`/dashboard/create?topic=${encodeURIComponent(carousel.title)}`}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <span>צור קרוסלה כזו עכשיו</span>
                  <span>←</span>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 text-center bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700 rounded-3xl p-8 md:p-10 text-white shadow-xl">
          <h3 className="text-2xl md:text-3xl font-black mb-3">
            רוצים לראות איך הקרוסלה שלכם תיראה תוך 30 שניות?
          </h3>
          <p className="text-indigo-100 max-w-2xl mx-auto mb-6 text-base md:text-lg">
            מזינים נושא או מדביקים קישור – והבינה המלאכותית שלנו תעצב לכם קרוסלה מושלמת המותאמת בדיוק לקהל שלכם.
          </p>
          <Link
            href="/dashboard/create"
            className="inline-block px-8 py-4 bg-white text-indigo-700 font-black rounded-full text-lg hover:bg-gray-100 transition shadow-xl transform hover:-translate-y-0.5"
          >
            התחילו עכשיו בחינם 🚀
          </Link>
        </div>
      </div>
    </section>
  );
}
