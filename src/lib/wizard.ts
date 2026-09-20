export type DensityId = 'light' | 'standard' | 'rich';

export type VisualStyleId =
  | 'minimal'
  | 'bold'
  | 'luxury'
  | 'magazine'
  | 'custom'
  | 'screenshots';

export interface WizardOptions {
  slideCount: number;
  useRecommendedStructure: boolean;
  visualStyle: VisualStyleId;
  visualStyleCustom: string;
  density: DensityId;
  audience: string;
  goal: string;
}

export const RECOMMENDED_SLIDE_COUNT = 7;
export const MIN_SLIDE_COUNT = 3;
export const MAX_SLIDE_COUNT = 15;

export const DENSITY_OPTIONS: {
  id: DensityId;
  label: string;
  hint: string;
  promptHint: string;
}[] = [
  {
    id: 'light',
    label: 'קליל',
    hint: 'משפט אחד חד לכל שקף',
    promptHint:
      'צפיפות מידע קלה: עד 8 מילים לשקף, מסר אחד בלבד, ללא פירוט מיותר.',
  },
  {
    id: 'standard',
    label: 'סטנדרטי',
    hint: 'כותרת קצרה + שורה תומכת',
    promptHint:
      'צפיפות מידע סטנדרטית: עד 15 מילים לשקף, מסר ברור עם שורה תומכת אחת.',
  },
  {
    id: 'rich',
    label: 'עשיר',
    hint: 'יותר פירוט וערך בכל שקף',
    promptHint:
      'צפיפות מידע עשירה: עד 28 מילים לשקף, אפשר שתי שורות ערך, עדיין קריא על מובייל.',
  },
];

export const VISUAL_STYLE_OPTIONS: {
  id: VisualStyleId;
  label: string;
  hint: string;
  promptHint: string;
  stub?: boolean;
}[] = [
  {
    id: 'minimal',
    label: 'מינימליסטי',
    hint: 'רקע נקי, טיפוגרפיה ברורה',
    promptHint: 'סגנון ויזואלי מינימליסטי: צבעים רכים, טקסט ממורכז, מראה נקי.',
  },
  {
    id: 'bold',
    label: 'נועז',
    hint: 'ניגודיות גבוהה ואנרגיה',
    promptHint: 'סגנון נועז: ניגודיות גבוהה, ניסוח חד, אנרגיה שיווקית.',
  },
  {
    id: 'luxury',
    label: 'יוקרתי כהה',
    hint: 'כהה, אלגנטי, פרימיום',
    promptHint: 'סגנון יוקרתי כהה: טון בוגר, ניסוח מדויק, תחושת פרימיום.',
  },
  {
    id: 'magazine',
    label: 'מגזיני',
    hint: 'עורכי תוכן ומגזינים',
    promptHint: 'סגנון מגזיני מודרני: כותרות חזקות, קצב עריכתי, תחושת שער.',
  },
  {
    id: 'custom',
    label: 'תיאור חופשי',
    hint: 'תארו את המראה במילים',
    promptHint: '',
  },
  {
    id: 'screenshots',
    label: 'צילומי מסך',
    hint: 'בקרוב — העלאת דוגמאות',
    promptHint: 'סגנון כללי נקי עד שתהיה תמיכה בצילומי מסך.',
    stub: true,
  },
];

export const DEFAULT_WIZARD_OPTIONS: WizardOptions = {
  slideCount: RECOMMENDED_SLIDE_COUNT,
  useRecommendedStructure: true,
  visualStyle: 'minimal',
  visualStyleCustom: '',
  density: 'standard',
  audience: '',
  goal: '',
};

export function buildVisualStylePrompt(options: WizardOptions): string {
  const preset = VISUAL_STYLE_OPTIONS.find((o) => o.id === options.visualStyle);
  if (options.visualStyle === 'custom' && options.visualStyleCustom.trim()) {
    return `סגנון ויזואלי מותאם אישית שתיאר המשתמש: ${options.visualStyleCustom.trim()}`;
  }
  return preset?.promptHint || VISUAL_STYLE_OPTIONS[0].promptHint;
}

export function buildDensityPrompt(density: DensityId): string {
  return (
    DENSITY_OPTIONS.find((d) => d.id === density)?.promptHint ||
    DENSITY_OPTIONS[1].promptHint
  );
}

export function buildStructurePrompt(
  slideCount: number,
  useRecommendedStructure: boolean
): string {
  if (useRecommendedStructure && slideCount === RECOMMENDED_SLIDE_COUNT) {
    return `מבנה מומלץ ל־${slideCount} שקפים: שקף 1 שער מושך, שקפים 2–6 תוכן ערך (טיפ/תובנה לכל שקף), שקף 7 סיום עם קריאה לפעולה.`;
  }
  if (slideCount <= 4) {
    return `מבנה קצר ל־${slideCount} שקפים: שער, תוכן ממוקד, סיום עם קריאה לפעולה.`;
  }
  return `מבנה ל־${slideCount} שקפים: שער בפתיחה, תוכן ערך באמצע, סיום עם קריאה לפעולה בסוף.`;
}
