import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text().trim();

    return NextResponse.json({ brandIdentity: aiText });
  } catch (error) {
    console.error('Error analyzing brand:', error);
    return NextResponse.json({ error: 'Failed to analyze brand' }, { status: 500 });
  }
}
