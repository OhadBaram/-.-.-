'use client';

import React, { useEffect, useState } from 'react';

const PROCESSING_STEPS = [
  {
    id: 1,
    title: 'קריאה וסריקת מקורות מידע',
    desc: 'סורק את הקישורים, האתר ופרטי העסק…',
    icon: '🌐',
  },
  {
    id: 2,
    title: 'עיבוד נתונים וניתוח זהות המותג',
    desc: 'מזהה את קהל היעד, טון הדיבור וערכי המותג…',
    icon: '🧠',
  },
  {
    id: 3,
    title: 'הסקת מסקנות ובניית אסטרטגיה',
    desc: 'בונה מבנה נראטיבי מנצח, הוק חזק וקריאה לפעולה…',
    icon: '💡',
  },
  {
    id: 4,
    title: 'ניסוח שקפים והפקת עיצוב',
    desc: 'מייצר שקפים מותאמים, צבעים, טיפוגרפיה וכיתוב…',
    icon: '✨',
  },
];

export default function SkeletonLoader() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // שלב 1: 0-2.5 שניות
    const t1 = setTimeout(() => {
      setCurrentStepIndex(1);
      setProgress(40);
    }, 2500);

    // שלב 2: 2.5-6 שניות
    const t2 = setTimeout(() => {
      setCurrentStepIndex(2);
      setProgress(70);
    }, 6000);

    // שלב 3: 6-10 שניות
    const t3 = setTimeout(() => {
      setCurrentStepIndex(3);
      setProgress(90);
    }, 10000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[70vh] p-6 max-w-xl mx-auto w-full text-zinc-100"
      dir="rtl"
    >
      {/* Animated Orb / Glowing Core */}
      <div className="relative mb-8 flex items-center justify-center">
        <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 blur-2xl opacity-40 animate-pulse" />
        <div className="relative w-20 h-20 rounded-2xl bg-zinc-900 border border-white/15 flex items-center justify-center shadow-2xl">
          <span className="text-3xl animate-bounce">
            {PROCESSING_STEPS[currentStepIndex]?.icon || '⚡'}
          </span>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-300 mb-2">
          מעבד נתונים ומסיק מסקנות…
        </h2>
        <p className="text-zinc-400 text-sm md:text-base max-w-md mx-auto">
          ה-AI קורא את המידע, לומד את הסגנון שלך ומעצב קרוסלה מותאמת אישית
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-800/80 rounded-full h-2.5 mb-8 overflow-hidden border border-white/10">
        <div
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step by Step Checklist */}
      <div className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4 shadow-xl">
        {PROCESSING_STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3.5 transition-all duration-300 ${
                isCurrent
                  ? 'opacity-100 scale-[1.01]'
                  : isDone
                  ? 'opacity-85'
                  : 'opacity-40'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                ) : isCurrent ? (
                  <span className="relative flex h-6 w-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-6 w-6 bg-indigo-600 text-white items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 text-zinc-500 flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-100">
                    {step.title}
                  </span>
                  {isCurrent && (
                    <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full animate-pulse">
                      בעיבוד…
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-500 text-center mt-6">
        טיפ: מיד לאחר העיבוד יוצג סיכום מסקנות מקדים לפני פתיחת הסטודיו.
      </p>
    </div>
  );
}
