/**
 * סיווג קישורי ייחוס (אתר / אינסטגרם / אחר) וחילוץ רמזים חלשים.
 * לא מבצע רשת — פונקציות טהורות בלבד.
 */

export type ReferenceLinkKind = 'instagram' | 'website' | 'other';

const INSTAGRAM_HOST =
  /^(?:www\.|m\.)?(?:instagram\.com|instagr\.am)$/i;

export function trimUrl(raw: string | null | undefined): string | null {
  const t = (raw || '').trim();
  return t.length ? t : null;
}

export function hostFromUrl(raw: string | null | undefined): string | null {
  const url = trimUrl(raw);
  if (!url) return null;
  try {
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const host = new URL(withProto).hostname.replace(/^www\./i, '');
    return host || null;
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0] || null;
  }
}

export function isInstagramUrl(raw: string | null | undefined): boolean {
  const host = hostFromUrl(raw);
  if (!host) return false;
  return INSTAGRAM_HOST.test(host);
}

/**
 * מחלץ שם משתמש מכתובת אינסטגרם כשרמז חלש אפשרי.
 */
export function extractInstagramUsername(
  raw: string | null | undefined
): string | null {
  const url = trimUrl(raw);
  if (!url || !isInstagramUrl(url)) return null;

  try {
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const { pathname } = new URL(withProto);
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return null;

    const reserved = new Set([
      'p',
      'reel',
      'reels',
      'tv',
      'stories',
      'explore',
      'accounts',
      'direct',
      'about',
      'developer',
      'legal',
      'tags',
      'share',
    ]);

    if (parts[0] === 'stories' && parts[1] && !reserved.has(parts[1])) {
      return sanitizeUsername(parts[1]);
    }

    if (!reserved.has(parts[0].toLowerCase())) {
      return sanitizeUsername(parts[0]);
    }

    return null;
  } catch {
    return null;
  }
}

function sanitizeUsername(raw: string): string | null {
  const cleaned = raw.replace(/^@/, '').trim();
  if (!cleaned || cleaned.length > 30) return null;
  if (!/^[A-Za-z0-9._]+$/.test(cleaned)) return null;
  return cleaned;
}

export function classifyReferenceLink(
  raw: string | null | undefined
): ReferenceLinkKind {
  const url = trimUrl(raw);
  if (!url) return 'other';
  if (isInstagramUrl(url)) return 'instagram';
  const host = hostFromUrl(url);
  if (host) return 'website';
  return 'other';
}

export function collectReferenceUrls(input: {
  referenceLink1?: string | null;
  referenceLink2?: string | null;
  referenceLink3?: string | null;
}): string[] {
  return [
    trimUrl(input.referenceLink1),
    trimUrl(input.referenceLink2),
    trimUrl(input.referenceLink3),
  ].filter(Boolean) as string[];
}
