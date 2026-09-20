/** פלטת מותג: 1–3 צבעי HEX לעריכה וליצירה */

export const MAX_BRAND_COLORS = 3;

export type BrandPalette = string[]; // length 1–3

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

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

/** קורא מהשדה הישן brandColor — HEX בודד או כמה מופרדים ב־| / , */
export function parseBrandPalette(
  stored: string | null | undefined,
  fallbackPrimary = '#6366f1'
): BrandPalette {
  if (!stored || !stored.trim()) return [fallbackPrimary];
  const parts = stored
    .split(/[|,]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => normalizeHex(p, ''))
    .filter((p) => HEX_RE.test(p));
  const unique = Array.from(new Set(parts)).slice(0, MAX_BRAND_COLORS);
  return unique.length ? unique : [fallbackPrimary];
}

export function serializeBrandPalette(palette: BrandPalette): string {
  const cleaned = clampPalette(palette);
  return cleaned.join('|');
}

export function clampPalette(
  colors: string[],
  fallbackPrimary = '#6366f1'
): BrandPalette {
  const cleaned = colors
    .map((c) => normalizeHex(c, ''))
    .filter((c) => HEX_RE.test(c))
    .slice(0, MAX_BRAND_COLORS);
  if (!cleaned.length) return [fallbackPrimary];
  return Array.from(new Set(cleaned));
}

export function primaryBrandColor(palette: BrandPalette): string {
  return clampPalette(palette)[0];
}

export function colorForSlide(
  palette: BrandPalette,
  slideIndex: number
): string {
  const p = clampPalette(palette);
  return p[slideIndex % p.length];
}

export interface PalettePreset {
  id: string;
  label: string;
  hint: string;
  colors: [string, string, string];
  styles?: Array<'minimal' | 'bold' | 'luxury' | 'magazine' | 'custom'>;
}

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: 'indigo-sky',
    label: 'אינדיגו ושמיים',
    hint: 'טק / SaaS',
    colors: ['#4f46e5', '#0ea5e9', '#6366f1'],
    styles: ['bold', 'minimal', 'custom'],
  },
  {
    id: 'midnight-gold',
    label: 'לילה וזהב',
    hint: 'יוקרה',
    colors: ['#0f172a', '#d4af37', '#334155'],
    styles: ['luxury', 'magazine'],
  },
  {
    id: 'coral-ink',
    label: 'קורל ודיו',
    hint: 'נועז ושיווקי',
    colors: ['#ef4444', '#111827', '#f97316'],
    styles: ['bold'],
  },
  {
    id: 'forest-mint',
    label: 'יער ונענע',
    hint: 'רגוע ואמין',
    colors: ['#166534', '#10b981', '#052e16'],
    styles: ['minimal', 'magazine'],
  },
  {
    id: 'rose-slate',
    label: 'ורוד וסלייט',
    hint: 'מגזין / לייף סטייל',
    colors: ['#e11d48', '#64748b', '#0f172a'],
    styles: ['magazine', 'custom'],
  },
  {
    id: 'ocean-sand',
    label: 'אוקיינוס וחול',
    hint: 'נקי ובהיר',
    colors: ['#0284c7', '#f59e0b', '#0c4a6e'],
    styles: ['minimal', 'custom'],
  },
];

export function presetsForStyle(style?: string | null): PalettePreset[] {
  if (!style) return PALETTE_PRESETS;
  const matched = PALETTE_PRESETS.filter(
    (p) => !p.styles || p.styles.includes(style as NonNullable<PalettePreset['styles']>[number])
  );
  return matched.length ? matched : PALETTE_PRESETS;
}

/** המלצה מקומית מיידית לפי סגנון/נושא — בלי רשת */
export function recommendPaletteLocal(input: {
  visualStyle?: string | null;
  topic?: string | null;
  seedColor?: string | null;
}): BrandPalette {
  const style = input.visualStyle || 'minimal';
  const topic = (input.topic || '').toLowerCase();
  const presets = presetsForStyle(style);

  if (/יופי|אופנה|beauty|fashion/.test(topic)) {
    return [...PALETTE_PRESETS.find((p) => p.id === 'rose-slate')!.colors];
  }
  if (/כסף|פיננס|עסקים|מכיר|luxury|premium/.test(topic)) {
    return [...PALETTE_PRESETS.find((p) => p.id === 'midnight-gold')!.colors];
  }
  if (/cursor|ai|קוד|טק|saas|סטארטאפ/.test(topic)) {
    return [...PALETTE_PRESETS.find((p) => p.id === 'indigo-sky')!.colors];
  }
  if (/בריאות|כושר|טבע|ירוק/.test(topic)) {
    return [...PALETTE_PRESETS.find((p) => p.id === 'forest-mint')!.colors];
  }

  const pick = presets[0] || PALETTE_PRESETS[0];
  if (input.seedColor) {
    const seed = normalizeHex(input.seedColor);
    return clampPalette([seed, pick.colors[1], pick.colors[2]]);
  }
  return [...pick.colors];
}
