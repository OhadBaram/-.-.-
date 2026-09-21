import { describe, expect, it } from 'vitest';
import { applyCoverImageToSlides } from '@/lib/contracts/cover-image';

describe('cover-image', () => {
  const slides: {
    id: string;
    text: string;
    template: string;
    imageUrl?: string;
  }[] = [
    { id: '1', text: 'a', template: 'minimal' },
    { id: '2', text: 'b', template: 'image-split' },
    { id: '3', text: 'c', template: 'bold' },
  ];

  it('returns slides unchanged without cover', () => {
    expect(applyCoverImageToSlides(slides, null)).toEqual(slides);
    expect(applyCoverImageToSlides(slides, undefined)).toEqual(slides);
  });

  it('applies cover to first slide only by default', () => {
    const next = applyCoverImageToSlides(slides, 'data:image/png;base64,x');
    expect(next[0].imageUrl).toBe('data:image/png;base64,x');
    expect(next[1].imageUrl).toBeUndefined();
    expect(next[2].imageUrl).toBeUndefined();
  });

  it('applies cover to first and image slots', () => {
    const next = applyCoverImageToSlides(
      slides,
      'data:image/png;base64,x',
      'first_and_image_slots'
    );
    expect(next[0].imageUrl).toBe('data:image/png;base64,x');
    expect(next[1].imageUrl).toBe('data:image/png;base64,x');
    expect(next[2].imageUrl).toBeUndefined();
  });
});
