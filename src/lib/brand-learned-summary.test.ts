import { describe, expect, it } from 'vitest';
import { buildBrandLearnedFacts } from '@/lib/brand-learned-summary';
import { buildInstagramSkipResult } from '@/lib/scrape-result';

describe('buildBrandLearnedFacts', () => {
  it('returns empty when nothing was stored', () => {
    const facts = buildBrandLearnedFacts({});
    expect(facts.hasAny).toBe(false);
    expect(facts.isPartial).toBe(false);
    expect(facts.websiteHost).toBeNull();
    expect(facts.referenceCount).toBe(0);
    expect(facts.brandIdentitySnippet).toBeNull();
    expect(facts.accentColors).toEqual([]);
    expect(facts.primaryColor).toBeNull();
    expect(facts.website.status).toBe('missing');
    expect(facts.pastCarousels.usedForStyleCount).toBe(0);
  });

  it('does not invent a default brand color', () => {
    const facts = buildBrandLearnedFacts({ brandColor: null });
    expect(facts.hasAny).toBe(false);
    expect(facts.accentColors).toEqual([]);
  });

  it('summarizes real stored brand data with honest Instagram refs', () => {
    const facts = buildBrandLearnedFacts({
      websiteUrl: 'https://www.example.com/about',
      referenceLink1: 'https://instagram.com/p/abc',
      referenceLink2: 'https://instagram.com/acme_co/',
      brandIdentity: 'סטודיו לעיצוב עם טון חם וישיר לבעלי עסקים קטנים שמחפשים נוכחות דיגיטלית מקצועית וברורה',
      brandColor: '#0ea5e9',
    });

    expect(facts.hasAny).toBe(true);
    expect(facts.websiteHost).toBe('example.com');
    expect(facts.website.status).toBe('success');
    expect(facts.website.statusLabelHe).toBe('זוהה תוכן');
    expect(facts.referenceCount).toBe(2);
    expect(facts.references.every((r) => r.kind === 'instagram')).toBe(true);
    expect(facts.references.every((r) => !r.canFetchContent)).toBe(true);
    expect(facts.references[1].username).toBe('acme_co');
    expect(facts.brandIdentitySnippet).toContain('סטודיו לעיצוב');
    expect(facts.primaryColor).toBe('#0ea5e9');
    expect(facts.isPartial).toBe(true);
  });

  it('marks website failed when identity is the scrape-fail message', () => {
    const facts = buildBrandLearnedFacts({
      websiteUrl: 'https://brand.co',
      brandIdentity: 'לא הצלחנו למשוך מידע מהקישורים שהוזנו.',
    });
    expect(facts.website.status).toBe('failed');
    expect(facts.website.statusLabelHe).toBe('נכשל');
  });

  it('uses live scrape report when provided', () => {
    const report = [
      buildInstagramSkipResult('https://instagram.com/hello/'),
    ];
    const facts = buildBrandLearnedFacts({
      referenceLink1: 'https://instagram.com/hello/',
      scrapeReport: report,
    });
    expect(facts.references[0].status).toBe('skipped_instagram');
    expect(facts.references[0].username).toBe('hello');
  });

  it('surfaces past carousel style learning', () => {
    const facts = buildBrandLearnedFacts({
      pastCarousels: [
        {
          topic: '5 טיפים',
          slidesData: [{ text: 'א' }, { text: 'ב' }],
        },
        {
          topic: 'לפני אחרי',
          slidesData: [{ text: 'ג' }],
        },
      ],
    });
    expect(facts.hasAny).toBe(true);
    expect(facts.pastCarousels.usedForStyleCount).toBe(2);
    expect(facts.pastCarousels.summaryLineHe).toContain(
      '2 קרוסלות קודמות נלקחו בחשבון לסגנון'
    );
    expect(facts.showLearningPanel).toBe(true);
  });

  it('marks partial when identity or site is missing', () => {
    const facts = buildBrandLearnedFacts({
      websiteUrl: 'https://brand.co',
      brandColor: '#111827',
    });
    expect(facts.hasAny).toBe(true);
    expect(facts.isPartial).toBe(true);
    expect(facts.brandIdentitySnippet).toBeNull();
  });

  it('is not partial when site and identity exist without refs', () => {
    const facts = buildBrandLearnedFacts({
      websiteUrl: 'https://brand.co',
      brandIdentity: 'טון מקצועי וחם לבעלי עסקים עם מסרים ברורים ומעשיים בכל פוסט שיווקי שאנחנו מפרסמים לקהל שלנו',
    });
    expect(facts.isPartial).toBe(false);
    expect(facts.website.status).toBe('success');
  });

  it('truncates long brand identity', () => {
    const long = 'א'.repeat(200);
    const facts = buildBrandLearnedFacts({ brandIdentity: long });
    expect(facts.brandIdentitySnippet!.endsWith('…')).toBe(true);
    expect(facts.brandIdentitySnippet!.length).toBeLessThanOrEqual(140);
  });
});
