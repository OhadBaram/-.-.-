import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateJson } from '@/lib/services/ai.service';
import {
  clampPalette,
  recommendPaletteLocal,
} from '@/lib/brand-palette';

export const maxDuration = 20;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const topic = typeof body.topic === 'string' ? body.topic : '';
    const visualStyle =
      typeof body.visualStyle === 'string' ? body.visualStyle : 'minimal';
    const seedColors = Array.isArray(body.seedColors) ? body.seedColors : [];

    const local = recommendPaletteLocal({
      topic,
      visualStyle,
      seedColor: seedColors[0],
    });

    const aiProvider = process.env.DEFAULT_AI_PROVIDER || 'gemini';
    const aiModel = process.env.DEFAULT_AI_MODEL || 'gemini-3.8-flash';

    try {
      const result = await generateJson<{
        colors?: string[];
        reason?: string;
      }>({
        prompt: `
אתה מעצב מותג לקרוסלות אינסטגרם בעברית.
החזר JSON בלבד:
{
  "colors": ["#hex", "#hex", "#hex"],
  "reason": "משפט קצר בעברית למה השילוב מתאים"
}

כללים:
- בדיוק 3 צבעי HEX תקינים (#rrggbb).
- צבע 1 = ראשי (אקסנט/כפתורים), 2 = משני, 3 = תומך/כהה או ניגודי.
- התאם לנושא ולסגנון.
- ניגודיות טובה לטקסט לבן/כהה על רקע מותג.

נושא: ${topic || '(כללי)'}
סגנון: ${visualStyle}
צבעי בסיס קיימים: ${seedColors.join(', ') || '(אין)'}
המלצה מקומית להשוואה: ${local.join(', ')}
`,
        provider: aiProvider,
        model: aiModel,
      });

      const colors = clampPalette(result.colors || local);
      return NextResponse.json({
        colors,
        reason:
          result.reason ||
          'שילוב מומלץ לפי הנושא והסגנון — אפשר לערוך.',
        source: 'ai',
      });
    } catch (err) {
      console.warn('suggest-palette AI fallback', err);
      return NextResponse.json({
        colors: local,
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
