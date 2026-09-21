/**
 * מקור אמת יחיד ליעד פרסום: מימדי קנבס, סדר ייצוא ותוויות CTA.
 * בשלב הנוכחי המימדים זהים במכוון (DEBT-001) — השינוי חייב לעבור דרך הקובץ הזה בלבד.
 */

export const PUBLISH_TARGETS = ['instagram', 'linkedin'] as const;

export type PublishTarget = (typeof PUBLISH_TARGETS)[number];

export const DEFAULT_PUBLISH_TARGET: PublishTarget = 'instagram';

export interface PublishTargetProfile {
  id: PublishTarget;
  /** תווית קצרה לבחירה בממשק */
  labelHe: string;
  /** תיאור משנה לבחירה */
  hintHe: string;
  canvasWidth: number;
  canvasHeight: number;
  primaryExport: 'zip' | 'pdf';
  secondaryExport: 'zip' | 'pdf';
  primaryCtaHe: string;
  secondaryCtaHe: string;
}

const PROFILES: Record<PublishTarget, PublishTargetProfile> = {
  instagram: {
    id: 'instagram',
    labelHe: 'אינסטגרם',
    hintHe: 'שקפים כתמונות',
    canvasWidth: 1080,
    canvasHeight: 1350,
    primaryExport: 'zip',
    secondaryExport: 'pdf',
    primaryCtaHe: 'הורידו שקפים לאינסטגרם',
    secondaryCtaHe: 'הורידו PDF ללינקדאין',
  },
  linkedin: {
    id: 'linkedin',
    labelHe: 'לינקדאין',
    hintHe: 'מסמך PDF מקצועי',
    canvasWidth: 1080,
    canvasHeight: 1350,
    primaryExport: 'pdf',
    secondaryExport: 'zip',
    primaryCtaHe: 'הורידו PDF ללינקדאין',
    secondaryCtaHe: 'הורידו שקפים (ZIP)',
  },
};

/** האם הערך הוא יעד פרסום תקין */
export function isPublishTarget(value: unknown): value is PublishTarget {
  return (
    typeof value === 'string' &&
    (PUBLISH_TARGETS as readonly string[]).includes(value)
  );
}

/** מנרמל קלט חיצוני ליעד פרסום עם ברירת מחדל בטוחה */
export function parsePublishTarget(value: unknown): PublishTarget {
  return isPublishTarget(value) ? value : DEFAULT_PUBLISH_TARGET;
}

/** מחזיר פרופיל מלא ליעד (מימדים + תוויות ייצוא) */
export function getPublishTargetProfile(
  target: PublishTarget = DEFAULT_PUBLISH_TARGET
): PublishTargetProfile {
  return PROFILES[target];
}
