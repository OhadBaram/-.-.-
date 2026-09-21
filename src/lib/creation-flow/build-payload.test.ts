import { describe, expect, it } from 'vitest';
import {
  buildCreationSubmitPayload,
  defaultNarrativeDirection,
} from '@/lib/creation-flow/build-payload';
import { DEFAULT_WIZARD_OPTIONS } from '@/lib/wizard';

describe('buildCreationSubmitPayload', () => {
  const direction = defaultNarrativeDirection('טיפים לעסק');

  it('builds a fast-path payload with cover image', () => {
    const payload = buildCreationSubmitPayload({
      topic: '  טיפים לעסק  ',
      options: DEFAULT_WIZARD_OPTIONS,
      brandPalette: { accents: ['#112233'], backgrounds: [] },
      narrativeDirection: direction,
      flowVariant: 'fast',
      publishTarget: 'linkedin',
      coverImageDataUrl: 'data:image/png;base64,abc',
    });

    expect(payload.topic).toBe('טיפים לעסק');
    expect(payload.flowVariant).toBe('fast');
    expect(payload.publishTarget).toBe('linkedin');
    expect(payload.coverImageDataUrl).toBe('data:image/png;base64,abc');
    expect(payload.coverImageApplyTo).toBe('first');
    expect(payload.narrativeDirection.id).toBe(direction.id);
  });

  it('omits empty cover image', () => {
    const payload = buildCreationSubmitPayload({
      topic: 'נושא',
      options: DEFAULT_WIZARD_OPTIONS,
      brandPalette: { accents: ['#112233'], backgrounds: [] },
      narrativeDirection: direction,
      flowVariant: 'full',
      coverImageDataUrl: '   ',
    });
    expect(payload.coverImageDataUrl).toBeUndefined();
    expect(payload.publishTarget).toBe('instagram');
  });

  it('throws when topic is missing', () => {
    expect(() =>
      buildCreationSubmitPayload({
        topic: '   ',
        options: DEFAULT_WIZARD_OPTIONS,
        brandPalette: { accents: ['#112233'], backgrounds: [] },
        narrativeDirection: direction,
        flowVariant: 'fast',
      })
    ).toThrow('TOPIC_REQUIRED');
  });

  it('throws when direction is incomplete', () => {
    expect(() =>
      buildCreationSubmitPayload({
        topic: 'נושא',
        options: DEFAULT_WIZARD_OPTIONS,
        brandPalette: { accents: ['#112233'], backgrounds: [] },
        narrativeDirection: { ...direction, title: '' },
        flowVariant: 'fast',
      })
    ).toThrow('DIRECTION_REQUIRED');
  });
});

describe('defaultNarrativeDirection', () => {
  it('returns a usable direction for any topic', () => {
    const d = defaultNarrativeDirection('בדיקה');
    expect(d.id).toBeTruthy();
    expect(d.title).toBeTruthy();
    expect(d.structureHint).toBeTruthy();
  });
});
