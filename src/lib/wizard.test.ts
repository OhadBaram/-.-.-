import { describe, expect, it } from 'vitest';
import {
  buildFallbackNarrativeDirections,
  buildTopicFidelityConstraint,
} from '@/lib/wizard';

describe('buildTopicFidelityConstraint', () => {
  it('anchors content to the exact user topic and forbids parent-category drift', () => {
    const topic = 'קורס מדריכות הנקה';
    const block = buildTopicFidelityConstraint(topic);

    expect(block).toContain(topic);
    expect(block).toContain('דיוק לנושא');
    expect(block).toContain('קטגוריה ההורה');
    expect(block).toContain('הנקה באופן כללי');
    expect(block).toContain('דיוק הנושא מנצח');
  });

  it('falls back when topic is blank', () => {
    const block = buildTopicFidelityConstraint('   ');
    expect(block).toContain('הנושא שסופק');
  });
});

describe('buildFallbackNarrativeDirections', () => {
  it('keeps structure hints pinned to the exact topic', () => {
    const topic = 'קורס מדריכות הנקה';
    const directions = buildFallbackNarrativeDirections(topic);

    expect(directions).toHaveLength(2);
    for (const direction of directions) {
      expect(direction.summary).toContain(topic);
      expect(direction.structureHint).toContain(topic);
      expect(direction.structureHint).toContain('בלי הרחבה לקטגוריה כללית יותר');
    }
  });
});
