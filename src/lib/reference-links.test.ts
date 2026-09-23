import { describe, expect, it } from 'vitest';
import {
  classifyReferenceLink,
  extractInstagramUsername,
  hostFromUrl,
  isInstagramUrl,
} from '@/lib/reference-links';

describe('reference-links', () => {
  it('detects Instagram hosts', () => {
    expect(isInstagramUrl('https://www.instagram.com/p/abc')).toBe(true);
    expect(isInstagramUrl('https://instagr.am/p/abc')).toBe(true);
    expect(isInstagramUrl('https://example.com/p/abc')).toBe(false);
  });

  it('extracts username from profile and stories URLs', () => {
    expect(
      extractInstagramUsername('https://instagram.com/acme_studio/')
    ).toBe('acme_studio');
    expect(
      extractInstagramUsername('https://www.instagram.com/stories/acme/123')
    ).toBe('acme');
  });

  it('does not invent username from post-only URLs', () => {
    expect(extractInstagramUsername('https://instagram.com/p/AbCdEf')).toBeNull();
    expect(
      extractInstagramUsername('https://instagram.com/reel/AbCdEf')
    ).toBeNull();
  });

  it('classifies link kinds', () => {
    expect(classifyReferenceLink('https://instagram.com/x')).toBe('instagram');
    expect(classifyReferenceLink('https://brand.co/about')).toBe('website');
  });

  it('normalizes hostname', () => {
    expect(hostFromUrl('https://www.example.com/path')).toBe('example.com');
  });
});
