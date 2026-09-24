import { describe, expect, it } from 'vitest';
import {
  classifyTier1Intent,
  detectClarificationChoice,
  isBroadAmbiguousTopic,
} from './tier1-classifier';

describe('Tier 1 Deterministic Classifier', () => {
  it('detects broad ambiguous single words', () => {
    expect(isBroadAmbiguousTopic('כושר')).toBe(true);
    expect(isBroadAmbiguousTopic('שיווק')).toBe(true);
    expect(isBroadAmbiguousTopic('נדל״ן')).toBe(true);
    expect(isBroadAmbiguousTopic('מוטיבציה')).toBe(true);
    expect(isBroadAmbiguousTopic('הצלחה')).toBe(true);
  });

  it('does NOT treat actionable or detailed topics as ambiguous', () => {
    expect(isBroadAmbiguousTopic('5 טיפים לכושר גופני בבית')).toBe(false);
    expect(isBroadAmbiguousTopic('איך לפתוח עסק של שיווק')).toBe(false);
    expect(isBroadAmbiguousTopic('מדריך השקעות נדלן לרוכשים')).toBe(false);
    expect(isBroadAmbiguousTopic('3 טעויות של מתאמנים מתחילים')).toBe(false);
  });

  it('routes ambiguous input immediately to clarify in 0ms without AI', () => {
    const res = classifyTier1Intent({
      message: 'כושר',
      history: [],
    });

    expect(res.handled).toBe(true);
    if (res.handled) {
      expect(res.phase).toBe('clarify');
      expect(res.readyForDirections).toBe(false);
      expect(res.offline).toBe(true);
      expect(res.reply).toContain('כושר');
      expect(res.reply).toContain('1.');
      expect(res.reply).toContain('2.');
      expect(res.reply).toContain('3.');
    }
  });

  it('handles "מומלץ" fast path to ready_for_directions immediately', () => {
    const res = classifyTier1Intent({
      message: 'מומלץ',
      existingTopicGuess: 'טיפים לבישול',
    });

    expect(res.handled).toBe(true);
    if (res.handled) {
      expect(res.phase).toBe('ready_for_directions');
      expect(res.readyForDirections).toBe(true);
      expect(res.applyRecommendedAll).toBe(true);
      expect(res.offline).toBe(true);
    }
  });

  it('detects clarification choice from previous assistant message', () => {
    const lastAssistant = `באיזה כיוון תרצה שנתמקד?
1. 3 הטעויות הנפוצות ביותר בכושר ואיך להימנע מהן
2. 5 טיפים מעשיים של מומחים ליישום מיידי כבר היום
3. מיתוסים נפוצים מול המציאות`;

    const choice = detectClarificationChoice('1', lastAssistant);
    expect(choice).not.toBeNull();
    expect(choice?.choiceNumber).toBe(1);
    expect(choice?.derivedTopic).toContain('3 הטעויות הנפוצות ביותר בכושר');

    const res = classifyTier1Intent({
      message: '1',
      history: [{ role: 'assistant', text: lastAssistant }],
    });

    expect(res.handled).toBe(true);
    if (res.handled) {
      expect(res.phase).toBe('intake');
      expect(res.topic).toContain('3 הטעויות הנפוצות ביותר בכושר');
      expect(res.readyForDirections).toBe(false);
      expect(res.offline).toBe(true);
    }
  });

  it('routes bare channel URL with scraped video signals to clarify', () => {
    const res = classifyTier1Intent({
      message: 'https://youtube.com/@mkbhd',
      scrapedResults: [
        {
          url: 'https://youtube.com/@mkbhd',
          kind: 'youtube',
          hostname: 'youtube.com',
          status: 'success',
          signals: ['Marques Brownlee', 'iPhone 18 Pro Review', 'Apple Watch Secrets'],
          promptText: '',
          contentChars: 100,
          instagramUsername: null,
          statusLabelHe: '',
          detailHe: '',
        },
      ],
    });

    expect(res.handled).toBe(true);
    if (res.handled) {
      expect(res.phase).toBe('clarify');
      expect(res.reply).toContain('Marques Brownlee');
      expect(res.reply).toContain('iPhone 18 Pro Review');
    }
  });

  it('passes complex unhandled inputs to next tier (handled: false)', () => {
    const res = classifyTier1Intent({
      message: 'אני רוצה קרוסלה שתספר את הסיפור האישי שלי איך יצאתי מעבדות לחירות בקריירה',
      history: [],
    });

    expect(res.handled).toBe(false);
  });
});
