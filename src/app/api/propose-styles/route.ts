import { NextResponse } from 'next/server';
import { proposeStylesSchema } from '@/lib/validations';
import { generateJson } from '@/lib/services/ai.service';
import {
  buildFallbackNarrativeDirections,
  buildTopicFidelityConstraint,
  type NarrativeDirection,
} from '@/lib/wizard';
import { requireSession } from '@/lib/api/require-session';
import {
  enforceRateLimit,
  rateLimitSubjectFromRequest,
} from '@/lib/api/rate-limit';
import { extractUrlsFromText } from '@/lib/reference-links';
import { scrapeUrlsDetailed } from '@/lib/services/scraper.service';
import { formatScrapeResultsForPrompt } from '@/lib/scrape-result';

export const maxDuration = 30;

function normalizeDirections(
  raw: unknown,
  topic: string
): NarrativeDirection[] {
  const fallback = buildFallbackNarrativeDirections(topic);
  if (!Array.isArray(raw) || raw.length < 2) return fallback;

  const cleaned = raw
    .slice(0, 3)
    .map((item: unknown, index: number): NarrativeDirection | null => {
      const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : null;
      const title = String(record?.title || '').trim();
      if (!title) return null;
      return {
        id: String(record?.id || `dir-${index + 1}`).trim() || `dir-${index + 1}`,
        title,
        summary: String(record?.summary || '').trim() || fallback[index % 2].summary,
        whyItWorks:
          String(record?.whyItWorks || '').trim() ||
          fallback[index % 2].whyItWorks,
        structureHint:
          String(record?.structureHint || '').trim() ||
          fallback[index % 2].structureHint,
      };
    })
    .filter(Boolean) as NarrativeDirection[];

  if (cleaned.length < 2) return fallback;
  return cleaned.slice(0, 2);
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    const rateLimited = await enforceRateLimit({
      bucket: 'wizard',
      subject: rateLimitSubjectFromRequest(auth.user.email, req),
    });
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const parsed = proposeStylesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { topic, audience, goal } = parsed.data;
    const aiProvider = process.env.DEFAULT_AI_PROVIDER || 'gemini';
    const aiModel = process.env.DEFAULT_AI_MODEL || 'gemini-3.8-flash';

    const urlsInTopic = extractUrlsFromText(topic);
    let scrapedContext = '';
    if (urlsInTopic.length > 0) {
      try {
        const scrapeReport = await scrapeUrlsDetailed(urlsInTopic);
        scrapedContext = formatScrapeResultsForPrompt(scrapeReport);
      } catch (scrapeErr) {
        console.warn('Propose styles scrape failed:', scrapeErr);
      }
    }

    const topicFidelity = buildTopicFidelityConstraint(topic);

    const prompt = `
אתה אסטרטג תוכן לקרוסלות אינסטגרם בעברית (פורמט אנכי 1080×1350).
המשתמש נתן נושא או מקור תוכן. הצע בדיוק 2 כיווני סגנון נרטיביים מובחנים — מבנה תוכן חזק שמתאים לאינסטגרם.
${
  scrapedContext
    ? `
=== מקור תוכן מחייב שנשלף מהקישור שצורף ===
${scrapedContext}
הנחיה חשובה: שני הכיוונים הנרטיביים חייבים להתבסס ישירות על התוכן, הרעיונות, הטיפים והתובנות מהקישור הנ״ל!
`
    : ''
}
נושא: ${topic}
קהל: ${audience || 'לא צוין'}
מטרה: ${goal || 'לא צוינה'}
${topicFidelity}

הסתמך על ידע כללי של מה שעובד בנישה (שמירות, שיתופים, גלילה עד הסוף). אין צורך בסריקת אינסטגרם אמיתית — נמק מהיגיון שיווקי.
שני הכיוונים חייבים להישאר על הנושא המדויק (למשל קורס/מוצר ספציפי) — לא להרחיב לקטגוריה ההורה.

שני הכיוונים צריכים להיות מובחנים, למשל:
- רשימה חינוכית / טיפים ממוספרים
- קשת סיפור אישית / מסע שינוי
אפשר גם זוויות אחרות שמתאימות לנושא (מיתוס מול מציאות, לפני־אחרי, שאלות ותשובות) — כל עוד יש בדיוק 2 וכל כיוון נשאר על אותו נושא מדויק.

החזר JSON בלבד:
{
  "researchNote": "משפט־שניים בעברית: למה כיוונים כאלה מתאימים לנושא המדויק",
  "directions": [
    {
      "id": "slug-באנגלית-קצר",
      "title": "כותרת כיוון בעברית",
      "summary": "משפט אחד מה הקרוסלה תעשה — חייב להזכיר את הנושא המדויק",
      "whyItWorks": "משפט אחד למה זה עובד בנישה",
      "structureHint": "הנחיית מבנה קצרה לקופירייטר (שער / תוכן / הוכחה / CTA) כולל תזכורת להישאר על הנושא המדויק"
    }
  ]
}
`;

    try {
      const result = await generateJson<{
        researchNote?: string;
        directions?: unknown;
      }>({ prompt, provider: aiProvider, model: aiModel });

      const directions = normalizeDirections(result.directions, topic);
      return NextResponse.json({
        researchNote:
          result.researchNote?.trim() ||
          'בחרתי שני כיוונים שונים שעובדים טוב לקרוסלות שמירה ושיתוף בנושא הזה.',
        directions,
      });
    } catch (aiError) {
      console.warn('Propose styles AI fallback:', aiError);
      return NextResponse.json({
        researchNote:
          'הנה שני כיוונים מוכחים לקרוסלות — אפשר לבחור ולהמשיך ליצירה.',
        directions: buildFallbackNarrativeDirections(topic),
        offline: true,
      });
    }
  } catch (error) {
    console.error('Propose styles error:', error);
    return NextResponse.json(
      { error: 'Failed to propose styles' },
      { status: 500 }
    );
  }
}
