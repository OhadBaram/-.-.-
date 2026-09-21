import { describe, expect, it } from 'vitest';
import {
  backgroundForSlide,
  colorForSlide,
  primaryBrandColor,
  type BrandPalette,
} from '@/lib/brand-palette';

const palette: BrandPalette = {
  accents: ['#d4af37', '#f5d76e', '#94a3b8'],
  backgrounds: ['#f8fafc', '#0f172a', '#1e293b'],
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
    expect(bg0).toBe('#f8fafc');
    expect(bg3).toBe(bg0);
  });

  it('uses one dark background for all slides in dark mode', () => {
    const bg0 = backgroundForSlide(palette, 0, true);
    const bg2 = backgroundForSlide(palette, 2, true);
    expect(bg0).toBe('#0f172a');
    expect(bg2).toBe(bg0);
  });
});
