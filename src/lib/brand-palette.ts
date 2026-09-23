/** פלטת מותג דינמית: אקסנטים + רקעים */

export const MAX_ACCENT_COLORS = 8;
export const MAX_BACKGROUND_COLORS = 8;
/** תאימות לאחור — סה״כ מקסימלי לשדות ישנים */
export const MAX_BRAND_COLORS = MAX_ACCENT_COLORS;

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export interface BrandPalette {
  accents: string[];
  backgrounds: string[];
}

/** מערך ישן של צבעים — מפורש כאקסנטים */
export type LegacyBrandColors = string[];

export function normalizeHex(input: string, fallback = '#6366f1'): string {
  let v = (input || '').trim();
  if (!v) return fallback;
  if (!v.startsWith('#')) v = `#${v}`;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    const r = v[1];
    const g = v[2];
    const b = v[3];
    v = `#${r}${r}${g}${g}${b}${b}`;
  }
  return HEX_RE.test(v) ? v.toLowerCase() : fallback;
}

function cleanHexList(colors: string[], max: number): string[] {
  const cleaned = colors
    .map((c) => normalizeHex(c, ''))
    .filter((c) => HEX_RE.test(c))
    .slice(0, max);
  return Array.from(new Set(cleaned));
}

/** רקעי ברירת מחדל צבעוניים — לא לבן/שחור שטוח */
const DEFAULT_BACKGROUNDS = ['#eef2ff', '#0f172a', '#f0f9ff'];

export function emptyPalette(fallbackPrimary = '#6366f1'): BrandPalette {
  return {
    accents: [fallbackPrimary],
    backgrounds: [...DEFAULT_BACKGROUNDS],
  };
}

export function clampPalette(
  input: BrandPalette | LegacyBrandColors | null | undefined,
  fallbackPrimary = '#6366f1'
): BrandPalette {
  if (!input) return emptyPalette(fallbackPrimary);

  if (Array.isArray(input)) {
    const accents = cleanHexList(input, MAX_ACCENT_COLORS);
    return {
      accents: accents.length ? accents : [fallbackPrimary],
      backgrounds: [...DEFAULT_BACKGROUNDS],
    };
  }

  const accents = cleanHexList(input.accents || [], MAX_ACCENT_COLORS);
  const backgrounds = cleanHexList(
    input.backgrounds || [],
    MAX_BACKGROUND_COLORS
  );
  return {
    accents: accents.length ? accents : [fallbackPrimary],
    backgrounds: backgrounds.length ? backgrounds : [...DEFAULT_BACKGROUNDS],
  };
}

/**
 * קורא מהשדה brandColor:
 * - JSON של {accents,backgrounds}
 * - או HEX בודד / מופרד ב־| ,
 */
export function parseBrandPalette(
  stored: string | null | undefined,
  fallbackPrimary = '#6366f1'
): BrandPalette {
  if (!stored || !stored.trim()) return emptyPalette(fallbackPrimary);
  const raw = stored.trim();

  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as Partial<BrandPalette>;
      return clampPalette(
        {
          accents: parsed.accents || [],
          backgrounds: parsed.backgrounds || [],
        },
        fallbackPrimary
      );
    } catch {
      /* fall through */
    }
  }

  const parts = raw
    .split(/[|,]/)
    .map((p) => p.trim())
    .filter(Boolean);
  return clampPalette(parts, fallbackPrimary);
}

export function serializeBrandPalette(palette: BrandPalette): string {
  return JSON.stringify(clampPalette(palette));
}

export function primaryBrandColor(palette: BrandPalette | LegacyBrandColors): string {
  return clampPalette(palette).accents[0];
}

/**
 * אקסנט אחיד לכל השקפים.
 * `slideIndex` נשמר בחתימה לתאימות קוראים קיימים — אינו משנה את הצבע.
 */
export function colorForSlide(
  palette: BrandPalette | LegacyBrandColors,
  _slideIndex = 0
): string {
  return primaryBrandColor(palette);
}

