import { describe, expect, it } from 'vitest';
import { buildBrandLearnedFacts } from '@/lib/brand-learned-summary';

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
  });

  it('does not invent a default brand color', () => {
    const facts = buildBrandLearnedFacts({ brandColor: null });
    expect(facts.hasAny).toBe(false);
    expect(facts.accentColors).toEqual([]);
  });

  it('summarizes real stored brand data', () => {
    const facts = buildBrandLearnedFacts({
      websiteUrl: 'https://www.example.com/about',
      referenceLink1: 'https://instagram.com/p/abc',
      referenceLink2: 'https://instagram.com/p/def',
      brandIdentity: 'סטודיו לעיצוב עם טון חם וישיר לבעלי עסקים קטנים',
      brandColor: '#0ea5e9',
    });

    expect(facts.hasAny).toBe(true);
    expect(facts.websiteHost).toBe('example.com');
    expect(facts.referenceCount).toBe(2);
    expect(facts.brandIdentitySnippet).toContain('סטודיו לעיצוב');
    expect(facts.primaryColor).toBe('#0ea5e9');
    expect(facts.accentColors[0]).toBe('#0ea5e9');
    expect(facts.isPartial).toBe(false);
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
      brandIdentity: 'טון מקצועי וחם',
    });
    expect(facts.isPartial).toBe(false);
  });

  it('truncates long brand identity', () => {
    const long = 'א'.repeat(200);
    const facts = buildBrandLearnedFacts({ brandIdentity: long });
    expect(facts.brandIdentitySnippet!.endsWith('…')).toBe(true);
    expect(facts.brandIdentitySnippet!.length).toBeLessThanOrEqual(140);
  });
});
