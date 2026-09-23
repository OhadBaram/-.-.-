import { NextResponse } from 'next/server';
import { generateJson } from '@/lib/services/ai.service';
import {
  clampPalette,
  recommendPaletteLocal,
} from '@/lib/brand-palette';
import { requireSession } from '@/lib/api/require-session';
import {
  enforceRateLimit,
  rateLimitSubjectFromRequest,
} from '@/lib/api/rate-limit';

export const maxDuration = 20;

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    const rateLimited = await enforceRateLimit({
      bucket: 'suggest',
      subject: rateLimitSubjectFromRequest(auth.user.email, req),
    });
    if (rateLimited) return rateLimited;

    const body = await req.json().catch(() => ({}));
    const topic = typeof body.topic === 'string' ? body.topic : '';
    const visualStyle =
      typeof body.visualStyle === 'string' ? body.visualStyle : 'minimal';
    const seedPalette = clampPalette(
      body.seedPalette ||
        (Array.isArray(body.seedColors)
          ? { accents: body.seedColors, backgrounds: [] }
          : null)
    );

    const local = recommendPaletteLocal({
      topic,
      visualStyle,
      seedColor: seedPalette.accents[0],
    });

    const aiProvider = process.env.DEFAULT_AI_PROVIDER || 'gemini';
    const aiModel = process.env.DEFAULT_AI_MODEL || 'gemini-3.8-flash';

    try {
      const result = await generateJson<{
        accents?: string[];
        backgrounds?: string[];
        colors?: string[];
        reason?: string;
      }>({
        prompt: `
אתה מעצב מותג לקרוסלות אינסטגרם בעברית.
החזר JSON בלבד:
{
  "accents": ["#hex", "..."],
  "backgrounds": ["#hex", "..."],
  "reason": "משפט קצר בעברית"
}

כללים:
- accents: 3–6 צבעי HEX לאקסנטים (כפתורים, קווים, הדגשות) — צבעוניים ומותאמים לנושא.
- backgrounds: 2–4 צבעי HEX לרקעי שקפים (לפחות אחד בהיר גווני ואחד כהה גווני).
- אסור להחזיר רקע לבן שטוח (#ffffff) או שחור שטוח (#000000) כברירת מחדל — העדיפו גוונים עדינים לפי הנושא.
- התאם לנושא ולסגנון. ניגודיות טובה לטקסט.

נושא: ${topic || '(כללי)'}
סגנון: ${visualStyle}
פלטה נוכחית: ${JSON.stringify(seedPalette)}
המלצה מקומית: ${JSON.stringify(local)}
`,
        provider: aiProvider,
        model: aiModel,
      });

      const palette = clampPalette({
        accents: result.accents || result.colors || local.accents,
        backgrounds: result.backgrounds || local.backgrounds,
      });

      return NextResponse.json({
        ...palette,
        colors: palette.accents,
        reason:
          result.reason ||
          'שילוב מומלץ לפי הנושא והסגנון — אפשר להוסיף ולערוך.',
        source: 'ai',
      });
    } catch (err) {
      console.warn('suggest-palette AI fallback', err);
      return NextResponse.json({
        ...local,
        colors: local.accents,
        reason: 'המלצה מקומית לפי סגנון ונושא — אפשר לערוך.',
        source: 'local',
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to suggest palette' },
      { status: 500 }
    );
  }
}
