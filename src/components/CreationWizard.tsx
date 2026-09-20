'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_WIZARD_OPTIONS,
  DENSITY_OPTIONS,
  MAX_SLIDE_COUNT,
  MIN_SLIDE_COUNT,
  RECOMMENDED_SLIDE_COUNT,
  VISUAL_STYLE_OPTIONS,
  type WizardOptions,
} from '@/lib/wizard';

export interface CreationWizardSubmitPayload {
  topic: string;
  audience: string;
  goal: string;
  brand: string;
  slideCount: number;
  density: WizardOptions['density'];
  visualStyle: WizardOptions['visualStyle'];
  visualStyleCustom: string;
  useRecommendedStructure: boolean;
  websiteUrl?: string;
  referenceLink1?: string;
  referenceLink2?: string;
  referenceLink3?: string;
}

interface CreationWizardProps {
  userName?: string;
  isLoading: boolean;
  onSubmit: (data: CreationWizardSubmitPayload) => void;
  initialWebsiteUrl?: string;
  initialReferenceLink1?: string;
  initialReferenceLink2?: string;
  initialReferenceLink3?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const QUICK_PROMPTS = [
  'טיפים לקרוסלת אינסטגרם שמביאה שמירות',
  'איך לבנות משפך לידים לעסק מקומי',
  'טעויות נפוצות בניהול זמן ליזמים',
];

export default function CreationWizard({
  userName,
  isLoading,
  onSubmit,
  initialWebsiteUrl = '',
  initialReferenceLink1 = '',
  initialReferenceLink2 = '',
  initialReferenceLink3 = '',
}: CreationWizardProps) {
  const [options, setOptions] = useState<WizardOptions>(DEFAULT_WIZARD_OPTIONS);
  const [topicDraft, setTopicDraft] = useState('');
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showClassicHint, setShowClassicHint] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: userName
        ? `היי ${userName}! ספרו לי על מה הקרוסלה — נושא, טיוטה, או רשימת טיפים. בצד אפשר לכוון מספר שקפים, סגנון וצפיפות.`
        : 'היי! ספרו לי על מה הקרוסלה — נושא, טיוטה, או רשימת טיפים. בצד אפשר לכוון מספר שקפים, סגנון וצפיפות.',
    },
  ]);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, chatLoading]);

  const patchOptions = (partial: Partial<WizardOptions>) => {
    setOptions((prev) => ({ ...prev, ...partial }));
  };

  const setRecommended = () => {
    patchOptions({
      slideCount: RECOMMENDED_SLIDE_COUNT,
      useRecommendedStructure: true,
    });
  };

  const sendChat = async (raw: string) => {
    const message = raw.trim();
    if (!message || chatLoading || isLoading) return;

    const nextHistory = [...messages, { role: 'user' as const, text: message }];
    setMessages(nextHistory);
    setInputText('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/wizard-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: nextHistory,
          options: {
            slideCount: options.slideCount,
            density: options.density,
            visualStyle: options.visualStyle,
            visualStyleCustom: options.visualStyleCustom,
            useRecommendedStructure: options.useRecommendedStructure,
            audience: options.audience,
            goal: options.goal,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאת סוכן');

      if (data.topic) setTopicDraft(data.topic);
      if (data.suggestedAudience) {
        patchOptions({ audience: data.suggestedAudience });
      }
      if (data.suggestedGoal) {
        patchOptions({ goal: data.suggestedGoal });
      }

      setMessages([
        ...nextHistory,
        {
          role: 'assistant',
          text:
            data.reply ||
            'מוכן. אפשר להמשיך לכוון או ליצור את הקרוסלה.',
        },
      ]);
    } catch (err) {
      console.error(err);
      setTopicDraft(message);
      setMessages([
        ...nextHistory,
        {
          role: 'assistant',
          text: 'שמרתי את הנושא. אפשר ליצור עכשיו עם ההגדרות שבצד.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerate = () => {
    const topic = (topicDraft || inputText).trim();
    if (!topic) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'כדי ליצור קרוסלה צריך נושא או טקסט — כתבו בצ׳אט או הדביקו טיוטה.',
        },
      ]);
      inputRef.current?.focus();
      return;
    }

    const styleMeta = VISUAL_STYLE_OPTIONS.find(
      (s) => s.id === options.visualStyle
    );
    const brandParts = [
      styleMeta?.promptHint || styleMeta?.label || '',
      options.visualStyle === 'custom' ? options.visualStyleCustom : '',
    ]
      .filter(Boolean)
      .join(' | ');

    onSubmit({
      topic,
      audience: options.audience,
      goal: options.goal,
      brand: brandParts,
      slideCount: options.slideCount,
      density: options.density,
      visualStyle: options.visualStyle,
      visualStyleCustom: options.visualStyleCustom,
      useRecommendedStructure: options.useRecommendedStructure,
      websiteUrl: initialWebsiteUrl,
      referenceLink1: initialReferenceLink1,
      referenceLink2: initialReferenceLink2,
      referenceLink3: initialReferenceLink3,
    });
  };

  const pageHint =
    options.useRecommendedStructure &&
    options.slideCount === RECOMMENDED_SLIDE_COUNT
      ? 'שער + 5 תוכן + סיום'
      : `${options.slideCount} שקפים מותאמים`;

  return (
    <div
      className="wizard-shell relative min-h-[calc(100vh-2rem)] overflow-hidden rounded-none md:rounded-3xl border border-white/5 bg-[#0c0f14] text-zinc-100 shadow-2xl"
      dir="rtl"
      style={{ fontFamily: 'Heebo, Assistant, sans-serif' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 100% -10%, rgba(99,102,241,0.28), transparent 55%), radial-gradient(ellipse 60% 40% at 0% 100%, rgba(14,165,233,0.12), transparent 50%), linear-gradient(180deg, #0c0f14 0%, #111827 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        aria-hidden
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="relative grid min-h-[calc(100vh-2rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        {/* Chat column */}
        <section className="flex flex-col border-b border-white/8 lg:border-b-0 lg:border-l border-white/8">
          <header className="px-5 pt-6 pb-4 md:px-8 md:pt-8">
            <p className="text-sm font-medium text-indigo-300/90 mb-2 animate-[wizardFade_0.6s_ease-out]">
              אשף יצירה בעברית
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white animate-[wizardRise_0.7s_ease-out]">
              קרוסל. איי. אי
            </h1>
            <p className="mt-2 max-w-xl text-zinc-400 text-base md:text-lg animate-[wizardRise_0.85s_ease-out]">
              שוחחו עם הסוכן על הנושא — והגדירו מבנה, סגנון וצפיפות לפני היצירה.
            </p>
          </header>

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-5 md:px-8 pb-4 flex flex-col gap-3 min-h-[280px] max-h-[52vh] lg:max-h-none"
          >
            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed animate-[wizardPop_0.35s_ease-out] ${
                  msg.role === 'assistant'
                    ? 'bg-white/5 text-zinc-100 border border-white/10 self-start'
                    : 'bg-indigo-600/90 text-white self-end'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="text-sm text-zinc-500 animate-pulse">
                הסוכן חושב…
              </div>
            )}
          </div>

          <div className="px-5 md:px-8 pb-3 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={isLoading || chatLoading}
                onClick={() => sendChat(prompt)}
                className="text-xs md:text-sm px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="px-5 md:px-8 pb-6 pt-2">
            <div className="flex gap-2 items-end rounded-2xl border border-white/10 bg-black/30 p-2 focus-within:border-indigo-400/50 transition">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChat(inputText);
                  }
                }}
                rows={2}
                placeholder="לדוגמה: טיפים לקרוסלת אינסטגרם…"
                className="flex-1 resize-none bg-transparent border-0 text-zinc-100 placeholder:text-zinc-500 px-3 py-2 focus:outline-none focus:ring-0 text-[15px]"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => sendChat(inputText)}
                disabled={!inputText.trim() || chatLoading || isLoading}
                className="shrink-0 mb-1 ml-1 rounded-xl bg-zinc-100 text-zinc-900 font-bold px-4 py-2.5 hover:bg-white disabled:opacity-40 transition"
              >
                שלח
              </button>
            </div>
            {topicDraft ? (
              <p className="mt-3 text-xs text-zinc-500">
                נושא ליצירה:{' '}
                <span className="text-zinc-300 font-medium">{topicDraft}</span>
              </p>
            ) : null}
          </div>
        </section>

        {/* Options column */}
        <aside className="flex flex-col gap-6 px-5 py-6 md:px-7 md:py-8 bg-black/20 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">הגדרות קרוסלה</h2>
            <p className="text-sm text-zinc-500">בחרו לפני היצירה — אפשר לשנות בכל רגע.</p>
          </div>

          {/* Pages */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-bold text-zinc-200">מספר שקפים</h3>
              <span className="text-indigo-300 font-black text-xl tabular-nums">
                {options.slideCount}
              </span>
            </div>
            <button
              type="button"
              onClick={setRecommended}
              className={`w-full text-right rounded-xl border px-4 py-3 transition ${
                options.useRecommendedStructure &&
                options.slideCount === RECOMMENDED_SLIDE_COUNT
                  ? 'border-indigo-400/60 bg-indigo-500/15 text-indigo-100'
                  : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/8'
              }`}
            >
              <div className="font-bold">מומלץ — {RECOMMENDED_SLIDE_COUNT} שקפים</div>
              <div className="text-sm opacity-80 mt-0.5">שער + 5 תוכן + סיום</div>
            </button>
            <div>
              <label className="text-xs text-zinc-500 mb-2 block">
                מותאם אישית ({MIN_SLIDE_COUNT}–{MAX_SLIDE_COUNT})
              </label>
              <input
                type="range"
                min={MIN_SLIDE_COUNT}
                max={MAX_SLIDE_COUNT}
                value={options.slideCount}
                onChange={(e) =>
                  patchOptions({
                    slideCount: Number(e.target.value),
                    useRecommendedStructure:
                      Number(e.target.value) === RECOMMENDED_SLIDE_COUNT,
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
                aria-label="מספר שקפים"
              />
              <p className="text-xs text-zinc-500 mt-2">{pageHint}</p>
            </div>
          </div>

          {/* Visual style */}
          <div className="space-y-3">
            <h3 className="font-bold text-zinc-200">סגנון ויזואלי</h3>
            <div className="grid grid-cols-2 gap-2">
              {VISUAL_STYLE_OPTIONS.map((style) => {
                const selected = options.visualStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => {
                      if (style.stub) {
                        patchOptions({ visualStyle: 'minimal' });
                        setShowClassicHint(true);
                        setTimeout(() => setShowClassicHint(false), 3200);
                        return;
                      }
                      patchOptions({ visualStyle: style.id });
                    }}
                    className={`text-right rounded-xl border px-3 py-2.5 transition ${
                      selected
                        ? 'border-sky-400/50 bg-sky-500/10 text-sky-50'
                        : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/5'
                    } ${style.stub ? 'opacity-70' : ''}`}
                  >
                    <div className="font-bold text-sm">{style.label}</div>
                    <div className="text-[11px] opacity-75 mt-0.5 leading-snug">
                      {style.hint}
                    </div>
                  </button>
                );
              })}
            </div>
            {showClassicHint ? (
              <p className="text-xs text-amber-200/90 animate-[wizardPop_0.3s_ease-out]">
                העלאת צילומי מסך כהשראה — בקרוב. בינתיים נבחר מינימליסטי.
              </p>
            ) : null}
            {options.visualStyle === 'custom' ? (
              <textarea
                value={options.visualStyleCustom}
                onChange={(e) =>
                  patchOptions({ visualStyleCustom: e.target.value })
                }
                rows={2}
                placeholder="למשל: רקע כהה, אותיות גדולות, תחושת סטארטאפ…"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-400/40"
              />
            ) : null}
          </div>

          {/* Density */}
          <div className="space-y-3">
            <h3 className="font-bold text-zinc-200">צפיפות מידע</h3>
            <div className="flex flex-col gap-2">
              {DENSITY_OPTIONS.map((d) => {
                const selected = options.density === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => patchOptions({ density: d.id })}
                    className={`text-right rounded-xl border px-4 py-2.5 transition ${
                      selected
                        ? 'border-emerald-400/45 bg-emerald-500/10 text-emerald-50'
                        : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="font-bold">{d.label}</span>
                    <span className="text-sm opacity-75 mr-2">— {d.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional audience / goal */}
          <details className="group rounded-xl border border-white/10 bg-white/[0.02] open:bg-white/[0.04]">
            <summary className="cursor-pointer list-none px-4 py-3 font-bold text-zinc-300 flex justify-between items-center">
              קהל ומטרה (אופציונלי)
              <span className="text-zinc-600 group-open:rotate-180 transition">▾</span>
            </summary>
            <div className="px-4 pb-4 space-y-3">
              <input
                type="text"
                value={options.audience}
                onChange={(e) => patchOptions({ audience: e.target.value })}
                placeholder="קהל יעד"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-400/40"
              />
              <input
                type="text"
                value={options.goal}
                onChange={(e) => patchOptions({ goal: e.target.value })}
                placeholder="מטרת הפוסט"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-400/40"
              />
            </div>
          </details>

          <div className="mt-auto pt-2 space-y-3 sticky bottom-0 pb-1">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading || chatLoading}
              className="w-full rounded-2xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-black text-lg py-4 shadow-[0_0_40px_-12px_rgba(99,102,241,0.8)] transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? 'מייצר שקפים…' : 'צור קרוסלה ופתח בעורך'}
            </button>
            <p className="text-center text-[11px] text-zinc-600">
              היצירה נשענת על מנוע הבינה הקיים ופותחת את העורך המוכר.
            </p>
          </div>
        </aside>
      </div>

      <style jsx>{`
        @keyframes wizardFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes wizardRise {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes wizardPop {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .wizard-shell * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
