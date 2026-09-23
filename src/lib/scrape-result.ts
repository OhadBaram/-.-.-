/**
 * תוצאות סריקה מובנות — סטטוס, אותות קצרים, והודעות כנות בעברית.
 */

import {
  classifyReferenceLink,
  extractInstagramUsername,
  hostFromUrl,
  isInstagramUrl,
  trimUrl,
  type ReferenceLinkKind,
} from '@/lib/reference-links';

export type ScrapeOutcomeStatus =
  | 'success'
  | 'partial'
  | 'failed'
  | 'skipped_instagram'
  | 'missing';

export type ScrapeUrlResult = {
  url: string;
  kind: ReferenceLinkKind;
  hostname: string | null;
  status: ScrapeOutcomeStatus;
  promptText: string;
  contentChars: number;
  signals: string[];
  instagramUsername: string | null;
  statusLabelHe: string;
  detailHe: string;
};

const FAIL_IDENTITY_MARKERS = [
  'לא הצלחנו למשוך מידע',
  'לא הצלחנו לנתח',
];

const MIN_SUCCESS_CHARS = 280;
const MIN_PARTIAL_CHARS = 80;
const SIGNAL_MAX = 3;
const SIGNAL_LEN = 90;

export function isFailedBrandIdentity(
  identity: string | null | undefined
): boolean {
  const t = (identity || '').trim();
  if (!t) return true;
  return FAIL_IDENTITY_MARKERS.some((m) => t.includes(m));
}

export function extractContentSignals(
  text: string,
  max = SIGNAL_MAX
): string[] {
  if (!text.trim()) return [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^#+\s*/, '').replace(/\s+/g, ' ').trim())
    .filter((l) => l.length >= 12)
    .filter((l) => !/^---/.test(l))
    .filter((l) => !/^מידע מהקישור/i.test(l));

  const signals: string[] = [];
  for (const line of lines) {
    const clipped =
      line.length > SIGNAL_LEN
        ? `${line.slice(0, SIGNAL_LEN - 1).trimEnd()}…`
        : line;
    if (signals.some((s) => s === clipped)) continue;
    signals.push(clipped);
    if (signals.length >= max) break;
  }
  return signals;
}

export function classifyScrapedText(
  text: string
): Exclude<ScrapeOutcomeStatus, 'skipped_instagram' | 'missing'> {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const len = cleaned.length;
  if (len < MIN_PARTIAL_CHARS) return 'failed';
  if (len < MIN_SUCCESS_CHARS) return 'partial';
  return 'success';
}

export function statusLabelHe(status: ScrapeOutcomeStatus): string {
  switch (status) {
    case 'success':
      return 'זוהה תוכן';
    case 'partial':
      return 'חלקי';
    case 'failed':
      return 'נכשל';
    case 'skipped_instagram':
      return 'לא נקרא אוטומטית';
    case 'missing':
      return 'לא הוזן';
    default:
      return 'לא ידוע';
  }
}

export function buildInstagramSkipResult(url: string): ScrapeUrlResult {
  const username = extractInstagramUsername(url);
  const hostname = hostFromUrl(url);
  const weak = username
    ? `חשבון אינסטגרם (רמז חלש בלבד): @${username}\nכתובת: ${url}\nהערה: לא ניתן לקרוא תוכן פוסטים מאינסטגרם אוטומטית — רק שם המשתמש כרמז לזהות.`
    : `קישור אינסטגרם: ${url}\nהערה: לא ניתן לקרוא תוכן פוסטים מאינסטגרם אוטומטית. אין שם משתמש שניתן לחלץ מהכתובת.`;

  return {
    url,
    kind: 'instagram',
    hostname,
    status: 'skipped_instagram',
    promptText: weak,
    contentChars: 0,
    signals: username ? [`@${username}`] : [],
    instagramUsername: username,
    statusLabelHe: statusLabelHe('skipped_instagram'),
    detailHe: username
      ? `פוסטי אינסטגרם לא נקראים אוטומטית. נשמר רק שם המשתמש @${username} כרמז חלש.`
      : 'פוסטי אינסטגרם לא נקראים אוטומטית. אפשר להעלות צילום מסך או לתאר את הסגנון ידנית.',
  };
}

export function buildFetchedScrapeResult(
  url: string,
  rawText: string
): ScrapeUrlResult {
  const kind = classifyReferenceLink(url);
  const hostname = hostFromUrl(url);
  const status = classifyScrapedText(rawText);
  const signals = extractContentSignals(rawText);
  const clipped = rawText.substring(0, 3000);

  const promptText =
    status === 'failed'
      ? ''
      : `--- מידע מהקישור: ${url} ---\n${clipped}\n`;

  let detailHe = '';
  if (status === 'success') {
    detailHe = signals.length
      ? `נשלף תוכן מ־${hostname || url}. דוגמאות: ${signals.slice(0, 2).join(' · ')}`
      : `נשלף תוכן משמעותי מ־${hostname || url}.`;
  } else if (status === 'partial') {
    detailHe = `נשלף מעט תוכן מ־${hostname || url} — ייתכן שהאתר חוסם קריאה או דל בטקסט.`;
  } else {
    detailHe = `לא הצלחנו לשלוף תוכן מ־${hostname || url}. בדקו שהכתובת ציבורית ונסו שוב, או תארו את המותג ידנית.`;
  }

  return {
    url,
    kind,
    hostname,
    status,
    promptText,
    contentChars: rawText.replace(/\s+/g, ' ').trim().length,
    signals,
    instagramUsername: null,
    statusLabelHe: statusLabelHe(status),
    detailHe,
  };
}

export function formatScrapeResultsForPrompt(
  results: ScrapeUrlResult[]
): string {
  return results
    .map((r) => r.promptText.trim())
    .filter(Boolean)
    .join('\n\n');
}

export function inferWebsiteStatusFromStored(input: {
  websiteUrl?: string | null;
  brandIdentity?: string | null;
}): {
  status: ScrapeOutcomeStatus;
  statusLabelHe: string;
  detailHe: string;
  signals: string[];
} {
  const url = trimUrl(input.websiteUrl);
  const identity = (input.brandIdentity || '').trim();
  const host = hostFromUrl(url);

  if (!url) {
    return {
      status: 'missing',
      statusLabelHe: statusLabelHe('missing'),
      detailHe: 'לא הוזנה כתובת אתר — אפשר להוסיף בהגדרות.',
      signals: [],
    };
  }

  if (isFailedBrandIdentity(identity)) {
    return {
      status: 'failed',
      statusLabelHe: statusLabelHe('failed'),
      detailHe: `יש כתובת (${host}) אך לא נשמר סיכום מותג מהאתר — ייתכן שהסריקה נכשלה או שדולגה.`,
      signals: [],
    };
  }

  const signals = extractContentSignals(identity, 2);
  const partial = identity.length < 80;

  if (partial) {
    return {
      status: 'partial',
      statusLabelHe: statusLabelHe('partial'),
      detailHe: `יש סיכום קצר לצד האתר ${host} — מומלץ להעשיר את זהות המותג בהגדרות.`,
      signals,
    };
  }

  return {
    status: 'success',
    statusLabelHe: statusLabelHe('success'),
    detailHe: `זוהה תוכן מהאתר ${host} ונשמר סיכום זהות מותג.`,
    signals,
  };
}

export function shouldSkipFetch(url: string): boolean {
  return isInstagramUrl(url);
}
