import { describe, expect, it } from 'vitest';
import { generateCarouselSchema } from '@/lib/validations';

describe('generateCarouselSchema', () => {
  it('accepts a minimal legacy payload', () => {
    const parsed = generateCarouselSchema.safeParse({ topic: 'טיפים' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.publishTarget).toBe('instagram');
      expect(parsed.data.flowVariant).toBe('full');
      expect(parsed.data.visualStyle).toBe('minimal');
    }
  });

  it('maps deprecated screenshots style to minimal', () => {
    const parsed = generateCarouselSchema.safeParse({
      topic: 'x',
      visualStyle: 'screenshots',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.visualStyle).toBe('minimal');
    }
  });

  it('accepts publishTarget and cover image fields', () => {
    const parsed = generateCarouselSchema.safeParse({
      topic: 'x',
      publishTarget: 'linkedin',
      coverImageDataUrl: 'data:image/png;base64,abc',
      coverImageApplyTo: 'first',
      flowVariant: 'fast',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.publishTarget).toBe('linkedin');
      expect(parsed.data.flowVariant).toBe('fast');
    }
  });

  it('rejects non-image data urls for cover', () => {
    const parsed = generateCarouselSchema.safeParse({
      topic: 'x',
      coverImageDataUrl: 'https://example.com/a.png',
    });
    expect(parsed.success).toBe(false);
  });
});
