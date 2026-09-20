import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { wizardChatSchema } from '@/lib/validations';
import { generateJson } from '@/lib/services/ai.service';
import {
  DENSITY_OPTIONS,
  RECOMMENDED_SLIDE_COUNT,
  VISUAL_STYLE_OPTIONS,
} from '@/lib/wizard';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = wizardChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { message, history, options } = parsed.data;
    const densityLabel =
      DENSITY_OPTIONS.find((d) => d.id === options?.density)?.label || 'סטנדרטי';
    const styleLabel =
      VISUAL_STYLE_OPTIONS.find((s) => s.id === options?.visualStyle)?.label ||
      'מינימליסטי';
    const slideCount = options?.slideCount ?? RECOMMENDED_SLIDE_COUNT;

    const historyText = (history || [])
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'משתמש' : 'סוכן'}: ${m.text}`)
      .join('\n');

    const prompt = `
אתה סוכן יצירת קרוסלות בעברית בתוך מוצר בשם קרוסל. איי. אי.
התפקיד שלך: לעזור למשתמש לנסח נושא ברור לקרוסלת אינסטגרם, לשאול שאלת הבהרה אחת אם חסר משהו קריטי, ולסכם מוכנות ליצירה.

הגדרות נוכחיות מהאשף:
- מספר שקפים: ${slideCount}
- צפיפות: ${densityLabel}
- סגנון ויזואלי: ${styleLabel}${
      options?.visualStyleCustom
        ? ` (${options.visualStyleCustom})`
        : ''
    }
- קהל: ${options?.audience || 'לא צוין'}
- מטרה: ${options?.goal || 'לא צוינה'}

היסטוריית שיחה:
${historyText || '(ריקה)'}

הודעת המשתמש האחרונה:
${message}

החזר JSON בלבד עם השדות:
- "reply": תשובה קצרה בעברית (2–4 משפטים), ידידותית ומקצועית
- "topic": מחרוזת נושא/טקסט מקור מעודכן ליצירה (אם עדיין אין נושא ברור — השאר מחרוזת ריקה)
- "readyToGenerate": בוליאני — true רק אם יש נושא ברור מספיק ליצירת קרוסלה
- "suggestedAudience": מחרוזת אופציונלית בעברית
- "suggestedGoal": מחרוזת אופציונלית בעברית

אל תייצר את השקפים עצמם. רק שוחח והכן ליצירה.
`;

    const aiProvider = process.env.DEFAULT_AI_PROVIDER || 'gemini';
    const aiModel = process.env.DEFAULT_AI_MODEL || 'gemini-3.8-flash';

    try {
      const result = await generateJson<{
        reply?: string;
        topic?: string;
        readyToGenerate?: boolean;
        suggestedAudience?: string;
        suggestedGoal?: string;
      }>({ prompt, provider: aiProvider, model: aiModel });

      return NextResponse.json({
        reply:
          result.reply ||
          'מעולה — ספרו לי עוד על הנושא, או לחצו על יצירת קרוסלה כשאתם מוכנים.',
        topic: result.topic || '',
        readyToGenerate: Boolean(result.readyToGenerate && result.topic),
        suggestedAudience: result.suggestedAudience || '',
        suggestedGoal: result.suggestedGoal || '',
      });
    } catch (aiError) {
      console.warn('Wizard chat AI fallback:', aiError);
      const fallbackTopic = message.trim();
      return NextResponse.json({
        reply:
          'קיבלתי את הרעיון. אפשר לכוון את מספר השקפים, הסגנון והצפיפות בצד — ואז ליצור את הקרוסלה.',
        topic: fallbackTopic,
        readyToGenerate: fallbackTopic.length > 3,
        suggestedAudience: '',
        suggestedGoal: '',
        offline: true,
      });
    }
  } catch (error) {
    console.error('Wizard chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process wizard chat' },
      { status: 500 }
    );
  }
}
