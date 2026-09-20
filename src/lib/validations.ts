import { z } from 'zod';

const narrativeDirectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().optional(),
  whyItWorks: z.string().optional(),
  structureHint: z.string().optional(),
});

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
  visualStyle: z
    .enum(['minimal', 'bold', 'luxury', 'magazine', 'custom', 'screenshots'])
    .optional()
    .default('minimal'),
  visualStyleCustom: z.string().optional(),
  useRecommendedStructure: z.boolean().optional().default(true),
  narrativeDirection: narrativeDirectionSchema.optional(),
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
