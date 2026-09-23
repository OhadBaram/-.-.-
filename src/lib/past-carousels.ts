/**
 * בחירת קרוסלות קודמות ללמידת סגנון והזרקה לפרומפט.
 */

export type PastCarouselLike = {
  topic?: string | null;
  title?: string | null;
  slidesData?: unknown;
  createdAt?: Date | string | null;
};

export type PastCarouselStylePick = {
  topic: string;
  slidesText: string;
};

export type PastCarouselsSummary = {
  totalCount: number;
  withSlidesCount: number;
  usedForStyleCount: number;
  topics: string[];
  summaryLineHe: string;
};

const DEFAULT_STYLE_LIMIT = 3;

function slidesTextFromData(slidesData: unknown): string {
  try {
    if (Array.isArray(slidesData)) {
      return slidesData
        .map((s: { text?: unknown }) =>
          typeof s?.text === 'string' ? s.text : ''
        )
        .filter(Boolean)
        .join(' | ');
    }
    if (
      slidesData &&
      typeof slidesData === 'object' &&
      Array.isArray((slidesData as { slides?: unknown }).slides)
    ) {
      return ((slidesData as { slides: { text?: unknown }[] }).slides)
        .map((s) => (typeof s?.text === 'string' ? s.text : ''))
        .filter(Boolean)
        .join(' | ');
    }
  } catch {
    /* ignore malformed */
  }
  return '';
}

export function pickPastCarouselsForStyle(
  carousels: PastCarouselLike[],
  limit = DEFAULT_STYLE_LIMIT
): PastCarouselStylePick[] {
  const picks: PastCarouselStylePick[] = [];
  for (const c of carousels) {
    const slidesText = slidesTextFromData(c.slidesData);
    if (!slidesText.trim()) continue;
    picks.push({
      topic: (c.topic || c.title || 'ללא נושא').trim() || 'ללא נושא',
      slidesText: slidesText.slice(0, 1200),
    });
    if (picks.length >= limit) break;
  }
  return picks;
}

export function formatPastCarouselsForPrompt(
  picks: PastCarouselStylePick[]
): string {
  if (picks.length === 0) return '';

  const formatted = picks
    .map(
      (c, i) =>
        `Past Carousel ${i + 1} (Topic: ${c.topic}): [${c.slidesText}]`
    )
    .join('\n');

  return `\nלהלן קרוסלות קודמות שהמשתמש יצר בעבר:\n${formatted}\nלמד מהסגנון והטון בלבד — אל תחליף את נושא הקרוסלה החדשה בנושאים ישנים. כמומחה שיווק, גוון זוויות ומסרים *בתוך* הנושא הנוכחי בלבד.\n`;
}

export function summarizePastCarousels(
  carousels: PastCarouselLike[],
  limit = DEFAULT_STYLE_LIMIT
): PastCarouselsSummary {
  const totalCount = carousels.length;
  const withSlides = carousels.filter(
    (c) => slidesTextFromData(c.slidesData).trim().length > 0
  );
  const withSlidesCount = withSlides.length;
  const picks = pickPastCarouselsForStyle(carousels, limit);
  const usedForStyleCount = picks.length;
  const topics = picks.map((p) => p.topic).slice(0, limit);

  let summaryLineHe = 'אין עדיין קרוסלות קודמות ללמידת סגנון.';
  if (usedForStyleCount > 0) {
    summaryLineHe =
      usedForStyleCount === 1
        ? 'קרוסלה קודמת אחת נלקחת בחשבון לסגנון ולטון.'
        : `${usedForStyleCount} קרוסלות קודמות נלקחו בחשבון לסגנון.`;
  } else if (totalCount > 0) {
    summaryLineHe =
      'יש קרוסלות בהיסטוריה, אך בלי תוכן שקפים שניתן ללמוד ממנו סגנון.';
  }

  return {
    totalCount,
    withSlidesCount,
    usedForStyleCount,
    topics,
    summaryLineHe,
  };
}
