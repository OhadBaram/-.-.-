import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getTenantDB } from '@/lib/tenant-db';

export const maxDuration = 60;

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

    const { websiteUrl, referenceLink1 } = await req.json();

    const urlsToScrape = [websiteUrl, referenceLink1].filter(Boolean) as string[];
    
    if (urlsToScrape.length === 0) {
      return NextResponse.json({ brandIdentity: '' });
    }

    const scrapePromises = urlsToScrape.map(async (url) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 20000); 
      try {
        const res = await fetch(`https://r.jina.ai/${url}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        return `--- מידע מהקישור: ${url} ---\n${text.substring(0, 3000)}\n`;
      } catch (err) {
        console.error(`Failed to scrape ${url}:`, err);
        return '';
      } finally {
        clearTimeout(id);
      }
    });
    
    const results = await Promise.allSettled(scrapePromises);
    const scrapedContext = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map(r => r.value)
      .join('\n');

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
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { workspaces: { include: { workspace: true } } }
      });
      if (user && user.workspaces.length > 0) {
        if (user.workspaces[0].workspace.aiModel) {
          aiModel = user.workspaces[0].workspace.aiModel;
          if (aiModel === 'gemini-1.5-flash') aiModel = 'google/gemini-2.5-flash'; // map to openrouter
        }
      }
    } catch(e) {}

    const completion = await openai.chat.completions.create({
      model: aiModel,
      messages: [{ role: 'user', content: prompt }]
    });

    const aiText = completion.choices[0].message.content?.trim() || '';

    return NextResponse.json({ brandIdentity: aiText });
  } catch (error) {
    console.error('Error analyzing brand:', error);
    return NextResponse.json({ error: 'Failed to analyze brand' }, { status: 500 });
  }
}
