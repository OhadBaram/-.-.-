import { describe, expect, it } from 'vitest';
import {
  applyPaletteColorsToSlides,
  backgroundForSlide,
  colorForSlide,
  emptyPalette,
  isBoringPalette,
  isNearNeutral,
  primaryBrandColor,
  recommendPaletteLocal,
  resolveGenerationPalette,
  textColorForBackground,
  type BrandPalette,
} from '@/lib/brand-palette';

const palette: BrandPalette = {
  accents: ['#d4af37', '#f5d76e', '#94a3b8'],
  backgrounds: ['#fef3c7', '#0f172a', '#1e293b'],
};

describe('brand palette uniformity', () => {
  it('uses the same accent on every slide', () => {
    expect(colorForSlide(palette, 0)).toBe(primaryBrandColor(palette));
    expect(colorForSlide(palette, 1)).toBe(colorForSlide(palette, 0));
    expect(colorForSlide(palette, 5)).toBe(colorForSlide(palette, 0));
  });

  it('uses one light background for all slides in light mode', () => {
    const bg0 = backgroundForSlide(palette, 0, false);
    const bg3 = backgroundForSlide(palette, 3, false);
    expect(bg0).toBe('#fef3c7');
    expect(bg3).toBe(bg0);
  });

  it('uses one dark background for all slides in dark mode', () => {
    const bg0 = backgroundForSlide(palette, 0, true);
    const bg2 = backgroundForSlide(palette, 2, true);
    // מעדיף כהה עם גוון (#1e293b) על פני סלייט שטוח
    expect(bg0).toBe('#1e293b');
    expect(bg2).toBe(bg0);
  });
});

describe('topic-aware colorful defaults', () => {
  it('prefers tinted light backgrounds over pure white', () => {
    const mixed: BrandPalette = {
      accents: ['#4f46e5'],
      backgrounds: ['#ffffff', '#0f172a', '#eef2ff'],
    };
    expect(backgroundForSlide(mixed, 0, false)).toBe('#eef2ff');
    expect(isNearNeutral('#ffffff')).toBe(true);
    expect(isNearNeutral('#eef2ff')).toBe(false);
  });

  it('emptyPalette is not flat white+black', () => {
    const empty = emptyPalette();
    expect(isBoringPalette(empty)).toBe(false);
    expect(backgroundForSlide(empty, 0, false)).not.toBe('#ffffff');
  });

  it('recommendPaletteLocal picks rose for beauty topics', () => {
    const next = recommendPaletteLocal({
      topic: 'טיפים לטיפוח ויופי',
      visualStyle: 'minimal',
    });
    expect(next.accents[0]).toBe('#e11d48');
    expect(isBoringPalette(next)).toBe(false);
  });

  it('recommendPaletteLocal picks forest for health topics', () => {
    const next = recommendPaletteLocal({
      topic: 'כושר ובריאות למתחילים',
      visualStyle: 'minimal',
    });
    expect(next.accents[0]).toBe('#166534');
  });

  it('recommendPaletteLocal picks indigo for tech topics', () => {
    const next = recommendPaletteLocal({
      topic: 'AI וסטארטאפ SaaS',
      visualStyle: 'minimal',
    });
    expect(next.accents[0]).toBe('#4f46e5');
  });

  it('recommendPaletteLocal varies by topic hash when no keyword match', () => {
    const a = recommendPaletteLocal({ topic: 'נושא אקראי אלפא', visualStyle: 'minimal' });
    const b = recommendPaletteLocal({ topic: 'נושא אקראי בטא', visualStyle: 'minimal' });
    // לפחות אחד מהשדות צריך להשתנות בין נושאים שונים (אקסנט או רקע)
    const same =
      a.accents[0] === b.accents[0] &&
      a.backgrounds[0] === b.backgrounds[0];
    expect(same).toBe(false);
  });

  it('resolveGenerationPalette upgrades boring white/black palettes', () => {
    const boring: BrandPalette = {
      accents: ['#6366f1'],
      backgrounds: ['#ffffff', '#111827'],
    };
    expect(isBoringPalette(boring)).toBe(true);
    const resolved = resolveGenerationPalette({
      brandColors: boring,
      topic: 'שיווק באינסטגרם',
      visualStyle: 'bold',
    });
    expect(isBoringPalette(resolved)).toBe(false);
    expect(backgroundForSlide(resolved, 0, false)).not.toBe('#ffffff');
  });

  it('applyPaletteColorsToSlides overwrites flat AI colors', () => {
    const slides = [
      { backgroundColor: '#ffffff', textColor: '#000000', text: 'א' },
      { backgroundColor: '#ffffff', textColor: '#000000', text: 'ב' },
    ];
    const next = applyPaletteColorsToSlides(slides, palette, false);
    expect(next[0].backgroundColor).toBe('#fef3c7');
    expect(next[0].textColor).toBe(textColorForBackground('#fef3c7'));
    expect(next[1].backgroundColor).toBe(next[0].backgroundColor);
  });

  it('textColorForBackground picks dark text on light tint', () => {
    expect(textColorForBackground('#eef2ff')).toBe('#111827');
    expect(textColorForBackground('#0f172a')).toBe('#f8fafc');
  });
});
