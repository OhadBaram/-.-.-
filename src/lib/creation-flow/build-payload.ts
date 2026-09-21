import {
  VISUAL_STYLE_OPTIONS,
  buildFallbackNarrativeDirections,
  type NarrativeDirection,
  type WizardOptions,
} from '@/lib/wizard';
import type { BrandPalette } from '@/lib/brand-palette';
import { clampPalette } from '@/lib/brand-palette';
import {
  DEFAULT_PUBLISH_TARGET,
  parsePublishTarget,
  type PublishTarget,
} from '@/lib/contracts/publish-target';
import type { CoverImageApplyTo } from '@/lib/contracts/cover-image';

export interface CreationSubmitInput {
  topic: string;
  options: WizardOptions;
  brandPalette: BrandPalette;
  narrativeDirection: NarrativeDirection;
  flowVariant: 'fast' | 'full';
  publishTarget?: PublishTarget | string;
  coverImageDataUrl?: string | null;
  coverImageApplyTo?: CoverImageApplyTo;
  websiteUrl?: string;
  referenceLink1?: string;
  referenceLink2?: string;
  referenceLink3?: string;
}

export interface CreationSubmitPayload {
  topic: string;
  audience: string;
  goal: string;
  brand: string;
  brandColors: BrandPalette;
  slideCount: number;
  density: WizardOptions['density'];
  visualStyle: WizardOptions['visualStyle'];
  visualStyleCustom: string;
  useRecommendedStructure: boolean;
  narrativeDirection: NarrativeDirection;
  websiteUrl?: string;
  referenceLink1?: string;
  referenceLink2?: string;
  referenceLink3?: string;
  flowVariant: 'fast' | 'full';
  publishTarget: PublishTarget;
  coverImageDataUrl?: string;
  coverImageApplyTo: CoverImageApplyTo;
}

/** בונה כיוון נרטיב ברירת מחדל למסלול המהיר (בלי בחירת UI) */
export function defaultNarrativeDirection(topic: string): NarrativeDirection {
  return buildFallbackNarrativeDirections(topic)[0];
}

/**
 * בונה payload אחיד ליצירה — משותף למסלול מהיר ומלא.
 * זורק אם חסר נושא או כיוון.
 */
export function buildCreationSubmitPayload(
  input: CreationSubmitInput
): CreationSubmitPayload {
  const topic = input.topic.trim();
  if (!topic) {
    throw new Error('TOPIC_REQUIRED');
  }
  if (!input.narrativeDirection?.id || !input.narrativeDirection?.title) {
    throw new Error('DIRECTION_REQUIRED');
  }

  const styleMeta = VISUAL_STYLE_OPTIONS.find(
    (s) => s.id === input.options.visualStyle
  );
  const brandParts = [
    styleMeta?.promptHint || styleMeta?.label || '',
    input.options.visualStyle === 'custom'
      ? input.options.visualStyleCustom
      : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const cover = input.coverImageDataUrl?.trim();
  const payload: CreationSubmitPayload = {
    topic,
    audience: input.options.audience,
    goal: input.options.goal,
    brand: brandParts,
    brandColors: clampPalette(input.brandPalette),
    slideCount: input.options.slideCount,
    density: input.options.density,
    visualStyle: input.options.visualStyle,
    visualStyleCustom: input.options.visualStyleCustom,
    useRecommendedStructure: input.options.useRecommendedStructure,
    narrativeDirection: input.narrativeDirection,
    flowVariant: input.flowVariant,
    publishTarget: parsePublishTarget(
      input.publishTarget ?? DEFAULT_PUBLISH_TARGET
    ),
    coverImageApplyTo: input.coverImageApplyTo ?? 'first',
  };

  if (cover) {
    payload.coverImageDataUrl = cover;
  }
  if (input.websiteUrl) payload.websiteUrl = input.websiteUrl;
  if (input.referenceLink1) payload.referenceLink1 = input.referenceLink1;
  if (input.referenceLink2) payload.referenceLink2 = input.referenceLink2;
  if (input.referenceLink3) payload.referenceLink3 = input.referenceLink3;

  return payload;
}
