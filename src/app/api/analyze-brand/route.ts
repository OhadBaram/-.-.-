import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateText } from '@/lib/services/ai.service';
import { scrapeUrls } from '@/lib/services/scraper.service';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { websiteUrl, referenceLink1 } = await req.json();

    const scrapedContext = await scrapeUrls([websiteUrl, referenceLink1]);

    if (!scrapedContext.trim()) {
      return NextResponse.json({ brandIdentity: 'לא הצלחנו למשוך מידע מהקישורים שהוזנו.' });
    }

    const prompt = `
אתה מומחה מיתוג ושיווק. קיבלת מידע שנאסף מהאתר ומהרשתות החברתיות של עסק.
המטרה שלך היא לנתח את המידע ולכתוב סיכום מקצועי (זהות מותג) שישמש בינה מלאכותית אחרת כדי לכתוב עבורם פוסטים וקרוסלות בעתיד.

המידע שנאסף:
${scrapedContext}

אנא כתוב סיכום של פסקה אחת עד שתיים בעברית הכולל:
1. מה העסק עושה ומי קהל היעד.
2. סגנון הכתיבה וטון הדיבור (לדוגמה: מקצועי, קליל, הומוריסטי, סמכותי).
3. מסרים מרכזיים או ערכים בולטים.

החזר רק את טקסט הסיכום, ללא כותרות וללא הקדמות.
    `;

    // Try finding user's preferred model or fallback
    let aiModel = 'google/gemini-2.5-flash';
    let aiProvider = 'openrouter';
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { workspaces: { include: { workspace: true } } }
      });
      if (user && user.workspaces.length > 0) {
        const ws = user.workspaces[0].workspace;
        if (ws.aiModel) {
          aiModel = ws.aiModel;
          if (aiModel === 'gemini-1.5-flash') {
             aiModel = 'google/gemini-2.5-flash'; // map to openrouter
          }
        }
        if (ws.aiProvider) {
          aiProvider = ws.aiProvider;
        }
      }
    } catch(e) {}

    const aiText = await generateText({ prompt, provider: aiProvider, model: aiModel });

    return NextResponse.json({ brandIdentity: aiText });
  } catch (error) {
    console.error('Error analyzing brand:', error);
    return NextResponse.json({ error: 'Failed to analyze brand' }, { status: 500 });
  }
}

