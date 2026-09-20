import { z } from 'zod';

export const generateCarouselSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  audience: z.string().optional(),
  goal: z.string().optional(),
  brand: z.string().optional(),
  slideCount: z.number().int().min(3).max(10).optional().default(8),
});

export const workspaceSettingsSchema = z.object({
  brandIdentity: z.string().optional(),
  brandColor: z.string().optional(),
});
