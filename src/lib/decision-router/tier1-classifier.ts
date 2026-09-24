import {
  buildIntakeReply,
  buildIntakeSuggestions,
  buildOptionsAckReply,
  inferListItemCount,
  isRecommendedAllIntent,
  parseUserOptionPicks,
  type WizardChatPhase,
} from '@/lib/wizard-intake';
import { type DensityId, type VisualStyleId } from '@/lib/wizard';
import { extractUrlsFromText } from '@/lib/reference-links';
import type { ScrapeUrlResult } from '@/lib/scrape-result';

export interface Tier1InputParams {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
  scrapedResults?: ScrapeUrlResult[];
  intakeAlreadyShown?: boolean;
  existingTopicGuess?: string;
}

export type Tier1ClassificationResult =
  | {
      handled: true;
      phase: WizardChatPhase;
      reply: string;
      topic: string;
      readyForDirections: boolean;
      applyRecommendedAll: boolean;
      suggestedSlideCount?: number | null;
      suggestedDensity?: DensityId | null;
      suggestedVisualStyle?: VisualStyleId | null;
      suggestedVisualStyleCustom?: string;
      useRecommendedStructure?: boolean | null;
      suggestedAudience?: string;
      suggestedGoal?: string;
      offline: true;
      reason: string;
    }
  | {
      handled: false;
      reason: string;
    };

/** רשימת מילות מפתח עמומות מובהקות (תחומים כלליים מדי הדורשים הבהרה) */
const BROAD_AMBIGUOUS_KEYWORDS = new Set([
  'כושר',
  'ספורט',
  'שיווק',
  'דיגיטל',
  'נדלן',
  'נדל״ן',
  'השקעות',
  'כסף',
  'בינה מלאכותית',
  'ai',
  'מוטיבציה',
  'הצלחה',
  'עסקים',
  'מכירות',
  'הורות',
  'בריאות',
  'תזונה',
  'אוכל',
  'מתכונים',
  'עיצוב',
  'קריירה',
  'ניהול',
  'פרודוקטיביות',
  'הרגלים',
]);

/**
 * בודק אם הנושא הוא מילה בודדת או ביטוי רחב ועמום הדורש הבהרה מיידית
 */
