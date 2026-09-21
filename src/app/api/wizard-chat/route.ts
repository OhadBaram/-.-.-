import { NextResponse } from 'next/server';
import { wizardChatSchema } from '@/lib/validations';
import { generateJson } from '@/lib/services/ai.service';
import {
  DENSITY_OPTIONS,
  MAX_SLIDE_COUNT,
  MIN_SLIDE_COUNT,
  RECOMMENDED_SLIDE_COUNT,
  VISUAL_STYLE_OPTIONS,
  type DensityId,
  type VisualStyleId,
} from '@/lib/wizard';
import {
  buildIntakeReply,
  buildIntakeSuggestions,
  buildOptionsAckReply,
  inferListItemCount,
  isRecommendedAllIntent,
  nicheStyleRecommendation,
  parseUserOptionPicks,
  recommendedSlideCountForTopic,
  type WizardChatPhase,
} from '@/lib/wizard-intake';
import { requireSession } from '@/lib/api/require-session';
import {
  enforceRateLimit,
  rateLimitSubjectFromRequest,
} from '@/lib/api/rate-limit';

export const maxDuration = 30;

function clampStyle(value: unknown): VisualStyleId | undefined {
  const ids = VISUAL_STYLE_OPTIONS.map((s) => s.id);
  return typeof value === 'string' && ids.includes(value as VisualStyleId)
    ? (value as VisualStyleId)
    : undefined;
}

function clampDensity(value: unknown): DensityId | undefined {
  const ids = DENSITY_OPTIONS.map((d) => d.id);
  return typeof value === 'string' && ids.includes(value as DensityId)
    ? (value as DensityId)
    : undefined;
}

function clampSlideCount(value: unknown): number | undefined {
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  const int = Math.round(n);
  if (int < MIN_SLIDE_COUNT || int > MAX_SLIDE_COUNT) return undefined;
  return int;
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

    const priorUserTopics = (history || [])
      .filter((m) => m.role === 'user')
      .map((m) => m.text.trim())
      .filter(Boolean);
    const lastAssistant = [...(history || [])]
      .reverse()
      .find((m) => m.role === 'assistant')?.text;
    const intakeAlreadyShown = Boolean(
      lastAssistant &&
        (lastAssistant.includes('מספר עמודים') ||
          lastAssistant.includes('המלצה · מספר עמודים')) &&
        (lastAssistant.includes('סטייל ויזואלי') ||
          lastAssistant.includes('המלצה · סטייל'))
    );

    const localPicks = parseUserOptionPicks(message);
    const existingTopicGuess =
      priorUserTopics.find((t) => !isRecommendedAllIntent(t) && t.length > 2) ||
      '';

    // Fast path: «מומלץ» or clear option picks after intake
    if (intakeAlreadyShown && (localPicks.applyRecommendedAll || localPicks.slideCount || localPicks.visualStyle || localPicks.density || localPicks.readyForDirections)) {
      const topic = existingTopicGuess || message.trim();
      const suggestions = buildIntakeSuggestions(topic);
      const reply =
        buildOptionsAckReply(localPicks, topic) ||
        'עדכנתי. לחצו «המשך עם ההגדרות הסופיות» או כתבו «מומלץ» / «המשך».';

      return NextResponse.json({
        reply,
        topic,
        phase: (localPicks.readyForDirections || localPicks.applyRecommendedAll
          ? 'ready_for_directions'
          : 'awaiting_options') as WizardChatPhase,
        readyForDirections: Boolean(
          localPicks.readyForDirections || localPicks.applyRecommendedAll
        ),
        applyRecommendedAll: localPicks.applyRecommendedAll,
        suggestedSlideCount: localPicks.applyRecommendedAll
          ? suggestions.slideCount
          : localPicks.slideCount,
        suggestedDensity: localPicks.applyRecommendedAll
          ? suggestions.density
          : localPicks.density,
        suggestedVisualStyle: localPicks.applyRecommendedAll
          ? suggestions.visualStyle
          : localPicks.visualStyle,
        suggestedVisualStyleCustom: localPicks.visualStyleCustom || '',
        useRecommendedStructure: localPicks.applyRecommendedAll
          ? true
          : localPicks.useRecommendedStructure,
        suggestedAudience: '',
        suggestedGoal: '',
        offline: true,
      });
    }

    const historyText = (history || [])
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'משתמש' : 'סוכן'}: ${m.text}`)
      .join('\n');

    const styleOptionsList = VISUAL_STYLE_OPTIONS.map(
      (s) => `${s.id}=${s.label}`
    ).join(', ');
    const densityOptionsList = DENSITY_OPTIONS.map(
      (d) => `${d.id}=${d.label}`
    ).join(', ');

    const prompt = `
