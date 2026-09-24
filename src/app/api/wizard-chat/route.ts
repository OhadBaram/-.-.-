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
import { extractUrlsFromText } from '@/lib/reference-links';
import { scrapeUrlsDetailed } from '@/lib/services/scraper.service';
import { formatScrapeResultsForPrompt, type ScrapeUrlResult } from '@/lib/scrape-result';
import { classifyTier1Intent } from '@/lib/decision-router/tier1-classifier';

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

    const urlsInMessage = extractUrlsFromText(message);
    const urlsInHistory = (history || [])
      .filter((m) => m.role === 'user')
      .flatMap((m) => extractUrlsFromText(m.text));
    const allUrlsInChat = Array.from(new Set([...urlsInMessage, ...urlsInHistory]));

    let scrapedLinkContext = '';
    let scrapeReport: ScrapeUrlResult[] = [];
    if (allUrlsInChat.length > 0) {
      try {
        scrapeReport = await scrapeUrlsDetailed(allUrlsInChat);
        scrapedLinkContext = formatScrapeResultsForPrompt(scrapeReport);
      } catch (scrapeErr) {
        console.warn('Wizard chat link scrape failed:', scrapeErr);
      }
    }

    // שרשרת החלטה - שכבה 1: מסווג היוריסטי דטרמיניסטי מיידי (0ms, אפס טוקנים)
    const tier1Decision = classifyTier1Intent({
      message,
      history,
      scrapedResults: scrapeReport,
      intakeAlreadyShown,
      existingTopicGuess,
    });

    if (tier1Decision.handled) {
      return NextResponse.json({
        reply: tier1Decision.reply,
        topic: tier1Decision.topic,
        phase: tier1Decision.phase,
        readyForDirections: tier1Decision.readyForDirections,
        applyRecommendedAll: tier1Decision.applyRecommendedAll,
        suggestedSlideCount: tier1Decision.suggestedSlideCount ?? null,
        suggestedDensity: tier1Decision.suggestedDensity ?? null,
        suggestedVisualStyle: tier1Decision.suggestedVisualStyle ?? null,
        suggestedVisualStyleCustom: tier1Decision.suggestedVisualStyleCustom || '',
        useRecommendedStructure: tier1Decision.useRecommendedStructure ?? null,
        suggestedAudience: tier1Decision.suggestedAudience || '',
        suggestedGoal: tier1Decision.suggestedGoal || '',
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
אתה במאי קריאייטיב ואסטרטג קרוסלות לאינסטגרם בעברית במוצר «קרוסל. איי. אי».
התפקיד שלך הוא להוביל את המשתמש ליצירת הקרוסלה הטובה ביותר ברשת.
קול: מקצועי, חד, שיווקי, אנרגטי וענייני.

כלל זהב ל־UI: הצ׳אט הוא ייעוץ והובלה. מה שקובע את הקרוסלה — פאנל «הגדרות סופיות».
לעולם אל תכתוב «נעלתי» או «קבעתי». כתוב «ממליץ», «הנה כיוון חזק», «אפשר להתאים בפאנל».

${
  scrapedLinkContext
    ? `
=== מידע שנשלף מהקישור שצירף המשתמש (יוטיוב / טיקטוק / רשת X / אתר) ===
${scrapedLinkContext}

הנחיית על לקישור שסופק:
1. פתח בהתייחסות ישירה וברורה לתוכן הסרטון/הערוץ/הקישור: ציין במפורש את שם הסרטון או ערוץ היוטיוב/היוצר ותחום העיסוק שלו, כדי שהמשתמש יידע בוודאות שהערוץ/התוכן זוהה ונותח לעומק!
2. אם סופק ערוץ יוטיוב או פרופיל עם סרטונים מרובים:
   - ציין את זיהוי הערוץ והנושא הראשי שלו על סמך התיאור ושמות הסרטונים האחרונים שנשלפו.
   - חובה לקבוע phase="clarify" ולהציע למשתמש 2-3 זוויות ממוקדות לבחירה (למשל: התמקדות באחד הסרטונים האחרונים הבולטים של הערוץ לפי כותרתו, או קרוסלת סקירה מקיפה של תובנות המפתח של הערוץ).
   - חל איסור מוחלט להמציא נושא או תעשייה אחרת!
3. אם מדובר בסרטון או מאמר עם כמה תתי-נושאים (או אם המשתמש שלח לינק בלבד בלי הנחיות ספציפיות):
   - קבע phase="clarify" והצג שאלת הבהרה חדה עם 2-3 אפשרויות מיקוד שעלו מתוך הסרטון.
`
    : ''
}

חוק מניעת אי-בהירות ושאלות הבהרה (Clarification Engine):
בכל מקום שבו קיימת אי-בהירות ברמה גבוהה:
1. הנושא כללי, רחב או גנרי מאוד (למשל: "הצלחה", "מוטיבציה", "שיווק", "כושר", "נדל״ן", "בינה מלאכותית") ללא קהל, זווית או הצעה קונקרטית,
2. המשתמש שאל שאלה קצרה או עמומה שניתן לקחת לכיוונים שונים בתכלית,
3. צורף קישור מקיף ללא פירוט באיזה פן שלו המשתמש מעוניין:
חובה עליך לקבוע phase="clarify", ולא לנחש בצורה עיוורת!

מבנה תשובת הבהרה (phase="clarify"):
- משפט פתיחה חיובי ומקצועי על הפוטנציאל של הנושא.
- שאלת הבהרה ממוקדת שמציעה 2-3 זוויות שונות לבחירה, ממוספרות בבירור.
- הזמנה קצרה: "בחרו מספר או כתבו איך תרצו שנתמקד".
כאשר phase="clarify" — קבע readyForDirections=false.

זרימה רגילה (כאשר הנושא כבר ברור וממוקד):
1) כשמגיע נושא ברור וממוקד בפעם הראשונה — החזר תשובת קליטה מובנית (intake), אל תעבור ליצירת שקפים.
2) אחרי קליטה — המשתמש משנה בפאנל או לוחץ «המשך עם ההגדרות הסופיות» / כותב «מומלץ».
3) רק אז phase=ready_for_directions.

מבנה חובה לתשובת intake (reply) בעברית:
- פתיח קצר + התאמה לנישה + משפט: «זה ייעוץ — ההגדרות הסופיות בפאנל קובעות»
- ## המלצה · מספר עמודים
  המלץ 7 (שער+תוכן+סיום) כברירת מחדל; אם בנושא יש N טיפים/פריטים — המלץ N+2 (בין ${MIN_SLIDE_COUNT}–${MAX_SLIDE_COUNT}).
- ## המלצה · סטייל ויזואלי
  הצג את האפשרויות: ${styleOptionsList}
  תן המלצה מודעת-נישה.
- ## המלצה · צפיפות מידע
  קליל / סטנדרטי ⭐ / עשיר (${densityOptionsList})
- סיום: שנו בפאנל מה שרוצים, ואז «המשך עם ההגדרות הסופיות».

אם זו תשובת intake — readyForDirections=false.
אם המשתמש כתב «מומלץ» או ביקש להמשיך עם ההגדרות — readyForDirections=true ו-applyRecommendedAll בהתאם.

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
  "reply": "טקסט בעברית לפי המבנה למעלה",
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
