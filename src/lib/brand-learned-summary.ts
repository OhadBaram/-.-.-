import {
  parseBrandPalette,
  primaryBrandColor,
  type BrandPalette,
} from '@/lib/brand-palette';
import {
  collectReferenceUrls,
  extractInstagramUsername,
  hostFromUrl,
  isInstagramUrl,
  trimUrl,
} from '@/lib/reference-links';
import {
  inferWebsiteStatusFromStored,
  statusLabelHe,
  type ScrapeOutcomeStatus,
  type ScrapeUrlResult,
} from '@/lib/scrape-result';
import {
  summarizePastCarousels,
  type PastCarouselLike,
  type PastCarouselsSummary,
} from '@/lib/past-carousels';

export type BrandLearnedInput = {
  brandIdentity?: string | null;
  brandColor?: string | null;
  websiteUrl?: string | null;
  referenceLink1?: string | null;
  referenceLink2?: string | null;
  referenceLink3?: string | null;
  scrapeReport?: ScrapeUrlResult[] | null;
  pastCarousels?: PastCarouselLike[] | null;
  pastCarouselStyleLimit?: number;
};

export type WebsiteLearningBlock = {
  url: string | null;
  host: string | null;
  status: ScrapeOutcomeStatus;
  statusLabelHe: string;
  detailHe: string;
  signals: string[];
};

export type ReferenceLearningItem = {
  url: string;
  kind: 'instagram' | 'other';
  username: string | null;
  canFetchContent: boolean;
  status: ScrapeOutcomeStatus;
  statusLabelHe: string;
  detailHe: string;
};

export type BrandLearnedFacts = {
  hasAny: boolean;
  isPartial: boolean;
  websiteHost: string | null;
  websiteUrl: string | null;
  referenceCount: number;
  brandIdentitySnippet: string | null;
  accentColors: string[];
  primaryColor: string | null;
  website: WebsiteLearningBlock;
  references: ReferenceLearningItem[];
  pastCarousels: PastCarouselsSummary;
  showLearningPanel: boolean;
};

const IDENTITY_SNIPPET_MAX = 140;

function trimOrNull(value: string | null | undefined): string | null {
  return trimUrl(value);
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

function buildWebsiteBlock(
  websiteUrl: string | null,
  brandIdentity: string | null,
  scrapeReport: ScrapeUrlResult[] | null | undefined
): WebsiteLearningBlock {
  const live = scrapeReport?.find(
    (r) =>
      r.kind !== 'instagram' &&
      websiteUrl &&
      (r.url === websiteUrl ||
        hostFromUrl(r.url) === hostFromUrl(websiteUrl))
  );

  if (live) {
    return {
      url: websiteUrl,
      host: live.hostname || hostFromUrl(websiteUrl),
      status: live.status,
      statusLabelHe: live.statusLabelHe,
      detailHe: live.detailHe,
      signals: live.signals,
    };
  }

  const inferred = inferWebsiteStatusFromStored({
    websiteUrl,
    brandIdentity,
  });
  return {
    url: websiteUrl,
    host: hostFromUrl(websiteUrl),
    status: inferred.status,
    statusLabelHe: inferred.statusLabelHe,
    detailHe: inferred.detailHe,
    signals: inferred.signals,
  };
}

function buildReferenceItems(
  refs: string[],
  scrapeReport: ScrapeUrlResult[] | null | undefined
): ReferenceLearningItem[] {
  return refs.map((url) => {
    const live = scrapeReport?.find((r) => r.url === url);
    if (live) {
      return {
        url,
        kind: live.kind === 'instagram' ? 'instagram' : 'other',
        username: live.instagramUsername,
        canFetchContent: live.status !== 'skipped_instagram',
        status: live.status,
        statusLabelHe: live.statusLabelHe,
        detailHe: live.detailHe,
      };
    }

    if (isInstagramUrl(url)) {
      const username = extractInstagramUsername(url);
      return {
        url,
        kind: 'instagram',
        username,
        canFetchContent: false,
        status: 'skipped_instagram',
        statusLabelHe: statusLabelHe('skipped_instagram'),
        detailHe: username
          ? `פוסטי אינסטגרם לא נקראים אוטומטית. נשתמש ב־@${username} כרמז חלש בלבד — או העלו צילום מסך / תארו סגנון ידנית.`
          : 'פוסטי אינסטגרם לא נקראים אוטומטית. אפשר להעלות צילום מסך או לתאר את הסגנון בהגדרות המותג.',
      };
    }

    return {
      url,
      kind: 'other',
      username: null,
      canFetchContent: true,
      status: 'partial',
      statusLabelHe: 'נשמר קישור',
      detailHe: `קישור ייחוס נשמר (${hostFromUrl(url) || url}). התוכן ייקרא בזמן יצירה אם הכתובת ציבורית.`,
    };
  });
}

/**
 * מחלץ עובדות למידת מותג לתצוגה — בלי להמציא ערכים.
 * כולל שקיפות על סטטוס אתר, אינסטגרם והיסטוריית קרוסלות.
 */
export function buildBrandLearnedFacts(
  input: BrandLearnedInput
): BrandLearnedFacts {
  const websiteUrl = trimOrNull(input.websiteUrl);
  const brandIdentity = trimOrNull(input.brandIdentity);
  const refs = collectReferenceUrls(input);
  const storedColor = trimOrNull(input.brandColor);
  const { accents, primary } = accentsFromStoredColor(storedColor);
  const scrapeReport = input.scrapeReport ?? null;

  const website = buildWebsiteBlock(websiteUrl, brandIdentity, scrapeReport);
  const references = buildReferenceItems(refs, scrapeReport);
  const pastCarousels = summarizePastCarousels(
    input.pastCarousels || [],
    input.pastCarouselStyleLimit ?? 3
  );

  const hasStoredBrand = Boolean(
    websiteUrl || brandIdentity || refs.length > 0 || accents.length > 0
  );
  const hasAny = hasStoredBrand || pastCarousels.usedForStyleCount > 0;
  const isPartial =
    hasStoredBrand &&
    (!brandIdentity ||
      !websiteUrl ||
      website.status === 'partial' ||
      website.status === 'failed' ||
      references.some((r) => r.kind === 'instagram'));

  const showLearningPanel =
    hasAny ||
    website.status === 'failed' ||
    references.length > 0 ||
    pastCarousels.totalCount > 0;

  return {
    hasAny,
    isPartial,
    websiteHost: website.host,
    websiteUrl,
    referenceCount: refs.length,
    brandIdentitySnippet: snippetIdentity(brandIdentity),
    accentColors: accents,
    primaryColor: primary,
    website,
    references,
    pastCarousels,
    showLearningPanel,
  };
}

export type LearningContextPayload = {
  website: WebsiteLearningBlock;
  references: ReferenceLearningItem[];
  pastCarouselsUsed: number;
  pastCarouselsSummaryHe: string;
};

export function toLearningContextPayload(
  facts: BrandLearnedFacts
): LearningContextPayload {
  return {
    website: facts.website,
    references: facts.references,
    pastCarouselsUsed: facts.pastCarousels.usedForStyleCount,
    pastCarouselsSummaryHe: facts.pastCarousels.summaryLineHe,
  };
}
