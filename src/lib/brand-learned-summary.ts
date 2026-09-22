import {
  parseBrandPalette,
  primaryBrandColor,
  type BrandPalette,
} from '@/lib/brand-palette';

export type BrandLearnedInput = {
  brandIdentity?: string | null;
  brandColor?: string | null;
  websiteUrl?: string | null;
  referenceLink1?: string | null;
  referenceLink2?: string | null;
  referenceLink3?: string | null;
};

export type BrandLearnedFacts = {
  /** יש לפחות שדה מותג אמיתי שנשמר */
  hasAny: boolean;
  /** יש חלק מהשדות אבל חסרים זהות או אתר */
  isPartial: boolean;
  websiteHost: string | null;
  websiteUrl: string | null;
  referenceCount: number;
  brandIdentitySnippet: string | null;
  accentColors: string[];
  primaryColor: string | null;
};

const IDENTITY_SNIPPET_MAX = 140;

function trimOrNull(value: string | null | undefined): string | null {
  const t = (value || '').trim();
  return t.length ? t : null;
}

function hostFromUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const host = new URL(withProto).hostname.replace(/^www\./i, '');
    return host || null;
  } catch {
    return raw.replace(/^https?:\/\//i, '').split('/')[0] || null;
  }
}

function snippetIdentity(raw: string | null): string | null {
  if (!raw) return null;
  const oneLine = raw.replace(/\s+/g, ' ').trim();
  if (!oneLine) return null;
  if (oneLine.length <= IDENTITY_SNIPPET_MAX) return oneLine;
  return `${oneLine.slice(0, IDENTITY_SNIPPET_MAX - 1).trimEnd()}…`;
}

function accentsFromStoredColor(
  stored: string | null
): { accents: string[]; primary: string | null } {
  if (!stored) return { accents: [], primary: null };
  const palette: BrandPalette = parseBrandPalette(stored);
  const accents = palette.accents.slice(0, 4);
  return {
    accents,
    primary: accents.length ? primaryBrandColor(palette) : null,
  };
}

/**
 * מחלץ עובדות למידת מותג לתצוגה — בלי להמציא ערכים.
 * צבע ברירת מחדל שלא נשמר ב־workspace לא נחשב ללמידה.
 */
export function buildBrandLearnedFacts(
  input: BrandLearnedInput
): BrandLearnedFacts {
  const websiteUrl = trimOrNull(input.websiteUrl);
  const brandIdentity = trimOrNull(input.brandIdentity);
  const refs = [
    trimOrNull(input.referenceLink1),
    trimOrNull(input.referenceLink2),
    trimOrNull(input.referenceLink3),
  ].filter(Boolean) as string[];
  const storedColor = trimOrNull(input.brandColor);
  const { accents, primary } = accentsFromStoredColor(storedColor);

  const hasAny = Boolean(
    websiteUrl || brandIdentity || refs.length > 0 || accents.length > 0
  );
  /** חלקי = יש למידה, אבל חסרים זהות או אתר (השדות המרכזיים לטון) */
  const isPartial = hasAny && (!brandIdentity || !websiteUrl);

  return {
    hasAny,
    isPartial,
    websiteHost: hostFromUrl(websiteUrl),
    websiteUrl,
    referenceCount: refs.length,
    brandIdentitySnippet: snippetIdentity(brandIdentity),
    accentColors: accents,
    primaryColor: primary,
  };
}
