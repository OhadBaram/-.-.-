'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TimelineStep {
  time: string;
  seconds: number;
  icon: string;
  title: string;
  desc: string;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    time: '00:05',
    seconds: 5,
    icon: '💡',
    title: 'הזנת רעיון או קישור',
    desc: 'מדביקים קישור מיוטיוב, טיקטוק או אתר, או כותבים נושא בכמה מילים.',
  },
  {
    time: '00:15',
    seconds: 15,
    icon: '🧠',
    title: 'ניתוח והצעת זוויות',
    desc: 'הבינה המלאכותית שואלת שאלות הבהרה חדות ומציעה כיווני עלילה ויראליים.',
  },
  {
    time: '00:25',
    seconds: 25,
    icon: '🎨',
    title: 'יצירת שקפים מעוצבים',
    desc: 'הפקה אוטומטית של שקפי תוכן מושלמים בעברית תקנית RTL עם פלטת צבעים מותאמת.',
  },
  {
    time: '00:30',
    seconds: 30,
    icon: '🚀',
    title: 'עריכה וייצוא מיידי',
    desc: 'הורדה בלחיצה אחת כקובץ תמונות לאינסטגרם או כקובץ PDF מלוטש ללינקדאין.',
  },
];

export default function LandingDemoVideo() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSecond, setCurrentSecond] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSecond((prev) => {
        if (prev >= 30) {
          setVideoEnded(true);
          return 30;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const activeStepIndex = currentSecond < 8 ? 0 : currentSecond < 16 ? 1 : currentSecond < 25 ? 2 : 3;

  const handleRestart = () => {
    setCurrentSecond(0);
    setVideoEnded(false);
    setIsPlaying(true);
  };

  const progressPercent = Math.min(100, Math.round((currentSecond / 30) * 100));

  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-sm font-bold mb-4">
            <span>⚡</span>
            <span>הדגמת וידאו חיה</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            איך ב-<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">30 שניות</span> הקסם קורה?
          </h2>
          <p className="text-lg md:text-xl text-slate-300">
            צפו בסימולציה המלאה: מרעיון גולמי או הדבקת קישור ועד לקרוסלה מלאה ומעוצבת המוכנה לפרסום
          </p>
        </div>

        {/* Video / Simulation Showcase Container */}
        <div className="max-w-4xl mx-auto bg-slate-950/80 rounded-3xl p-4 md:p-6 border border-slate-800 shadow-2xl backdrop-blur-xl">
          {/* Top Bar simulating browser / video header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs font-mono mr-2 text-slate-500">CarouselAI Studio · 30s Magic Demo</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>00:{currentSecond.toString().padStart(2, '0')} / 00:30</span>
            </div>
          </div>

          {/* Screen Content area */}
          <div className="relative min-h-[360px] md:min-h-[420px] rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-6 flex flex-col justify-center items-center text-center overflow-hidden border border-slate-800/80">
            
            {/* Stage 1: Input & link (0 - 7s) */}
            {activeStepIndex === 0 && (
              <div className="w-full max-w-lg space-y-4 animate-fadeIn">
                <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
                  שלב 1: הזנת תוכן וסריקה
                </div>
                <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 text-right shadow-inner">
                  <p className="text-xs text-slate-400 mb-1">נושא או קישור מקור:</p>
                  <div className="font-mono text-sm text-emerald-300 flex items-center gap-2">
                    <span className="animate-pulse">❯</span>
                    <span>https://youtube.com/@mkbhd/latest</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold bg-emerald-950/40 py-2 px-4 rounded-xl border border-emerald-500/30">
                  <span className="animate-spin text-base">⏳</span>
                  <span>סורק סרטונים, כותרות ותובנות מהערוץ בזמן אמת...</span>
                </div>
              </div>
            )}

            {/* Stage 2: Clarification & Narrative (8 - 15s) */}
            {activeStepIndex === 1 && (
              <div className="w-full max-w-lg space-y-4 animate-fadeIn">
                <div className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30">
                  שלב 2: הבוט מנתח ומציע זוויות
                </div>
                <div className="bg-slate-800/90 rounded-2xl p-4 border border-purple-500/40 text-right space-y-2">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <span>🤖</span>
                    <span>הבוט זיהה את ערוץ הטכנולוגיה</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    «זיהיתי את הסרטון החדש על בינה מלאכותית ומצלמות. באיזה זווית נרצה להתמקד?»
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <div className="text-xs bg-indigo-950/60 p-2 rounded-lg border border-indigo-500/30 text-indigo-200">
                      1. חמש התובנות המובילות שכל יוצר תוכן חייב להכיר
                    </div>
                    <div className="text-xs bg-slate-900/60 p-2 rounded-lg border border-slate-700 text-slate-300">
                      2. מדריך מקוצר: מפרט טכני לעומת ביצועים בשטח
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 3: Slide Generation (16 - 24s) */}
            {activeStepIndex === 2 && (
              <div className="w-full max-w-xl space-y-4 animate-fadeIn">
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                  שלב 3: הפקת קרוסלה מעוצבת
                </div>
                {/* Visual Slide mockup previews */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="aspect-[4/5] bg-gradient-to-br from-indigo-700 to-purple-800 rounded-xl p-3 flex flex-col justify-between text-right shadow-lg transform -rotate-1 border border-indigo-400/30">
                    <span className="text-[10px] font-bold text-indigo-200">שקף 1 · שער</span>
                    <p className="text-xs font-black text-white leading-tight">5 כלי AI שחובה להכיר השבוע</p>
                    <span className="text-[9px] text-indigo-200">החליקו לגילוי ❯</span>
                  </div>
                  <div className="aspect-[4/5] bg-slate-900 rounded-xl p-3 flex flex-col justify-between text-right shadow-xl transform scale-105 border-2 border-indigo-500">
                    <span className="text-[10px] font-bold text-indigo-400">שקף 2 · ערך</span>
                    <p className="text-xs font-bold text-slate-100 leading-tight">1. סיכום פגישות אוטומטי ב-10 שניות</p>
                    <span className="text-[9px] text-slate-400">2 / 7</span>
                  </div>
                  <div className="aspect-[4/5] bg-gradient-to-br from-purple-800 to-indigo-900 rounded-xl p-3 flex flex-col justify-between text-right shadow-lg transform rotate-1 border border-purple-400/30">
                    <span className="text-[10px] font-bold text-purple-200">שקף 7 · הנעה</span>
                    <p className="text-xs font-black text-white leading-tight">שמרו כדי לנסות בעסק 📌</p>
                    <span className="text-[9px] text-purple-200">7 / 7</span>
                  </div>
                </div>
                <p className="text-xs text-emerald-300 font-medium">✨ 7 שקפים מוכנים בעברית תקנית RTL, כותרות חדות ופלטה מותאמת אישית</p>
              </div>
            )}

            {/* Stage 4: Export (25 - 30s) */}
            {activeStepIndex === 3 && (
              <div className="w-full max-w-md space-y-4 animate-fadeIn">
                <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                  שלב 4: ייצוא מהיר ומוכן לשיתוף
                </div>
                <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 space-y-3">
                  <div className="text-2xl font-black text-white">🎉 הקרוסלה מוכנה!</div>
                  <div className="flex justify-center gap-3">
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg">
                      <span>📥</span>
                      <span>הורד ZIP (לאינסטגרם)</span>
                    </button>
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5">
                      <span>📄</span>
                      <span>הורד PDF (ללינקדאין)</span>
                    </button>
                  </div>
                </div>
                <Link
                  href="/dashboard/create"
                  className="inline-block px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full text-sm font-black shadow-lg transition transform hover:scale-105"
                >
                  רוצה ליצור כזו עכשיו? לחץ כאן 🚀
                </Link>
              </div>
            )}

            {/* Play / Pause / Replay overlay button */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              {videoEnded ? (
                <button
                  onClick={handleRestart}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <span>🔄</span>
                  <span>נגן שוב מההתחלה</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 border border-slate-700"
                >
                  <span>{isPlaying ? '⏸️ השהה' : '▶️ נגן'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Timeline Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-2 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4 Interactive Stage Cards underneath */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 max-w-5xl mx-auto">
          {TIMELINE_STEPS.map((step, idx) => {
            const isActive = activeStepIndex === idx;
            return (
              <button
                key={step.time}
                type="button"
                onClick={() => {
                  setCurrentSecond(step.seconds - 2);
                  setVideoEnded(false);
                  setIsPlaying(true);
                }}
                className={`p-4 rounded-2xl text-right transition-all border text-slate-200 ${
                  isActive
                    ? 'bg-indigo-950/70 border-indigo-500/80 shadow-lg shadow-indigo-500/10 scale-102'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{step.icon}</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {step.time}
                  </span>
                </div>
                <h4 className={`font-bold text-sm mb-1 ${isActive ? 'text-indigo-300' : 'text-slate-200'}`}>
                  {step.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
