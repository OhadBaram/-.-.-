import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateText } from '@/lib/services/ai.service';
import { requireSession } from '@/lib/api/require-session';
import {
  enforceRateLimit,
  rateLimitSubjectFromRequest,
} from '@/lib/api/rate-limit';

export const maxDuration = 15;

function normalizeAiConfig(provider: string, model: string) {
  let aiProvider = provider || process.env.DEFAULT_AI_PROVIDER || 'gemini';
  let aiModel = model || process.env.DEFAULT_AI_MODEL || 'gemini-3.8-flash';

  if (aiModel === 'gemini-1.5-flash' || !aiModel) {
    aiModel = 'gemini-3.8-flash';
    aiProvider = 'gemini';
  }

  if (aiProvider === 'gemini' && aiModel.startsWith('google/')) {
    aiModel = aiModel.replace(/^google\//, '');
  }

  if (
    aiProvider === 'openrouter' &&
    aiModel.startsWith('gemini-') &&
    !aiModel.includes('/')
  ) {
    aiModel = `google/${aiModel}`;
  }

  return { aiProvider, aiModel };
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    const rateLimited = await enforceRateLimit({
      bucket: 'remix',
      subject: rateLimitSubjectFromRequest(auth.user.email, req),
    });
    if (rateLimited) return rateLimited;

    const { currentText } = await req.json();

    if (!currentText || typeof currentText !== 'string') {
      return NextResponse.json({ error: 'Missing currentText' }, { status: 400 });
    }

    let aiProvider = process.env.DEFAULT_AI_PROVIDER || 'gemini';
    let aiModel = process.env.DEFAULT_AI_MODEL || 'gemini-3.8-flash';
    let brandIdentity = '';

    try {
      const user = await prisma.user.findUnique({
        where: { email: auth.user.email },
        include: { workspaces: { include: { workspace: true } } },
      });
      if (user && user.workspaces.length > 0) {
        const ws = user.workspaces[0].workspace;
        if (ws.aiProvider) aiProvider = ws.aiProvider;
        if (ws.aiModel) aiModel = ws.aiModel;
        if (ws.brandIdentity) brandIdentity = ws.brandIdentity;
      }
    } catch (e) {
      console.warn('remix-slide: workspace lookup failed', e);
    }

    ({ aiProvider, aiModel } = normalizeAiConfig(aiProvider, aiModel));

    const prompt = `
אתה קופירייטר שיווקי. קיבלת טקסט של שקף אחד מתוך קרוסלת אינסטגרם.
המטרה שלך היא לשכתב את הטקסט כך שיישמע טוב יותר, קליט יותר, ומושך יותר.

הטקסט הנוכחי:
"${currentText}"

${brandIdentity ? `זהות המותג וטון הדיבור שעליך לשמור עליהם:\n${brandIdentity}\n` : ''}

הוראות:
1. שמור על אורך דומה (קצר וקולע, עד 15-20 מילים).
2. הוסף אימוג'י אחד או שניים במידת הצורך.
3. הטקסט חייב להיות בעברית.
4. החזר רק את הטקסט המשוכתב ללא שום תוספת, מרכאות או הסברים.
`;

    let newText = await generateText({
      prompt,
      provider: aiProvider,
      model: aiModel,
    });
    newText = (newText || currentText).replace(/^["']|["']$/g, '').trim();

    if (!newText) {
      return NextResponse.json(
        { error: 'Empty remix result' },
        { status: 502 }
      );
    }

    return NextResponse.json({ newText });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to remix slide';
    console.error('Error remixing slide:', error);
    return NextResponse.json(
      {
        error: 'Failed to remix slide',
        detail:
          message.includes('API_KEY') || message.includes('Missing')
            ? message
            : undefined,
      },
      { status: 500 }
    );
  }
}
