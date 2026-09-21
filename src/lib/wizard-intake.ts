import {
  DENSITY_OPTIONS,
  MAX_SLIDE_COUNT,
  MIN_SLIDE_COUNT,
  RECOMMENDED_SLIDE_COUNT,
  VISUAL_STYLE_OPTIONS,
  type DensityId,
  type VisualStyleId,
} from '@/lib/wizard';

export type WizardChatPhase =
  | 'clarify'
  | 'intake'
  | 'awaiting_options'
  | 'ready_for_directions';

export interface IntakeSuggestions {
  slideCount: number;
  useRecommendedStructure: boolean;
  visualStyle: VisualStyleId;
  visualStyleCustom: string;
  density: DensityId;
}

export interface ParsedUserOptions {
  applyRecommendedAll: boolean;
  readyForDirections: boolean;
  slideCount?: number;
  useRecommendedStructure?: boolean;
  visualStyle?: VisualStyleId;
  visualStyleCustom?: string;
  density?: DensityId;
}

/** Extract N from topics like "5 טיפים ל..." / "5 tips for Cursor" */
export function inferListItemCount(topic: string): number | null {
  const patterns = [
    /(\d+)\s*(?:טיפים|טיפ|דברים|סיבות|טעויות|שלבים|דרכים|כללים|רעיונות)/i,
    /(\d+)\s*(?:tips?|ways|mistakes|steps|reasons|ideas|hacks)/i,
  ];
  for (const re of patterns) {
    const match = topic.match(re);
    if (match) {
      const n = Number(match[1]);
      if (n >= 1 && n <= 12) return n;
    }
  }
  return null;
}

export function recommendedSlideCountForTopic(topic: string): number {
  const items = inferListItemCount(topic);
  if (items != null) {
    return Math.min(
      MAX_SLIDE_COUNT,
      Math.max(MIN_SLIDE_COUNT, items + 2)
    );
  }
  return RECOMMENDED_SLIDE_COUNT;
}

export function nicheStyleRecommendation(topic: string): {
  style: VisualStyleId;
  nicheLabel: string;
  styleReason: string;
} {
  const t = topic.toLowerCase();

  if (
    /cursor|ai|בינה|קוד|פיתוח|סטארטאפ|startup|tech|saas|תוכנה|developer|גיטהאב|github|llm|אוטומצ/.test(
      t
    )
  ) {
    return {
      style: 'bold',
      nicheLabel: 'כלים טכנולוגיים / בינה מלאכותית',
      styleReason:
        'לנישה הזו מתאים מראה נועז עם ניגודיות גבוהה — תחושת עתיד וחדות מסך.',
    };
  }
  if (/יופי|קוסמטי|אופנה|סטייל|beauty|fashion|סקין/.test(t)) {
    return {
      style: 'magazine',
      nicheLabel: 'יופי ואופנה',
      styleReason: 'סגנון מגזיני נותן תחושת שער ופרימיום שמתאימה לנישה.',
    };
  }
  if (/כסף|השקע|פיננס|משכנת|עסקים|מכיר|לידים|שיווק|sales/.test(t)) {
    return {
      style: 'luxury',
      nicheLabel: 'עסקים וצמיחה',
      styleReason: 'יוקרתי כהה משדר אמינות ובגרות לקהל מקצועי.',
    };
  }
  if (/אוכל|מתכון|בריאות|כושר|ספורט|תזונה/.test(t)) {
    return {
      style: 'minimal',
      nicheLabel: 'אורח חיים',
      styleReason: 'מינימליסטי נקי קל לקריאה כשיש טיפים פרקטיים.',
    };
  }

  return {
    style: 'minimal',
    nicheLabel: 'תוכן כללי',
    styleReason: 'מינימליסטי עובד כבסיס נקי — אפשר לשנות בכל רגע.',
  };
}

export function buildIntakeSuggestions(topic: string): IntakeSuggestions {
  const slideCount = recommendedSlideCountForTopic(topic);
  const niche = nicheStyleRecommendation(topic);
  return {
    slideCount,
    useRecommendedStructure: true,
    visualStyle: niche.style,
    visualStyleCustom: '',
    density: 'standard',
  };
}

export function buildIntakeReply(topic: string): string {
  const items = inferListItemCount(topic);
  const slides = recommendedSlideCountForTopic(topic);
  const niche = nicheStyleRecommendation(topic);
  const styleLabel =
    VISUAL_STYLE_OPTIONS.find((s) => s.id === niche.style)?.label || 'מינימליסטי';

  const pagesExtra =
    items != null
      ? `בנושא יש ${items} פריטים — ממליץ על ${slides} שקפים (מספר הפריטים + שער + סיום).`
      : `המלצה ברירת מחדל: ${RECOMMENDED_SLIDE_COUNT} שקפים (שער + תוכן + סיום).`;

  const styleLines = VISUAL_STYLE_OPTIONS.map(
    (s) => `• ${s.label}${s.id === niche.style ? ' ⭐' : ''} — ${s.hint}`
  ).join('\n');

  return [
    `מעולה — «${topic.trim()}» יושב יפה בנישת ${niche.nicheLabel}.`,
    '',
    '⚠️ חשוב: הצ׳אט הוא ייעוץ בלבד. מה שקובע את הקרוסלה — רק «הגדרות סופיות» בפאנל.',
    '',
    '## המלצה · מספר עמודים',
    pagesExtra,
    `אפשר גם מותאם אישית בין ${MIN_SLIDE_COUNT} ל־${MAX_SLIDE_COUNT}.`,
    '',
    '## המלצה · סטייל ויזואלי',
    niche.styleReason,
    `המלצה לנישה: ${styleLabel}.`,
    styleLines,
    '• תיאור חופשי — כתבו איך תרצו שזה ייראה.',
    '',
    '## המלצה · צפיפות מידע',
    DENSITY_OPTIONS.map((d) =>
      d.id === 'standard'
        ? `• ${d.label} ⭐ — ${d.hint}`
        : `• ${d.label} — ${d.hint}`
    ).join('\n'),
    '',
    'ההמלצות הועתקו להתחלה בפאנל. שנו שם מה שרוצים, ואז לחצו «המשך עם ההגדרות הסופיות».',
  ].join('\n');
}

