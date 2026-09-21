import { z } from 'zod';
import {
  DEFAULT_PUBLISH_TARGET,
  PUBLISH_TARGETS,
} from '@/lib/contracts/publish-target';
import { IMAGE_DATA_URL_MAX_CHARS } from '@/lib/contracts/image-upload';

const narrativeDirectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().optional(),
  whyItWorks: z.string().optional(),
  structureHint: z.string().optional(),
});

/** סגנונות פעילים בממשק — בלי stub */
export const ACTIVE_VISUAL_STYLES = [
  'minimal',
  'bold',
  'luxury',
  'magazine',
  'custom',
] as const;

export type ActiveVisualStyle = (typeof ACTIVE_VISUAL_STYLES)[number];

/**
 * מקבל גם ערך ישן `screenshots` וממפה ל־minimal (תאימות לאחור, בלי UI stub).
 */
const visualStyleSchema = z.preprocess((val) => {
  if (val === 'screenshots') return 'minimal';
  return val;
}, z.enum(ACTIVE_VISUAL_STYLES).optional().default('minimal'));

const coverImageDataUrlSchema = z
  .string()
  .max(IMAGE_DATA_URL_MAX_CHARS)
  .refine((v) => v.startsWith('data:image/'), {
    message: 'coverImageDataUrl must be an image data URL',
  })
  .optional();

export const generateCarouselSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  audience: z.string().optional(),
  goal: z.string().optional(),
  brand: z.string().optional(),
  brandColors: z
    .union([
      z.array(z.string()).min(1).max(8),
      z.object({
        accents: z.array(z.string()).min(1).max(8),
        backgrounds: z.array(z.string()).max(8).optional().default([]),
      }),
    ])
    .optional(),
  slideCount: z.number().int().min(3).max(15).optional().default(7),
  density: z.enum(['light', 'standard', 'rich']).optional().default('standard'),
  visualStyle: visualStyleSchema,
  visualStyleCustom: z.string().optional(),
  useRecommendedStructure: z.boolean().optional().default(true),
  narrativeDirection: narrativeDirectionSchema.optional(),
  publishTarget: z
    .enum(PUBLISH_TARGETS)
    .optional()
    .default(DEFAULT_PUBLISH_TARGET),
  coverImageDataUrl: coverImageDataUrlSchema,
  coverImageApplyTo: z
    .enum(['first', 'first_and_image_slots'])
    .optional()
    .default('first'),
  flowVariant: z.enum(['fast', 'full']).optional().default('full'),
});

export const proposeStylesSchema = z.object({
  topic: z.string().min(1),
  audience: z.string().optional(),
  goal: z.string().optional(),
});

export const wizardChatSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string(),
      })
    )
    .optional()
    .default([]),
  options: z
    .object({
      slideCount: z.number().int().min(3).max(15).optional(),
      density: z.enum(['light', 'standard', 'rich']).optional(),
      visualStyle: visualStyleSchema,
      visualStyleCustom: z.string().optional(),
      useRecommendedStructure: z.boolean().optional(),
      audience: z.string().optional(),
      goal: z.string().optional(),
    })
    .optional(),
});

export const workspaceSettingsSchema = z.object({
  brandIdentity: z.string().optional(),
  brandColor: z.string().optional(),
});

export type GenerateCarouselInput = z.infer<typeof generateCarouselSchema>;