אתה סוכן יצירת קרוסלות בעברית במוצר «קרוסל. איי. אי».
קול: מקצועי, נלהב בקצרה, בלי להתחנף יתר על המידה. אל תעתיק ניסוחים ממוצרים אחרים.

כלל זהב ל־UI: הצ׳אט הוא ייעוץ בלבד. מה שקובע את הקרוסלה — רק פאנל «הגדרות סופיות».
לעולם אל תכתוב «נעלתי», «קבעתי», «כך תהיה הקרוסלה» כאילו הצ׳אט מחליט. כתוב «ממליץ», «הצעה», «אפשר לשנות בפאנל».

זרימה:
1) כשמגיע נושא ברור בפעם הראשונה — החזר תשובת קליטה מובנית (intake), אל תעבור ליצירת שקפים.
2) אחרי קליטה — המשתמש משנה בפאנל (מקור האמת) או לוחץ «המשך עם ההגדרות הסופיות» / כותב «מומלץ».
3) רק אז phase=ready_for_directions. המערכת תציע שני כיווני תוכן בנפרד.

מבנה חובה לתשובת intake (reply) בעברית, עם כותרות בדיוק כך:
- פתיח קצר + התאמה לנישה + משפט אחד: «זה ייעוץ — ההגדרות הסופיות בפאנל קובעות»
- ## המלצה · מספר עמודים
  המלץ 7 (שער+תוכן+סיום) כברירת מחדל; אם בנושא יש N טיפים/פריטים — המלץ N+2 (בין ${MIN_SLIDE_COUNT}–${MAX_SLIDE_COUNT}). ציין שאפשר מותאם.
- ## המלצה · סטייל ויזואלי
  הצג את האפשרויות: ${styleOptionsList}
  תן המלצה מודעת-נישה (למשל לטק/AI: נועז / כהה ניגודיות גבוהה). ציין שצילומי מסך כהשראה — בקרוב, ואפשר תיאור חופשי.
- ## המלצה · צפיפות מידע
  קליל / סטנדרטי ⭐ / עשיר (${densityOptionsList})
- סיום: שנו בפאנל מה שרוצים, ואז «המשך עם ההגדרות הסופיות».

אם זו תשובת intake — readyForDirections=false.
אם המשתמש כתב «מומלץ» או ביקש להמשיך עם ההגדרות — readyForDirections=true ו-applyRecommendedAll בהתאם.
אם חסר נושא — שאל שאלה אחת קצרה, phase=clarify.

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
- האם כבר הוצגה קליטה: ${intakeAlreadyShown ? 'כן' : 'לא'}

היסטוריית שיחה:
${historyText || '(ריקה)'}

הודעת המשתמש האחרונה:
${message}

