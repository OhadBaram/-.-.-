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

export const maxDuration = 30;

function normalizeDirections(
  raw: unknown,
  topic: string
): NarrativeDirection[] {
  const fallback = buildFallbackNarrativeDirections(topic);
  if (!Array.isArray(raw) || raw.length < 2) return fallback;

  const cleaned = raw
    .slice(0, 3)
    .map((item: any, index: number): NarrativeDirection | null => {
      const title = String(item?.title || '').trim();
      if (!title) return null;
      return {
        id: String(item?.id || `dir-${index + 1}`).trim() || `dir-${index + 1}`,
        title,
        summary: String(item?.summary || '').trim() || fallback[index % 2].summary,
        whyItWorks:
          String(item?.whyItWorks || '').trim() ||
          fallback[index % 2].whyItWorks,
        structureHint:
          String(item?.structureHint || '').trim() ||
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

    const topicFidelity = buildTopicFidelityConstraint(topic);

    const prompt = `
אתה אסטרטג תוכן לקרוסלות אינסטגרם בעברית (פורמט אנכי 1080×1350).
המשתמש נתן נושא אחד. הצע בדיוק 2 כיווני סגנון נרטיביים שונים — לא סגנון ויזואלי, אלא מבנה תוכן.

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
