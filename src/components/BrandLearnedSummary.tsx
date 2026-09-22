'use client';

import Link from 'next/link';
import type { BrandLearnedFacts } from '@/lib/brand-learned-summary';

type Variant = 'wizard' | 'dashboard';

export default function BrandLearnedSummary({
  facts,
  variant = 'wizard',
}: {
  facts: BrandLearnedFacts;
  variant?: Variant;
}) {
  const isWizard = variant === 'wizard';

  const shell = isWizard
    ? 'rounded-2xl border border-white/10 bg-gradient-to-l from-emerald-500/[0.08] via-transparent to-sky-500/[0.07] px-4 py-3.5'
    : 'rounded-2xl border border-emerald-200/70 dark:border-emerald-500/25 bg-gradient-to-l from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 px-5 py-4';

  const emptyShell = isWizard
    ? 'rounded-2xl border border-dashed border-sky-500/35 bg-sky-500/[0.06] px-4 py-3'
    : 'rounded-2xl border border-dashed border-sky-400/40 bg-sky-50 dark:bg-sky-950/30 px-5 py-4';

  const titleCls = isWizard
    ? 'text-sm font-black text-zinc-50'
    : 'text-base font-black text-gray-900 dark:text-zinc-50';

  const bodyCls = isWizard
    ? 'mt-1 text-xs leading-relaxed text-zinc-400'
    : 'mt-1 text-sm leading-relaxed text-gray-600 dark:text-zinc-400';

  const labelCls = isWizard
    ? 'font-bold text-zinc-100'
    : 'font-bold text-gray-900 dark:text-zinc-100';

  const listCls = isWizard
    ? 'mt-3 space-y-2 text-xs text-zinc-300'
    : 'mt-3 space-y-2.5 text-sm text-gray-700 dark:text-zinc-300';

  const linkCls = isWizard
    ? 'text-[11px] font-bold text-zinc-400 underline underline-offset-2 hover:text-zinc-200'
    : 'text-xs font-bold text-emerald-800 dark:text-emerald-300 underline underline-offset-2';

  const hostCls = isWizard
    ? 'mt-0.5 block font-mono text-[11px] text-sky-300/90'
    : 'mt-0.5 block font-mono text-xs text-sky-700 dark:text-sky-300';

  if (!facts.hasAny) {
    return (
      <aside
        className={emptyShell}
        dir="rtl"
        aria-label="השלמת למידת מותג"
      >
        <p
          className={
            isWizard
              ? 'text-sm font-bold text-sky-100'
              : 'text-sm font-bold text-sky-900 dark:text-sky-100'
          }
        >
          עדיין לא למדנו מספיק על המותג שלכם
        </p>
        <p className={bodyCls}>
          השלימו אתר, קישורי סגנון וטון דיבור בהגדרות — כך הקרוסלות יישמעו
          וייראו כמוכם.
        </p>
        <Link
          href="/dashboard/settings"
          className={
            isWizard
              ? 'mt-2 inline-block text-xs font-bold text-sky-300 underline underline-offset-2 hover:text-sky-200'
              : 'mt-2 inline-block text-sm font-bold text-sky-700 dark:text-sky-300 underline underline-offset-2'
          }
        >
          להשלמת למידת מותג
        </Link>
      </aside>
    );
  }

  return (
    <aside className={shell} dir="rtl" aria-label="מה למדנו על המותג">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={titleCls}>מה כבר למדנו עליכם</h2>
        <Link href="/dashboard/settings" className={linkCls}>
          לעדכון בהגדרות
        </Link>
      </div>

      <p className={bodyCls}>
        המידע הזה מכוון טון, צבעים וסגנון — כדי שהקרוסלות ייצאו מדויקות יותר
        אליכם.
      </p>

      <ul className={listCls}>
        {facts.websiteHost ? (
          <li className="leading-snug">
            <span className={labelCls}>אתר:</span>
            <span className="mr-1 opacity-80">ממנו למדנו על העסק</span>
            <span className={hostCls} dir="ltr">
              {facts.websiteHost}
            </span>
          </li>
        ) : null}

        {facts.referenceCount > 0 ? (
          <li className="leading-snug">
            <span className={labelCls}>סגנון ויזואלי:</span>
            <span className="mr-1">
              {facts.referenceCount === 1
                ? 'קישור ייחוס אחד לשמירה על מראה דומה'
                : `${facts.referenceCount} קישורי ייחוס לשמירה על מראה דומה`}
            </span>
          </li>
        ) : null}

        {facts.brandIdentitySnippet ? (
          <li className="leading-snug">
            <span className={labelCls}>טון וזהות:</span>
            <span className="mr-1">{facts.brandIdentitySnippet}</span>
          </li>
        ) : null}

        {facts.accentColors.length > 0 ? (
          <li className="flex flex-wrap items-center gap-2 leading-snug">
            <span className={labelCls}>צבעי מותג:</span>
            <span className="inline-flex items-center gap-1.5" aria-hidden>
              {facts.accentColors.map((hex) => (
                <span
                  key={hex}
                  className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-black/10 dark:ring-white/25"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </span>
            {facts.primaryColor ? (
              <span
                className="font-mono text-[11px] text-gray-500 dark:text-zinc-500"
                dir="ltr"
              >
                {facts.primaryColor}
              </span>
            ) : null}
          </li>
        ) : null}
      </ul>

      {facts.isPartial ? (
        <p
          className={
            isWizard
              ? 'mt-3 text-[11px] leading-relaxed text-amber-200/80'
              : 'mt-3 text-xs leading-relaxed text-amber-800 dark:text-amber-200/90'
          }
        >
          אפשר להשלים פרטים חסרים בהגדרות — ככל שהלמידה מלאה יותר, התוצרים
          מדויקים יותר.
        </p>
      ) : null}
    </aside>
  );
}
