import { describe, expect, it } from 'vitest';
import {
  buildFetchedScrapeResult,
  buildInstagramSkipResult,
  classifyScrapedText,
  extractContentSignals,
  formatScrapeResultsForPrompt,
  inferWebsiteStatusFromStored,
  isFailedBrandIdentity,
} from '@/lib/scrape-result';

describe('scrape-result', () => {
  it('classifies scraped text length bands', () => {
    expect(classifyScrapedText('קצר')).toBe('failed');
    expect(classifyScrapedText('א'.repeat(100))).toBe('partial');
    expect(classifyScrapedText('ב'.repeat(400))).toBe('success');
  });

  it('extracts short signals from markdown-ish text', () => {
    const signals = extractContentSignals(
      '# כותרת ראשית של העסק\n\nפסקה ראשונה עם מספיק תוכן כדי להיחשב אות.\n\nעוד שורה משמעותית כאן.'
    );
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0]).toContain('כותרת');
  });

  it('builds honest Instagram skip result with username', () => {
    const r = buildInstagramSkipResult('https://instagram.com/mybrand/');
    expect(r.status).toBe('skipped_instagram');
    expect(r.instagramUsername).toBe('mybrand');
    expect(r.promptText).toContain('@mybrand');
    expect(r.detailHe).toContain('לא נקראים אוטומטית');
  });

  it('builds failed fetch result for empty content', () => {
    const r = buildFetchedScrapeResult('https://brand.co', '');
    expect(r.status).toBe('failed');
    expect(r.promptText).toBe('');
  });

  it('formats prompt only from non-empty promptText', () => {
    const ig = buildInstagramSkipResult('https://instagram.com/x');
    const fail = buildFetchedScrapeResult('https://a.com', '');
    const ok = buildFetchedScrapeResult(
      'https://b.com',
      'תוכן '.repeat(100)
    );
    const text = formatScrapeResultsForPrompt([ig, fail, ok]);
    expect(text).toContain('@x');
    expect(text).toContain('https://b.com');
    expect(text).not.toContain('https://a.com');
  });

  it('infers website status from stored identity', () => {
    expect(
      inferWebsiteStatusFromStored({ websiteUrl: null }).status
    ).toBe('missing');
    expect(
      inferWebsiteStatusFromStored({
        websiteUrl: 'https://brand.co',
        brandIdentity: 'לא הצלחנו למשוך מידע מהקישורים שהוזנו.',
      }).status
    ).toBe('failed');
    expect(
      inferWebsiteStatusFromStored({
        websiteUrl: 'https://brand.co',
        brandIdentity:
          'סטודיו לעיצוב דיגיטלי לבעלי עסקים קטנים עם טון חם ומקצועי וערך מעשי בכל פוסט שיווקי שאנחנו מפרסמים.',
      }).status
    ).toBe('success');
  });

  it('detects failed brand identity markers', () => {
    expect(isFailedBrandIdentity('')).toBe(true);
    expect(isFailedBrandIdentity('לא הצלחנו למשוך מידע מהקישורים')).toBe(true);
    expect(isFailedBrandIdentity('עסק רציני עם טון חם')).toBe(false);
  });
});