export function isBroadAmbiguousTopic(raw: string): boolean {
  const clean = raw.trim().toLowerCase().replace(/^[״"']+|[״"'.!?:;,]+$/g, '');
  if (!clean || clean.length < 2) return false;

  // אם יש מספר פריטים מפורש (כמו "5 טיפים לכושר"), זה אינו עמום!
  if (inferListItemCount(clean) != null) return false;

  // אם יש מילות פירוט מפורשות ("איך לעשות", "מדריך", "טעויות של")
  if (/איך|מדריך|טעויות|שיטה|עקרונות|צעדים|שלבים|מתחילים|מדוע|למה/.test(clean)) {
    return false;
  }

  // מילה ישירה מתוך מילון העמומים
  if (BROAD_AMBIGUOUS_KEYWORDS.has(clean)) return true;

  // מילה בודדת קצרה ללא רווחים (פחות מ-12 תווים)
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1 && clean.length <= 12 && !clean.includes('http')) {
    return true;
  }

  // שתי מילים כלליות מאוד (למשל "שיווק דיגיטלי", "ניהול זמן", "אורח חיים בריא")
  if (words.length <= 2 && BROAD_AMBIGUOUS_KEYWORDS.has(words[0])) {
    return true;
  }

  return false;
}

/**
 * מייצר שאלת הבהרה חדה וממוקדת עבור נושא עמום ב-0ms
 */
export function buildBroadTopicClarification(topic: string): string {
  const clean = topic.trim();
  return [
    `בחרת בנושא עם המון פוטנציאל («${clean}»), אך הוא רחב מאוד!`,
    'כדי שנעצב קרוסלה שתעצור את הגלילה באינסטגרם, באיזה כיוון תרצה שנתמקד?',
    '',
    `1. 3 הטעויות הנפוצות ביותר ב${clean} ואיך להימנע מהן`,
    `2. 5 טיפים מעשיים של מומחים ליישום מיידי כבר היום`,
    `3. מיתוסים נפוצים מול המציאות שחייבים להכיר`,
    '',
    'בחרו מספר (1, 2 או 3) או כתבו במשפט איך תרצו שנתמקד!',
  ].join('\n');
}

/**
 * מזהה אם המשתמש משיב לשאלת הבהרה על ידי בחירת מספר או כיוון
 */
export function detectClarificationChoice(
  message: string,
  lastAssistantText?: string
): { choiceNumber: number; derivedTopic: string } | null {
  const t = message.trim();
  const numMatch = t.match(/^(?:אפשרות\s*|מספר\s*|אופציה\s*|כיוון\s*)?([1-3])\b/i) ||
                   t.match(/^([1-3])$/);

  let choice = numMatch ? Number(numMatch[1]) : null;
  if (!choice) {
    if (/^(הראשון|הראשונה|אחת|אחד)$/.test(t)) choice = 1;
    if (/^(השני|השניה|שתיים|שניים)$/.test(t)) choice = 2;
    if (/^(השלישי|השלישית|שלוש|שלושה)$/.test(t)) choice = 3;
  }

  if (!choice || !lastAssistantText) return null;

  // חילוץ השורות של האפשרויות מתוך שאלת ההבהרה הקודמת
  const optionRegex = new RegExp(`^${choice}\\.\\s*(.+)$`, 'm');
  const match = lastAssistantText.match(optionRegex);
  if (match && match[1]) {
    const derivedTopic = match[1].replace(/^[^\wא-ת]+/, '').trim();
    return { choiceNumber: choice, derivedTopic };
  }

  return null;
}

/**
 * מייצר שאלת הבהרה לערוץ יוטיוב על בסיס הסרטונים שנשלפו
 */
export function buildChannelClarificationReply(
  channelTitle: string,
  videoTitles: string[]
): string {
  const topVideos = videoTitles.slice(0, 2);
  const videoLines = topVideos.map((v, i) => `${i + 1}. קרוסלה המבוססת על הסרטון: «${v}»`);
  const generalOption = `${topVideos.length + 1}. קרוסלת סקירה מקיפה: עקרונות המפתח ותחומי הידע של הערוץ`;

  return [
    `זיהיתי את הערוץ «${channelTitle}»!`,
    'כדי שהקרוסלה תהיה סופר-מדויקת, באיזה כיוון תרצה שנתמקד?',
    '',
    ...videoLines,
    generalOption,
    '',
    `בחרו מספר (1-${topVideos.length + 1}) או כתבו כיוון משלכם ונמשיך מיד!`,
  ].join('\n');
}

/**
 * שכבה 1: מסווג היוריסטי דטרמיניסטי מיידי (0ms)
 * מטפל במקרים שכיחים ללא שום קריאת רשת למודל גנרטיבי
 */
export function classifyTier1Intent(params: Tier1InputParams): Tier1ClassificationResult {
  const {
    message,
    history = [],
    scrapedResults = [],
    intakeAlreadyShown = false,
    existingTopicGuess = '',
  } = params;

  const trimmed = message.trim();
  const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant')?.text;
  const isLastAssistantClarify = Boolean(
    lastAssistant &&
      (lastAssistant.includes('באיזה כיוון תרצה שנתמקד') ||
        lastAssistant.includes('בחרו מספר') ||
        lastAssistant.includes('שאלת הבהרה'))
  );

  const urls = extractUrlsFromText(trimmed);

  // תרחיש 1: אישור "מומלץ" או המשך מהיר
  if (isRecommendedAllIntent(trimmed)) {
    const topic = existingTopicGuess || trimmed;
    const suggestions = buildIntakeSuggestions(topic);
    return {
      handled: true,
      phase: 'ready_for_directions',
      reply: 'מעולה! ממשיכים עם ההגדרות המומלצות ליצירת כיווני התוכן.',
      topic,
      readyForDirections: true,
      applyRecommendedAll: true,
      suggestedSlideCount: suggestions.slideCount,
      suggestedDensity: suggestions.density,
      suggestedVisualStyle: suggestions.visualStyle,
      suggestedVisualStyleCustom: '',
      useRecommendedStructure: true,
      offline: true,
      reason: 'אישור מומלץ דטרמיניסטי (Fast-path All)',
    };
  }

  // תרחיש 2: המשתמש עונה על שאלת הבהרה (לדוגמה: "1", "2", "הראשון")
  if (isLastAssistantClarify) {
    const choice = detectClarificationChoice(trimmed, lastAssistant);
    if (choice) {
      const refinedTopic = choice.derivedTopic;
      const suggestions = buildIntakeSuggestions(refinedTopic);
      const reply = buildIntakeReply(refinedTopic);
      return {
        handled: true,
        phase: 'intake',
        reply,
        topic: refinedTopic,
        readyForDirections: false,
        applyRecommendedAll: false,
        suggestedSlideCount: suggestions.slideCount,
        suggestedDensity: suggestions.density,
        suggestedVisualStyle: suggestions.visualStyle,
        suggestedVisualStyleCustom: '',
        useRecommendedStructure: true,
        offline: true,
        reason: `בחירת כיוון הבהרה ${choice.choiceNumber} מתוך השאלות הקודמות`,
      };
    }
  }

  // תרחיש 3: קישור ערוץ יוטיוב עם סרטונים סרוקים ללא הנחיות נוספות
  if (urls.length > 0 && trimmed === urls[0]) {
    const youtubeScrape = scrapedResults.find((s) => s.kind === 'youtube' && s.status === 'success');
    if (youtubeScrape && youtubeScrape.signals && youtubeScrape.signals.length >= 2) {
      const channelTitle = youtubeScrape.signals[0] || 'ערוץ היוטיוב';
      const recentVideos = youtubeScrape.signals.slice(1);
      if (recentVideos.length > 0) {
        return {
          handled: true,
          phase: 'clarify',
          reply: buildChannelClarificationReply(channelTitle, recentVideos),
          topic: channelTitle,
          readyForDirections: false,
          applyRecommendedAll: false,
          offline: true,
          reason: 'זיהוי קישור ערוץ יוטיוב המכיל סרטונים מרובים',
        };
      }
    }
  }

  // תרחיש 4: מילה בודדת או ביטוי עמום ורחב ללא הקשר
  if (urls.length === 0 && isBroadAmbiguousTopic(trimmed)) {
    return {
      handled: true,
      phase: 'clarify',
      reply: buildBroadTopicClarification(trimmed),
      topic: trimmed,
      readyForDirections: false,
      applyRecommendedAll: false,
      offline: true,
      reason: 'זיהוי מילה בודדת עמומה המחייבת מיקוד והבהרה',
    };
  }

  // תרחיש 5: בחירת אפשרויות אחרי קליטה (כגון שינוי שקפים או צפיפות)
  if (intakeAlreadyShown && urls.length === 0) {
    const picks = parseUserOptionPicks(trimmed);
    if (
      picks.slideCount != null ||
      picks.visualStyle != null ||
      picks.density != null ||
      picks.readyForDirections
    ) {
      const topic = existingTopicGuess || trimmed;
      const suggestions = buildIntakeSuggestions(topic);
      const reply =
        buildOptionsAckReply(picks, topic) ||
        'עדכנתי את ההגדרות. לחצו «המשך עם ההגדרות הסופיות» או כתבו «מומלץ».';

      return {
        handled: true,
        phase: (picks.readyForDirections ? 'ready_for_directions' : 'awaiting_options') as WizardChatPhase,
        reply,
        topic,
        readyForDirections: Boolean(picks.readyForDirections),
        applyRecommendedAll: false,
        suggestedSlideCount: picks.slideCount ?? suggestions.slideCount,
        suggestedDensity: picks.density ?? suggestions.density,
        suggestedVisualStyle: picks.visualStyle ?? suggestions.visualStyle,
        suggestedVisualStyleCustom: picks.visualStyleCustom || '',
        useRecommendedStructure: true,
        offline: true,
        reason: 'עדכון פרמטרי קליטה דטרמיניסטי בפאנל',
      };
    }
  }

  // לא טופל בשכבה 1 -> מועבר לשכבה הבאה (מודל החלטה / LLM)
  return {
    handled: false,
    reason: 'קלט מורכב המחייב ניתוח עמוק או יצירתי',
  };
}