/** בהירות יחסית 0–1 (סמוך ל־WCAG relative luminance) */
export function luminance(hex: string): number {
  const c = normalizeHex(hex).slice(1);
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function channelChroma(hex: string): number {
  const c = normalizeHex(hex).slice(1);
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return Math.max(r, g, b) - Math.min(r, g, b);
}

/** לבן/שחור/אפור שטוחים נפוצים — לא גוון צבעוני עדין */
export function isNearNeutral(hex: string): boolean {
  const normalized = normalizeHex(hex);
  const FLAT = new Set([
    '#ffffff',
    '#fafafa',
    '#f8fafc',
    '#f9fafb',
    '#f3f4f6',
    '#000000',
    '#111827',
    '#0f172a',
    '#030712',
    '#1f2937',
  ]);
  if (FLAT.has(normalized)) return true;

  const c = normalized.slice(1);
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  // לבן כמעט טהור בלי גוון
  if (min >= 248 && chroma <= 10) return true;
  // שחור כמעט טהור
  if (max <= 22 && chroma <= 10) return true;
  return false;
}

/** צבע טקסט קריא מעל רקע נתון */
export function textColorForBackground(bg: string): string {
  return luminance(bg) >= 0.45 ? '#111827' : '#f8fafc';
}

/**
 * רקע לשקף לפי מצב בהיר/כהה, אינדקס השקף ותפקידו.
 * מעדיף גוון צבעוני מהפלטה על פני לבן/שחור שטוח,
 * ומגוון בצבעים בין השקפים כשיש מספר רקעים זמינים בפלטה.
 */
export function backgroundForSlide(
  palette: BrandPalette | LegacyBrandColors,
  slideIndex = 0,
  isDark = false,
  _role?: string,
  _totalSlides?: number
): string | undefined {
  const backgrounds = clampPalette(palette).backgrounds;
  if (!backgrounds.length) return undefined;
  if (backgrounds.length === 1) return backgrounds[0];

  if (isDark) {
    const darks = backgrounds.filter((c) => luminance(c) < 0.35);
    const pool = darks.length > 0 ? darks : backgrounds;
    const sorted = [...pool].sort((a, b) => {
      const aNeutral = isNearNeutral(a) ? 1 : 0;
      const bNeutral = isNearNeutral(b) ? 1 : 0;
      if (aNeutral !== bNeutral) return aNeutral - bNeutral;
      return channelChroma(b) - channelChroma(a);
    });
    return sorted[slideIndex % sorted.length];
  }

  const lights = backgrounds.filter((c) => luminance(c) >= 0.35);
  const pool = lights.length > 0 ? lights : backgrounds;
  const sorted = [...pool].sort((a, b) => {
    const aNeutral = isNearNeutral(a) ? 1 : 0;
    const bNeutral = isNearNeutral(b) ? 1 : 0;
    if (aNeutral !== bNeutral) return aNeutral - bNeutral;
    return channelChroma(b) - channelChroma(a);
  });
  return sorted[slideIndex % sorted.length];
}

/** האם הפלטה עדיין «שטוחה» (רקעים ניטרליים בלבד) */
export function isBoringPalette(
  palette: BrandPalette | LegacyBrandColors | null | undefined
): boolean {
  const backgrounds = clampPalette(palette).backgrounds;
  if (!backgrounds.length) return true;
  return backgrounds.every((c) => isNearNeutral(c));
}

export function accentLabel(index: number): string {
  if (index === 0) return 'אקסנט ראשי';
  if (index === 1) return 'אקסנט משני';
  if (index === 2) return 'אקסנט שלישי';
  return `אקסנט ${index + 1}`;
}

export function backgroundLabel(index: number): string {
  if (index === 0) return 'רקע בהיר';
  if (index === 1) return 'רקע כהה';
  return `רקע ${index + 1}`;
}

export interface PalettePreset {
  id: string;
  label: string;
  hint: string;
  accents: string[];
  backgrounds: string[];
  styles?: Array<'minimal' | 'bold' | 'luxury' | 'magazine' | 'custom'>;
}

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: 'indigo-sky',
    label: 'אינדיגו ושמיים',
    hint: 'טק / SaaS',
    accents: ['#4f46e5', '#0ea5e9', '#6366f1', '#38bdf8'],
    backgrounds: ['#eef2ff', '#0f172a', '#e0f2fe'],
    styles: ['bold', 'minimal', 'custom'],
  },
  {
    id: 'midnight-gold',
    label: 'לילה וזהב',
    hint: 'יוקרה',
    accents: ['#d4af37', '#f5d76e', '#94a3b8'],
    backgrounds: ['#1e293b', '#0f172a', '#fef3c7'],
    styles: ['luxury', 'magazine'],
  },
  {
    id: 'coral-ink',
    label: 'קורל ודיו',
    hint: 'נועז ושיווקי',
    accents: ['#ef4444', '#f97316', '#fb7185', '#111827'],
    backgrounds: ['#fff7ed', '#1c1917', '#ffe4e6'],
    styles: ['bold'],
  },
  {
    id: 'forest-mint',
    label: 'יער ונענע',
    hint: 'רגוע ואמין',
    accents: ['#166534', '#10b981', '#34d399'],
    backgrounds: ['#ecfdf5', '#052e16', '#d1fae5'],
    styles: ['minimal', 'magazine'],
  },
  {
    id: 'rose-slate',
    label: 'ורוד וסלייט',
    hint: 'מגזין / לייף סטייל',
    accents: ['#e11d48', '#64748b', '#fb7185', '#0f172a'],
    backgrounds: ['#fff1f2', '#0f172a', '#fce7f3'],
    styles: ['magazine', 'custom'],
  },
  {
    id: 'ocean-sand',
    label: 'אוקיינוס וחול',
    hint: 'נקי ובהיר',
    accents: ['#0284c7', '#f59e0b', '#0ea5e9', '#075985'],
    backgrounds: ['#e0f2fe', '#0c4a6e', '#fffbeb'],
    styles: ['minimal', 'custom'],
  },
  {
    id: 'sunset-violet',
    label: 'שקיעה וסגול',
    hint: 'יצירתי / קהילה',
    accents: ['#c026d3', '#f97316', '#a855f7'],
    backgrounds: ['#faf5ff', '#3b0764', '#ffedd5'],
    styles: ['bold', 'magazine', 'custom'],
  },
  {
    id: 'amber-earth',
    label: 'ענבר ואדמה',
    hint: 'אוכל / בית / חום',
    accents: ['#b45309', '#ea580c', '#78350f'],
    backgrounds: ['#fffbeb', '#292524', '#ffedd5'],
    styles: ['minimal', 'magazine', 'custom'],
  },
];

