'use client';

import Link from 'next/link';
import type { BrandLearnedFacts } from '@/lib/brand-learned-summary';
import type { ScrapeOutcomeStatus } from '@/lib/scrape-result';

type Variant = 'wizard' | 'dashboard' | 'onboarding';

function statusTone(
  status: ScrapeOutcomeStatus,
  isWizard: boolean
): string {
  switch (status) {
    case 'success':
      return isWizard
        ? 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/30'
        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200 ring-emerald-500/20';
    case 'partial':
      return isWizard
        ? 'bg-amber-500/20 text-amber-100 ring-amber-400/30'
        : 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100 ring-amber-500/25';
    case 'failed':
      return isWizard
        ? 'bg-rose-500/20 text-rose-100 ring-rose-400/30'
        : 'bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-100 ring-rose-500/25';
    case 'skipped_instagram':
      return isWizard
        ? 'bg-sky-500/15 text-sky-100 ring-sky-400/25'
        : 'bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-100 ring-sky-500/20';
    default:
      return isWizard
        ? 'bg-zinc-500/20 text-zinc-300 ring-white/10'
        : 'bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-zinc-200 ring-black/5';
  }
}

function StatusPill({
  label,
  status,
  isWizard,
}: {
  label: string;
  status: ScrapeOutcomeStatus;
  isWizard: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${statusTone(status, isWizard)}`}
    >
      {label}
    </span>
  );
}

export default function BrandLearnedSummary({
  facts,
  variant = 'wizard',
}: {
  facts: BrandLearnedFacts;
  variant?: Variant;
}) {
  const isWizard = variant === 'wizard' || variant === 'onboarding';
  const isOnboarding = variant === 'onboarding';

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
    ? 'mt-3 space-y-3 text-xs text-zinc-300'
    : 'mt-3 space-y-3.5 text-sm text-gray-700 dark:text-zinc-300';

  const linkCls = isWizard
    ? 'text-[11px] font-bold text-zinc-400 underline underline-offset-2 hover:text-zinc-200'
    : 'text-xs font-bold text-emerald-800 dark:text-emerald-300 underline underline-offset-2';

  const hostCls = isWizard
    ? 'mt-0.5 block font-mono text-[11px] text-sky-300/90'
    : 'mt-0.5 block font-mono text-xs text-sky-700 dark:text-sky-300';

  const detailCls = isWizard
    ? 'mt-1 text-[11px] leading-relaxed text-zinc-400'
    : 'mt-1 text-xs leading-relaxed text-gray-500 dark:text-zinc-400';

  if (!facts.showLearningPanel && !facts.hasAny) {
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
          וייראו כמוכם. שימו לב: פוסטי אינסטגרם לא נקראים אוטומטית.
        </p>
        {!isOnboarding ? (
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
        ) : null}
      </aside>
    );
  }

  const igRefs = facts.references.filter((r) => r.kind === 'instagram');
  const otherRefs = facts.references.filter((r) => r.kind !== 'instagram');

  return (
    <aside className={shell} dir="rtl" aria-label="מה למדנו על המותג">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={titleCls}>
          {isOnboarding
            ? 'שקיפות למידה — מה באמת נלקח בחשבון'
            : 'מה כבר למדנו עליכם'}
        </h2>
        {!isOnboarding ? (
          <Link href="/dashboard/settings" className={linkCls}>
            לעדכון בהגדרות
          </Link>
        ) : null}
      </div>

      <p className={bodyCls}>
        כאן רואים במפורש מה זוהה מהאתר, מה לא נקרא מאינסטגרם, ואיך היסטוריית
        הקרוסלות משפיעה על הסגנון.
      </p>

      <ul className={listCls}>
        <li className="leading-snug">
          <div className="flex flex-wrap items-center gap-2">
            <span className={labelCls}>אתר העסק</span>
            <StatusPill
              label={facts.website.statusLabelHe}
              status={facts.website.status}
              isWizard={isWizard}
            />
          </div>
          {facts.website.host ? (
            <span className={hostCls} dir="ltr">
              {facts.website.host}
            </span>
          ) : null}
          <p className={detailCls}>{facts.website.detailHe}</p>
          {facts.website.signals.length > 0 ? (
            <ul className="mt-1.5 space-y-1 border-r-2 border-emerald-500/30 pr-2">
              {facts.website.signals.map((s) => (
                <li
                  key={s}
                  className={
                    isWizard
                      ? 'text-[11px] text-zinc-400'
                      : 'text-xs text-gray-500 dark:text-zinc-400'
                  }
                >
                  {s}
                </li>
              ))}
            </ul>
          ) : null}
        </li>

        {igRefs.length > 0 ? (
          <li className="leading-snug">
            <div className="flex flex-wrap items-center gap-2">
              <span className={labelCls}>קישורי אינסטגרם</span>
              <StatusPill
                label="לא נקרא אוטומטית"
                status="skipped_instagram"
                isWizard={isWizard}
              />
            </div>
            <p className={detailCls}>
              אי אפשר לקרוא תוכן פוסטים מאינסטגרם אוטומטית (חסמים טכניים).
              מה כן נלקח: שם משתמש מהכתובת כרמז חלש לזהות — לא סגנון ויזואלי
              של הפוסט.
            </p>
            <ul className="mt-1.5 space-y-1">
              {igRefs.map((r) => (
                <li key={r.url} className="flex flex-wrap items-center gap-2">
                  {r.username ? (
                    <span
                      className={
                        isWizard
                          ? 'font-mono text-[11px] text-sky-300'
                          : 'font-mono text-xs text-sky-700 dark:text-sky-300'
                      }
                      dir="ltr"
                    >
                      @{r.username}
                    </span>
                  ) : (
                    <span
                      className={
                        isWizard
                          ? 'font-mono text-[11px] text-zinc-500'
                          : 'font-mono text-xs text-gray-500'
                      }
                      dir="ltr"
                    >
                      {r.url.replace(/^https?:\/\//i, '').slice(0, 40)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p
              className={
                isWizard
                  ? 'mt-2 text-[11px] font-semibold text-sky-200/90'
                  : 'mt-2 text-xs font-semibold text-sky-800 dark:text-sky-200'
              }
            >
              חלופות מומלצות: העלאת צילום מסך בעורך, או תיאור סגנון ידני בזהות
              המותג בהגדרות.
            </p>
          </li>
        ) : null}

        {otherRefs.length > 0 ? (
          <li className="leading-snug">
            <span className={labelCls}>קישורי ייחוס נוספים</span>
            <ul className="mt-1.5 space-y-2">
              {otherRefs.map((r) => (
                <li key={r.url}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill
                      label={r.statusLabelHe}
                      status={r.status}
                      isWizard={isWizard}
                    />
                    <span className={hostCls} dir="ltr">
                      {r.url.replace(/^https?:\/\//i, '').slice(0, 48)}
                    </span>
                  </div>
                  <p className={detailCls}>{r.detailHe}</p>
                </li>
              ))}
            </ul>
          </li>
        ) : null}

        <li className="leading-snug">
          <div className="flex flex-wrap items-center gap-2">
            <span className={labelCls}>היסטוריית קרוסלות</span>
            {facts.pastCarousels.usedForStyleCount > 0 ? (
              <StatusPill
                label={`${facts.pastCarousels.usedForStyleCount} לסגנון`}
                status="success"
                isWizard={isWizard}
              />
            ) : (
              <StatusPill
                label="אין עדיין"
                status="missing"
                isWizard={isWizard}
              />
            )}
          </div>
          <p className={detailCls}>{facts.pastCarousels.summaryLineHe}</p>
          {facts.pastCarousels.topics.length > 0 ? (
            <p
              className={
                isWizard
                  ? 'mt-1 text-[11px] text-zinc-500'
                  : 'mt-1 text-xs text-gray-500 dark:text-zinc-500'
              }
            >
              נושאים שנלמדו מהם סגנון:{' '}
              {facts.pastCarousels.topics.join(' · ')}
            </p>
          ) : null}
        </li>

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
          הלמידה חלקית או כוללת מגבלות (למשל אינסטגרם). השלמת אתר וזהות מותג
          משפרת דיוק — פוסטי אינסטגרם עדיין לא ייקראו אוטומטית.
        </p>
      ) : null}
    </aside>
  );
}
