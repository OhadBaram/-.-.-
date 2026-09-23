import { describe, expect, it } from 'vitest';
import {
  formatPastCarouselsForPrompt,
  pickPastCarouselsForStyle,
  summarizePastCarousels,
} from '@/lib/past-carousels';

describe('past-carousels', () => {
  const sample = [
    {
      topic: 'טיפים לשבוע',
      slidesData: [{ text: 'פתיחה חמה' }, { text: 'טיפ אחד' }],
    },
    { topic: 'ריק', slidesData: null },
    {
      topic: 'לפני ואחרי',
      slidesData: { slides: [{ text: 'לפני' }, { text: 'אחרי' }] },
    },
  ];

  it('picks only carousels with slide text, up to limit', () => {
    const picks = pickPastCarouselsForStyle(sample, 3);
    expect(picks).toHaveLength(2);
    expect(picks[0].topic).toBe('טיפים לשבוע');
    expect(picks[0].slidesText).toContain('פתיחה חמה');
    expect(picks[1].slidesText).toContain('לפני');
  });

  it('formats prompt with style-only instruction', () => {
    const picks = pickPastCarouselsForStyle(sample, 2);
    const prompt = formatPastCarouselsForPrompt(picks);
    expect(prompt).toContain('Past Carousel 1');
    expect(prompt).toContain('למד מהסגנון והטון בלבד');
  });

  it('summarizes for UI in Hebrew', () => {
    const summary = summarizePastCarousels(sample, 3);
    expect(summary.totalCount).toBe(3);
    expect(summary.withSlidesCount).toBe(2);
    expect(summary.usedForStyleCount).toBe(2);
    expect(summary.summaryLineHe).toContain('2 קרוסלות קודמות נלקחו בחשבון לסגנון');
    expect(summary.topics).toEqual(['טיפים לשבוע', 'לפני ואחרי']);
  });

  it('handles empty history', () => {
    const summary = summarizePastCarousels([]);
    expect(summary.usedForStyleCount).toBe(0);
    expect(summary.summaryLineHe).toContain('אין עדיין');
    expect(formatPastCarouselsForPrompt([])).toBe('');
  });
});