export function isRecommendedAllIntent(message: string): boolean {
  const t = message.trim();
  return /^(מומלץ|הכל מומלץ|קדימה מומלץ|תמליץ|לפי המומלץ|recommended|go recommended)\b/i.test(
    t
  ) || t === 'מומלץ' || t === '⭐' || /^מומלץ[.!]?\s*$/i.test(t);
}

export function parseUserOptionPicks(message: string): ParsedUserOptions {
  const t = message.trim();
  const result: ParsedUserOptions = {
    applyRecommendedAll: isRecommendedAllIntent(t),
    readyForDirections: false,
  };

  if (result.applyRecommendedAll) {
    result.readyForDirections = true;
    return result;
  }

  // Slide count: bare number or "7 שקפים" / "עמודים: 8"
  const countMatch =
    t.match(/(?:^|\s)(?:עמודים?|שקפים?|slides?|pages?)[:\s-]*(\d{1,2})(?:\s|$)/i) ||
    t.match(/^(\d{1,2})\s*(?:שקפים?|עמודים?)?$/);
  if (countMatch) {
    const n = Number(countMatch[1]);
    if (n >= MIN_SLIDE_COUNT && n <= MAX_SLIDE_COUNT) {
      result.slideCount = n;
      result.useRecommendedStructure =
        n === RECOMMENDED_SLIDE_COUNT || n === recommendedSlideCountForTopic(t);
    }
  }

  const lower = t.toLowerCase();
  for (const style of VISUAL_STYLE_OPTIONS) {
    if (
      lower.includes(style.label.toLowerCase()) ||
      lower.includes(style.id)
    ) {
      result.visualStyle = style.id;
    }
  }
  if (/תיאור חופשי|מותאם|custom/i.test(t) && /[:：]/.test(t)) {
    result.visualStyle = 'custom';
    result.visualStyleCustom = t.split(/[:：]/).slice(1).join(':').trim();
  }
  if (/כהה|ניגודיות|עתידני|futuristic|dark/i.test(t) && !result.visualStyle) {
    result.visualStyle = 'bold';
  }
  if (/יוקרת|פרימיום|luxury/i.test(t) && !result.visualStyle) {
    result.visualStyle = 'luxury';
  }

  for (const d of DENSITY_OPTIONS) {
    if (lower.includes(d.label) || lower.includes(d.id)) {
      result.density = d.id;
    }
  }
  if (/קליל|קצר|light/i.test(t) && !result.density) result.density = 'light';
  if (/עשיר|מפורט|rich/i.test(t) && !result.density) result.density = 'rich';
  if (/סטנדרט|standard/i.test(t) && !result.density) result.density = 'standard';

  const pickedSomething =
    result.slideCount != null ||
    result.visualStyle != null ||
    result.density != null;

  // Explicit continue phrases after picks
  if (
    /המשך|קדימה|יאללה|שני כיוונים|הצע כיוונ|לכיוונ|continue|next/i.test(t) &&
    pickedSomething
  ) {
    result.readyForDirections = true;
  }

  // «המשך» לבד — ממשיכים עם ההגדרות הנוכחיות (בלי לאפס להמלצות)
  if (/^(המשך|קדימה|יאללה|continue|next)[.!]?\s*$/i.test(t)) {
    result.readyForDirections = true;
  }

  // If message is only option picks (short), stay in awaiting; if says מוכן
  if (/מוכן|סיימתי|נעול|לסגור הגדרות/i.test(t)) {
    result.readyForDirections = true;
  }

  return result;
}

export function buildOptionsAckReply(
  picks: ParsedUserOptions,
  topic: string
): string {
  if (picks.applyRecommendedAll) {
    const s = buildIntakeSuggestions(topic);
    const styleLabel =
      VISUAL_STYLE_OPTIONS.find((x) => x.id === s.visualStyle)?.label || '';
    return `החלתי את ההמלצה על ההגדרות הסופיות: ${s.slideCount} שקפים, סטייל ${styleLabel}, צפיפות סטנדרטית. עכשיו מציע שני כיווני תוכן…`;
  }

  const bits: string[] = [];
  if (picks.slideCount != null) bits.push(`${picks.slideCount} שקפים`);
  if (picks.visualStyle) {
    const label =
      VISUAL_STYLE_OPTIONS.find((x) => x.id === picks.visualStyle)?.label ||
      picks.visualStyle;
    bits.push(`סטייל ${label}`);
  }
  if (picks.density) {
    const label =
      DENSITY_OPTIONS.find((x) => x.id === picks.density)?.label || picks.density;
    bits.push(`צפיפות ${label}`);
  }

  if (picks.readyForDirections) {
    return `ההגדרות הסופיות בפאנל: ${bits.join(' · ') || 'כפי שבחרתם'}. עוברים לשני כיווני תוכן…`;
  }

  if (bits.length) {
    return `עדכון הצעה: ${bits.join(' · ')}. מה שקובע הוא רק הפאנל — כוונו שם, או כתבו «המשך» כדי לעבור לכיווני תוכן.`;
  }

  return '';
}