החזר JSON בלבד:
{
  "reply": "טקסט בעברית לפי המבנה למעלה (או אישור קצר אם זו בחירת אפשרויות)",
  "topic": "נושא מעודכן או ריק",
  "phase": "clarify" | "intake" | "awaiting_options" | "ready_for_directions",
  "readyForDirections": false,
  "applyRecommendedAll": false,
  "suggestedSlideCount": מספר או null,
  "suggestedDensity": "light"|"standard"|"rich"|null,
  "suggestedVisualStyle": "minimal"|"bold"|"luxury"|"magazine"|"custom"|null,
  "suggestedVisualStyleCustom": "",
  "useRecommendedStructure": true/false/null,
  "suggestedAudience": "",
  "suggestedGoal": ""
}

אל תייצר שקפים. אל תציע עדיין את שני כיווני התוכן בתוך reply של intake.
`;

    const aiProvider = process.env.DEFAULT_AI_PROVIDER || 'gemini';
    const aiModel = process.env.DEFAULT_AI_MODEL || 'gemini-3.8-flash';

    try {
      const result = await generateJson<{
        reply?: string;
        topic?: string;
        phase?: WizardChatPhase;
        readyForDirections?: boolean;
        applyRecommendedAll?: boolean;
        suggestedSlideCount?: number | null;
        suggestedDensity?: string | null;
        suggestedVisualStyle?: string | null;
        suggestedVisualStyleCustom?: string | null;
        useRecommendedStructure?: boolean | null;
        suggestedAudience?: string;
        suggestedGoal?: string;
      }>({ prompt, provider: aiProvider, model: aiModel });

      let topic = (result.topic || '').trim();
      if (!topic && message.trim().length > 2 && !isRecommendedAllIntent(message)) {
        topic = message.trim();
      }
      if (!topic && existingTopicGuess) topic = existingTopicGuess;

      const applyRecommendedAll = Boolean(
        result.applyRecommendedAll || localPicks.applyRecommendedAll
      );
      let readyForDirections = Boolean(
        result.readyForDirections ||
          localPicks.readyForDirections ||
          applyRecommendedAll
      );

      let phase: WizardChatPhase =
        result.phase ||
        (readyForDirections
          ? 'ready_for_directions'
          : topic
            ? 'intake'
            : 'clarify');

      // First clear topic → always prefer structured local intake if model is thin
      let reply = (result.reply || '').trim();
      const needsIntake =
        Boolean(topic) &&
        !intakeAlreadyShown &&
        !readyForDirections &&
        !applyRecommendedAll;

      if (needsIntake) {
        const localIntake = buildIntakeReply(topic);
        if (
          !reply.includes('מספר עמודים') ||
          !reply.includes('סטייל ויזואלי')
        ) {
          reply = localIntake;
        }
        phase = 'intake';
        readyForDirections = false;
      }

      const suggestions = topic ? buildIntakeSuggestions(topic) : null;
      const tipCount = topic ? inferListItemCount(topic) : null;
      const niche = topic ? nicheStyleRecommendation(topic) : null;

      let suggestedSlideCount =
        clampSlideCount(result.suggestedSlideCount) ??
        localPicks.slideCount ??
        (needsIntake || applyRecommendedAll
          ? suggestions?.slideCount
          : undefined);
      if (
        needsIntake &&
        tipCount != null &&
        suggestedSlideCount == null &&
        suggestions
      ) {
        suggestedSlideCount = suggestions.slideCount;
      }

      let suggestedVisualStyle =
        clampStyle(result.suggestedVisualStyle) ??
        localPicks.visualStyle ??
        (needsIntake || applyRecommendedAll
          ? suggestions?.visualStyle ?? niche?.style
          : undefined);

      let suggestedDensity =
        clampDensity(result.suggestedDensity) ??
        localPicks.density ??
        (needsIntake || applyRecommendedAll ? 'standard' : undefined);

      if (applyRecommendedAll && suggestions) {
        suggestedSlideCount = suggestions.slideCount;
        suggestedVisualStyle = suggestions.visualStyle;
        suggestedDensity = suggestions.density;
        readyForDirections = true;
        phase = 'ready_for_directions';
        if (!reply || reply.length < 20) {
          reply = buildOptionsAckReply(
            { applyRecommendedAll: true, readyForDirections: true },
            topic
          );
        }
      }

      return NextResponse.json({
        reply:
          reply ||
          'ספרו לי נושא אחד לקרוסלה — ואכין לכם המלצות מסודרות (ייעוץ בלבד).',
        topic,
        phase,
        readyForDirections,
        applyRecommendedAll,
        suggestedSlideCount: suggestedSlideCount ?? null,
        suggestedDensity: suggestedDensity ?? null,
        suggestedVisualStyle: suggestedVisualStyle ?? null,
        suggestedVisualStyleCustom:
          result.suggestedVisualStyleCustom ||
          localPicks.visualStyleCustom ||
          '',
        useRecommendedStructure:
          result.useRecommendedStructure ??
          localPicks.useRecommendedStructure ??
          (suggestedSlideCount != null
            ? suggestedSlideCount ===
              recommendedSlideCountForTopic(topic || message)
            : null),
        suggestedAudience: result.suggestedAudience || '',
        suggestedGoal: result.suggestedGoal || '',
      });
    } catch (aiError) {
      console.warn('Wizard chat AI fallback:', aiError);
      const fallbackTopic = isRecommendedAllIntent(message)
        ? existingTopicGuess
        : message.trim() || existingTopicGuess;

      if (fallbackTopic && !intakeAlreadyShown && !isRecommendedAllIntent(message)) {
        const suggestions = buildIntakeSuggestions(fallbackTopic);
        return NextResponse.json({
          reply: buildIntakeReply(fallbackTopic),
          topic: fallbackTopic,
          phase: 'intake' as WizardChatPhase,
          readyForDirections: false,
          applyRecommendedAll: false,
          suggestedSlideCount: suggestions.slideCount,
          suggestedDensity: suggestions.density,
          suggestedVisualStyle: suggestions.visualStyle,
          suggestedVisualStyleCustom: '',
          useRecommendedStructure: true,
          suggestedAudience: '',
          suggestedGoal: '',
          offline: true,
        });
      }

      if (fallbackTopic && (isRecommendedAllIntent(message) || intakeAlreadyShown)) {
        const picks = parseUserOptionPicks(message);
        const suggestions = buildIntakeSuggestions(fallbackTopic);
        return NextResponse.json({
          reply:
            buildOptionsAckReply(picks, fallbackTopic) ||
            buildIntakeReply(fallbackTopic),
          topic: fallbackTopic,
          phase: (picks.readyForDirections || picks.applyRecommendedAll
            ? 'ready_for_directions'
            : 'awaiting_options') as WizardChatPhase,
          readyForDirections: Boolean(
            picks.readyForDirections || picks.applyRecommendedAll
          ),
          applyRecommendedAll: picks.applyRecommendedAll,
          suggestedSlideCount: picks.applyRecommendedAll
            ? suggestions.slideCount
            : picks.slideCount ?? suggestions.slideCount,
          suggestedDensity: picks.applyRecommendedAll
            ? suggestions.density
            : picks.density ?? suggestions.density,
          suggestedVisualStyle: picks.applyRecommendedAll
            ? suggestions.visualStyle
            : picks.visualStyle ?? suggestions.visualStyle,
          suggestedVisualStyleCustom: picks.visualStyleCustom || '',
          useRecommendedStructure: true,
          suggestedAudience: '',
          suggestedGoal: '',
          offline: true,
        });
      }

      return NextResponse.json({
        reply: 'ספרו לי נושא אחד לקרוסלה — למשל «5 טיפים ל…» — ואכין המלצות (ייעוץ בלבד).',
        topic: '',
        phase: 'clarify' as WizardChatPhase,
        readyForDirections: false,
        applyRecommendedAll: false,
        suggestedSlideCount: null,
        suggestedDensity: null,
        suggestedVisualStyle: null,
        suggestedVisualStyleCustom: '',
        useRecommendedStructure: null,
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
