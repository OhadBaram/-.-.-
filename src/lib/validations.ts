import { z } from 'zod';

export const generateCarouselSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  audience: z.string().optional(),
  goal: z.string().optional(),
  brand: z.string().optional(),
  slideCount: z.number().int().min(3).max(15).optional().default(7),
  density: z.enum(['light', 'standard', 'rich']).optional().default('standard'),
  visualStyle: z
    .enum(['minimal', 'bold', 'luxury', 'magazine', 'custom', 'screenshots'])
    .optional()
    .default('minimal'),
  visualStyleCustom: z.string().optional(),
  useRecommendedStructure: z.boolean().optional().default(true),
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
      visualStyle: z
        .enum(['minimal', 'bold', 'luxury', 'magazine', 'custom', 'screenshots'])
        .optional(),
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
