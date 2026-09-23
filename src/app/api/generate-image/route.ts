import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSession } from '@/lib/api/require-session';
import { generateText } from '@/lib/services/ai.service';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    const session = auth.session;
    const body = await req.json().catch(() => ({}));
    const rawPrompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const slideText = typeof body.slideText === 'string' ? body.slideText.trim() : '';
    const carouselId = typeof body.carouselId === 'string' ? body.carouselId.trim() : undefined;

    const inputTopic = rawPrompt || slideText;
    if (!inputTopic) {
      return NextResponse.json(
        { error: 'נא להזין תיאור לתמונה או לבחור שקף עם תוכן.' },
        { status: 400 }
      );
    }

    // Lookup user & workspace
    const user = await prisma.user.findUnique({
      where: { email: auth.user.email },
      include: { workspaces: { include: { workspace: true } } },
    });

    if (!user || user.workspaces.length === 0) {
      return NextResponse.json(
        { error: 'לא נמצא מרחב עבודה פעיל למשתמש.' },
        { status: 404 }
      );
    }

    const ws = user.workspaces[0].workspace;

    // Check entitlement: highest tier (premium / unlimited) OR admin toggle OR user.isAdmin
    const isEntitled =
      user.isAdmin ||
      ws.plan === 'premium' ||
      ws.plan === 'unlimited' ||
      ws.aiImageGenEnabled === true;

    if (!isEntitled) {
      return NextResponse.json(
        {
          error:
            'יצירת תמונות AI זמינה בחבילת הפרימיום / ללא הגבלה בלבד, או באישור מנהל.',
          code: 'TIER_REQUIRED',
        },
        { status: 403 }
      );
    }

    // Enforce 8 images limit per carousel
    let currentCount = 0;
    if (carouselId) {
      const carousel = await prisma.carousel.findUnique({
        where: { id: carouselId },
        select: { aiImageCount: true, workspaceId: true },
      });

      if (carousel) {
        if (carousel.workspaceId !== ws.id && !user.isAdmin) {
          return NextResponse.json({ error: 'אין הרשאה לקרוסלה זו.' }, { status: 403 });
        }
        currentCount = carousel.aiImageCount || 0;
        if (currentCount >= 8) {
          return NextResponse.json(
            {
              error: 'הגעת למגבלת 8 תמונות AI עבור קרוסלה זו.',
              code: 'MAX_IMAGES_REACHED',
            },
            { status: 429 }
          );
        }
      }
    }

    // Translate and optimize Hebrew description into photorealistic English prompt
    let enhancedPrompt = inputTopic;
    try {
      const promptOptimizer = `
You are an expert photography and visual art director.
Convert this concept into a single, detailed, photorealistic prompt in English for a vertical 4:5 Instagram photo.
Subject/Idea: ${inputTopic}
${slideText && slideText !== inputTopic ? `Context from slide: ${slideText}` : ''}

Rules:
1. Describe subject, natural cinematic lighting, rich textures, depth of field, color grading.
2. NO text, NO typography, NO logos, NO watermarks, NO collage.
3. Realistic, 8k resolution, award-winning commercial photography style.
4. Output ONLY the English prompt in one or two clear sentences. No explanations.
`;
      const generated = await generateText({
        prompt: promptOptimizer,
        model: 'gemini-2.5-flash',
      });
      if (generated && generated.length > 10) {
        enhancedPrompt = generated.replace(/["\n\r]/g, ' ').trim();
      }
    } catch (optErr) {
      console.warn('Prompt optimizer fallback to raw input:', optErr);
    }

    // Generate image via Pollinations FLUX endpoint
    const cleanPrompt = enhancedPrompt.slice(0, 450);
    const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1080&height=1350&nologo=true&model=flux`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28000);

    const imgRes = await fetch(fluxUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!imgRes.ok) {
      throw new Error(`שרת יצירת התמונות החזיר שגיאה (${imgRes.status})`);
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`;

    // Increment carousel counter if carouselId is provided
    let newCount = currentCount + 1;
    if (carouselId) {
      try {
        const updated = await prisma.carousel.update({
          where: { id: carouselId },
          data: { aiImageCount: { increment: 1 } },
          select: { aiImageCount: true },
        });
        newCount = updated.aiImageCount;
      } catch (dbErr) {
        console.warn('Failed to increment aiImageCount on carousel:', dbErr);
      }
    }

    return NextResponse.json({
      ok: true,
      imageUrl: dataUrl,
      prompt: cleanPrompt,
      remaining: Math.max(0, 8 - newCount),
      usedCount: newCount,
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: error?.message || 'שגיאה ביצירת תמונת AI. נסה שוב בעוד רגע.' },
      { status: 500 }
    );
  }
}
