/**
 * שיוך תמונת כיסוי לשקפים אחרי יצירה — לוגיקה טהורה לבדיקה ולשימוש בלקוח.
 */

export type CoverImageApplyTo = 'first' | 'first_and_image_slots';

export interface SlideLike {
  id?: string;
  text?: string;
  imageUrl?: string;
  template?: string;
}

const IMAGE_TEMPLATE_PREFIX = 'image-';

function isImageTemplate(template: unknown): boolean {
  return typeof template === 'string' && template.startsWith(IMAGE_TEMPLATE_PREFIX);
}

/**
 * מדביק data URL של תמונה על שקפים לפי מדיניות.
 * לא משנה תבניות — רק `imageUrl` (העורך/ציור כבר מטפלים בתצוגה).
 */
export function applyCoverImageToSlides<T extends SlideLike>(
  slides: T[],
  coverImageDataUrl: string | null | undefined,
  applyTo: CoverImageApplyTo = 'first'
): T[] {
  if (!coverImageDataUrl || slides.length === 0) {
    return slides;
  }

  return slides.map((slide, index) => {
    if (applyTo === 'first') {
      return index === 0 ? { ...slide, imageUrl: coverImageDataUrl } : slide;
    }

    const shouldApply =
      index === 0 || isImageTemplate(slide.template) || Boolean(slide.imageUrl);
    return shouldApply ? { ...slide, imageUrl: coverImageDataUrl } : slide;
  });
}
