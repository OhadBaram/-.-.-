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

export function emptyPalette(fallbackPrimary = '#6366f1'): BrandPalette {
  return {
    accents: [fallbackPrimary],
    backgrounds: ['#ffffff', '#111827'],
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
      backgrounds: ['#ffffff', '#111827'],
    };
  }

  const accents = cleanHexList(input.accents || [], MAX_ACCENT_COLORS);
  const backgrounds = cleanHexList(
    input.backgrounds || [],
    MAX_BACKGROUND_COLORS
  );
  return {
    accents: accents.length ? accents : [fallbackPrimary],
    backgrounds,
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

export function colorForSlide(
  palette: BrandPalette | LegacyBrandColors,
  slideIndex: number
): string {
  const accents = clampPalette(palette).accents;
  return accents[slideIndex % accents.length];
}

export function backgroundForSlide(
  palette: BrandPalette | LegacyBrandColors,
  slideIndex: number,
  isDark = false
): string | undefined {
  const backgrounds = clampPalette(palette).backgrounds;
  if (!backgrounds.length) return undefined;
  if (backgrounds.length === 1) return backgrounds[0];
  // במצב כהה מעדיפים רקע כהה אם קיים בפלטה
  if (isDark) {
    const darkish = backgrounds.find((c) => luminance(c) < 0.35);
    if (darkish) return darkish;
  } else {
    const lightish = backgrounds.find((c) => luminance(c) >= 0.35);
    if (lightish && backgrounds.length > 1) {
      return backgrounds[slideIndex % backgrounds.length];
    }
  }
  return backgrounds[slideIndex % backgrounds.length];
}

function luminance(hex: string): number {
  const c = normalizeHex(hex).slice(1);
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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
    backgrounds: ['#ffffff', '#0f172a', '#eef2ff'],
    styles: ['bold', 'minimal', 'custom'],
  },
  {
    id: 'midnight-gold',
    label: 'לילה וזהב',
    hint: 'יוקרה',
    accents: ['#d4af37', '#f5d76e', '#94a3b8'],
    backgrounds: ['#0f172a', '#1e293b', '#f8fafc'],
    styles: ['luxury', 'magazine'],
  },
  {
    id: 'coral-ink',
    label: 'קורל ודיו',
    hint: 'נועז ושיווקי',
    accents: ['#ef4444', '#f97316', '#fb7185', '#111827'],
    backgrounds: ['#fff7ed', '#111827', '#ffffff'],
    styles: ['bold'],
  },
  {
    id: 'forest-mint',
    label: 'יער ונענע',
    hint: 'רגוע ואמין',
    accents: ['#166534', '#10b981', '#34d399'],
    backgrounds: ['#f0fdf4', '#052e16', '#ffffff'],
    styles: ['minimal', 'magazine'],
  },
  {
    id: 'rose-slate',
    label: 'ורוד וסלייט',
    hint: 'מגזין / לייף סטייל',
    accents: ['#e11d48', '#64748b', '#fb7185', '#0f172a'],
    backgrounds: ['#fff1f2', '#0f172a', '#f8fafc'],
    styles: ['magazine', 'custom'],
  },
  {
    id: 'ocean-sand',
    label: 'אוקיינוס וחול',
    hint: 'נקי ובהיר',
    accents: ['#0284c7', '#f59e0b', '#0ea5e9', '#075985'],
    backgrounds: ['#f0f9ff', '#0c4a6e', '#fffbeb'],
    styles: ['minimal', 'custom'],
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

export function recommendPaletteLocal(input: {
  visualStyle?: string | null;
  topic?: string | null;
  seedColor?: string | null;
}): BrandPalette {
  const style = input.visualStyle || 'minimal';
  const topic = (input.topic || '').toLowerCase();
  const presets = presetsForStyle(style);

  let pick = presets[0] || PALETTE_PRESETS[0];
  if (/יופי|אופנה|beauty|fashion/.test(topic)) {
    pick = PALETTE_PRESETS.find((p) => p.id === 'rose-slate') || pick;
  } else if (/כסף|פיננס|עסקים|מכיר|luxury|premium/.test(topic)) {
    pick = PALETTE_PRESETS.find((p) => p.id === 'midnight-gold') || pick;
  } else if (/cursor|ai|קוד|טק|saas|סטארטאפ/.test(topic)) {
    pick = PALETTE_PRESETS.find((p) => p.id === 'indigo-sky') || pick;
  } else if (/בריאות|כושר|טבע|ירוק/.test(topic)) {
    pick = PALETTE_PRESETS.find((p) => p.id === 'forest-mint') || pick;
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
