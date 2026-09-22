import { describe, expect, it } from 'vitest';
import { ensureHttps } from './normalize-url';

describe('ensureHttps', () => {
  it('returns empty string for blank input', () => {
    expect(ensureHttps('')).toBe('');
    expect(ensureHttps('   ')).toBe('');
  });

  it('prepends https for bare domains', () => {
    expect(ensureHttps('www.atoofa.co.il')).toBe('https://www.atoofa.co.il');
    expect(ensureHttps('atoofa.co.il')).toBe('https://atoofa.co.il');
  });

  it('keeps existing http and https protocols', () => {
    expect(ensureHttps('https://www.atoofa.co.il')).toBe(
      'https://www.atoofa.co.il'
    );
    expect(ensureHttps('http://example.com/path')).toBe(
      'http://example.com/path'
    );
  });

  it('trims whitespace before normalizing', () => {
    expect(ensureHttps('  www.atoofa.co.il  ')).toBe(
      'https://www.atoofa.co.il'
    );
  });
});