export function presetsForStyle(style?: string | null): PalettePreset[] {
  if (!style) return PALETTE_PRESETS;
  const matched = PALETTE_PRESETS.filter(
    (p) =>
      !p.styles ||
      p.styles.includes(style as NonNullable<PalettePreset['styles']>[number])
  );
  return matched.length ? matched : PALETTE_PRESETS;
}

function hashTopic(topic: string): number {
  let h = 0;
  for (let i = 0; i < topic.length; i++) {
    h = (h * 31 + topic.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function recommendPaletteLocal(input: {
  visualStyle?: string | null;
  topic?: string | null;
  seedColor?: string | null;
}): BrandPalette {
  const style = input.visualStyle || 'minimal';
  const topic = (input.topic || '').toLowerCase();
  const presets = presetsForStyle(style);

  let pick = presets[hashTopic(topic || style) % presets.length] || PALETTE_PRESETS[0];

  if (/יופי|איפור|טיפוח|אופנה|fashion|beauty|makeup|skincare/.test(topic)) {
    pick = PALETTE_PRESETS.find((p) => p.id === 'rose-slate') || pick;
  } else if (
    /כסף|פיננס|השקע|עסקים|מכיר|luxury|premium|יוקר|נדל|עורך דין|משפט/.test(
      topic
    )
  ) {
    pick = PALETTE_PRESETS.find((p) => p.id === 'midnight-gold') || pick;
  } else if (
    /cursor|ai|קוד|טק|saas|סטארטאפ|startup|תוכנה|פיתוח|בינה|אוטומצ|llm|developer/.test(
      topic
    )
  ) {
    pick = PALETTE_PRESETS.find((p) => p.id === 'indigo-sky') || pick;
  } else if (
    /בריאות|כושר|ספורט|טבע|ירוק|יוגה|תזונה|health|fitness|wellness/.test(
      topic
    )
  ) {
    pick = PALETTE_PRESETS.find((p) => p.id === 'forest-mint') || pick;
  } else if (
    /שיווק|מכירות|לידים|קמפיין|נוכחות|אינסטגרם|תוכן|marketing|sales|growth/.test(
      topic
    )
  ) {
    pick = PALETTE_PRESETS.find((p) => p.id === 'coral-ink') || pick;
  } else if (
    /אוכל|מתכון|מסעדה|אפייה|קפה|יין|food|recipe|cafe|coffee/.test(topic)
  ) {
    pick = PALETTE_PRESETS.find((p) => p.id === 'amber-earth') || pick;
  } else if (
    /ים|נסיע|תייר|חופשה|travel|ocean|beach|ים תיכון/.test(topic)
  ) {
    pick = PALETTE_PRESETS.find((p) => p.id === 'ocean-sand') || pick;
  } else if (
    /קהילה|יציר|אמנות|עיצוב|פודקאסט|מוזיקה|creative|design|community/.test(
      topic
    )
  ) {
    pick = PALETTE_PRESETS.find((p) => p.id === 'sunset-violet') || pick;
  } else if (style === 'luxury') {
    pick = PALETTE_PRESETS.find((p) => p.id === 'midnight-gold') || pick;
  } else if (style === 'bold') {
    pick = PALETTE_PRESETS.find((p) => p.id === 'coral-ink') || pick;
  } else if (style === 'magazine') {
    pick = PALETTE_PRESETS.find((p) => p.id === 'rose-slate') || pick;
  }

  const accents = [...pick.accents];
  if (input.seedColor) {
    accents[0] = normalizeHex(input.seedColor);
  }
  return clampPalette({
    accents,
    backgrounds: [...pick.backgrounds],
  });
}

/**
 * מחיל רקע + צבע טקסט מהפלטה על שקפים שנוצרו —
 * משמר גוונים צבעוניים שה-AI הפיק, ומשלים/מגוון מהפלטה
 * לשקפים ללא צבע או עם צבע לבן/שחור שטוח.
 */
export function applyPaletteColorsToSlides<
  T extends { backgroundColor?: string; textColor?: string; role?: string },
>(
  slides: T[],
  palette: BrandPalette | LegacyBrandColors,
  isDark = false
): T[] {
  return slides.map((slide, index) => {
    const existingBg = slide.backgroundColor?.trim();
    const hasValidColor =
      Boolean(existingBg) &&
      /^#[0-9a-fA-F]{3,8}$/.test(existingBg!) &&
      !isNearNeutral(existingBg!);

    const surface = hasValidColor
      ? existingBg!
      : backgroundForSlide(palette, index, isDark, slide.role, slides.length) ||
        (isDark ? '#0f172a' : '#eef2ff');

    const existingText = slide.textColor?.trim();
    const hasGoodContrast =
      hasValidColor &&
      Boolean(existingText) &&
      /^#[0-9a-fA-F]{3,8}$/.test(existingText!) &&
      Math.abs(luminance(existingText!) - luminance(surface)) >= 0.35;

    const fg = hasGoodContrast
      ? existingText!
      : textColorForBackground(surface);

    return {
      ...slide,
      backgroundColor: surface,
      textColor: fg,
    };
  });
}

/**
 * בוחר פלטה ליצירה: משתמש בפלטת המשתמש אם יש רקעים צבעוניים,
 * אחרת ממליץ לפי נושא/סגנון (שומר אקסנט קיים כ־seed).
 */
export function resolveGenerationPalette(input: {
  brandColors?: BrandPalette | LegacyBrandColors | null;
  topic?: string | null;
  visualStyle?: string | null;
}): BrandPalette {
  const provided = input.brandColors
    ? clampPalette(input.brandColors)
    : null;
  if (provided && !isBoringPalette(provided)) {
    return provided;
  }
  return recommendPaletteLocal({
    topic: input.topic,
    visualStyle: input.visualStyle,
    seedColor: provided?.accents[0],
  });
}
