import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const maxDuration = 15;

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key',
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentText } = await req.json();

    if (!currentText) {
      return NextResponse.json({ error: 'Missing currentText' }, { status: 400 });
    }

    // Try finding user's preferred model
    let aiModel = 'google/gemini-2.5-flash';
    let brandIdentity = '';
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { workspaces: { include: { workspace: true } } }
      });
      if (user && user.workspaces.length > 0) {
        const ws = user.workspaces[0].workspace;
        if (ws.aiModel) {
          aiModel = ws.aiModel;
          if (aiModel === 'gemini-1.5-flash') aiModel = 'google/gemini-2.5-flash';
        }
        if (ws.brandIdentity) {
          brandIdentity = ws.brandIdentity;
        }
      }
    } catch(e) {}

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

    const completion = await openai.chat.completions.create({
      model: aiModel,
      messages: [{ role: 'user', content: prompt }]
    });

    let newText = completion.choices[0].message.content?.trim() || currentText;
    // Remove wrapping quotes if AI added them
    newText = newText.replace(/^["']|["']$/g, '');

    return NextResponse.json({ newText });
  } catch (error) {
    console.error('Error remixing slide:', error);
    return NextResponse.json({ error: 'Failed to remix slide' }, { status: 500 });
  }
}
