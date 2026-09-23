export type DensityId = 'light' | 'standard' | 'rich';

export type VisualStyleId =
  | 'minimal'
  | 'bold'
  | 'luxury'
  | 'magazine'
  | 'custom';

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
}[] = [
  {
    id: 'minimal',
    label: 'מינימליסטי',
    hint: 'רקע נקי, טיפוגרפיה ברורה',
    promptHint:
      'סגנון ויזואלי מינימליסטי: רקע גוון עדין (לא לבן שטוח), אקסנט צבעוני, טקסט ממורכז, מראה נקי.',
  },
  {
    id: 'bold',
    label: 'נועז',
    hint: 'ניגודיות גבוהה ואנרגיה',
    promptHint:
      'סגנון נועז: רקעים צבעוניים חזקים, ניגודיות גבוהה, ניסוח חד, אנרגיה שיווקית.',
  },
  {
    id: 'luxury',
    label: 'יוקרתי כהה',
    hint: 'כהה, אלגנטי, פרימיום',
    promptHint:
      'סגנון יוקרתי כהה: רקעים כהים עמוקים (לא שחור שטוח), אקסנטי זהב/מתכת, טון בוגר, תחושת פרימיום.',
  },
  {
    id: 'magazine',
    label: 'מגזיני',
    hint: 'עורכי תוכן ומגזינים',
    promptHint:
      'סגנון מגזיני מודרני: רקעי גוון אופנתיים, כותרות חזקות, קצב עריכתי, תחושת שער.',
  },
  {
    id: 'custom',
    label: 'תיאור חופשי',
    hint: 'תארו את המראה במילים',
    promptHint: '',
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

/** Metadata from the creation wizard, stored alongside slides in slidesData */
export interface WizardPackageMeta {
  slideCount: number;
  density: DensityId;
  visualStyle: VisualStyleId;
  visualStyleCustom?: string;
  directionTitle?: string | null;
}

export function densityLabel(density: DensityId): string {
  return DENSITY_OPTIONS.find((d) => d.id === density)?.label || 'סטנדרטי';
}

export function visualStyleLabel(
  visualStyle: VisualStyleId,
  visualStyleCustom?: string
): string {
  if (visualStyle === 'custom' && visualStyleCustom?.trim()) {
    return visualStyleCustom.trim().slice(0, 40);
  }
  return (
    VISUAL_STYLE_OPTIONS.find((o) => o.id === visualStyle)?.label || 'מינימליסטי'
  );
}

/** One-line RTL summary for the editor top bar */
export function formatWizardSummaryLine(meta: WizardPackageMeta): string {
  const parts = [
    `${meta.slideCount} שקפים`,
    densityLabel(meta.density),
  ];
  const direction = meta.directionTitle?.trim();
  if (direction) {
    parts.push(`כיוון: ${direction}`);
  } else {
    parts.push(visualStyleLabel(meta.visualStyle, meta.visualStyleCustom));
  }
  return parts.join(' · ');
}

export interface NarrativeDirection {
  id: string;
  title: string;
  summary: string;
  whyItWorks: string;
  structureHint: string;
}

/**
 * אילוץ דיוק לנושא — מונע הרחבה לקטגוריה־הורה
 * (למשל «קורס מדריכות הנקה» → לא «הנקה» באופן כללי).
 */
export function buildTopicFidelityConstraint(topic: string): string {
  const clean = topic.trim() || 'הנושא שסופק';
  return `דיוק לנושא (חובה מוחלטת):
הנושא שסופק על ידי המשתמש הוא העוגן היחיד של כל התוכן: «${clean}».
- הישארו נאמנים לנוסח ולכוונה המדויקים — אל תרחיבו לקטגוריה ההורה או לנושא כללי יותר.
- אם הנושא מציין מוצר / קורס / הצעה / שירות ספציפי (למשל «קורס מדריכות הנקה») — כל השקפים, הכיתוב וההאשטאגים חייבים לעסוק באותו מוצר/קורס/הצעה, ולא בנושא הרחב שמסביב (למשל הנקה באופן כללי).
- כיוון נרטיבי, סגנון ויזואלי, קרוסלות קודמות ותוכן מותג משפיעים על מבנה וטון בלבד — לא על החלפת הנושא.
- אם יש מתח בין סגנון לבין דיוק הנושא — דיוק הנושא מנצח.`;
}

export function buildStructurePrompt(
  slideCount: number,
  useRecommendedStructure: boolean,
  narrative?: Pick<NarrativeDirection, 'title' | 'structureHint'> | null
): string {
  const narrativeBlock = narrative
    ? `כיוון נרטיבי שנבחר: ${narrative.title}. הנחיית מבנה לכיוון: ${narrative.structureHint}`
    : '';

  let base: string;
  if (useRecommendedStructure && slideCount === RECOMMENDED_SLIDE_COUNT) {
    base = `מבנה חבילה מלאה ל־${slideCount} שקפים בפורמט 1080×1350:
1) שער הוק (כיסוי) שעוצר גלילה
2–5) שקפי תוכן — רעיון אחד ברור לכל שקף
6) שקף הוכחה / אמינות (מספר, תוצאה, לפני־אחרי, או עדות קצרה)
7) סיום עם קריאה לפעולה חזקה`;
  } else if (slideCount <= 4) {
    base = `מבנה קצר ל־${slideCount} שקפים: שער הוק, תוכן ממוקד (רעיון אחד לשקף), סיום עם קריאה לפעולה. אם יש מקום — שלבו הוכחה קצרה לפני הסיום.`;
  } else if (slideCount === 5) {
    base = `מבנה ל־5 שקפים: שער הוק, 2–3 תוכן (רעיון אחד לשקף), הוכחה קצרה אופציונלית, סיום CTA.`;
  } else {
    base = `מבנה ל־${slideCount} שקפים: שער הוק בפתיחה, שקפי תוכן (רעיון אחד לכל שקף) באמצע, שקף הוכחה לפני הסוף אם אפשר, וסיום עם קריאה לפעולה.`;
  }

  return narrativeBlock ? `${base}\n${narrativeBlock}` : base;
}

/** Fallback directions when the LLM is unavailable */
export function buildFallbackNarrativeDirections(topic: string): NarrativeDirection[] {
  const short = topic.trim().slice(0, 48) || 'הנושא שלכם';
  return [
    {
      id: 'edu-list',
      title: 'רשימה חינוכית חדה',
      summary: `פירוק של «${short}» לטיפים ממוספרים שקל לשמור ולשתף.`,
      whyItWorks:
        'קרוסלות רשימה מצטיינות בשמירות ובשיתופים כשכל שקף נותן ערך מיידי בלי סיפור ארוך.',
      structureHint:
        `כל השקפים נשארים על «${short}» בלבד (בלי הרחבה לקטגוריה כללית יותר). שער עם הבטחת מספר טיפים, שקפי תוכן ממוספרים (טיפ אחד לשקף), שקף הוכחה עם תוצאה/מספר, סיום CTA לשמירה או מעקב.`,
    },
    {
      id: 'story-arc',
      title: 'קשת סיפור אישית',
      summary: `מסע קצר סביב «${short}» — בעיה, תובנה, שינוי, וקריאה לפעולה.`,
      whyItWorks:
        'סיפור אישי מייצר הזדהות ושומר על הגלילה עד הסוף, במיוחד כשיש נקודת מפנה ברורה באמצע.',
      structureHint:
        `כל השקפים נשארים על «${short}» בלבד (בלי הרחבה לקטגוריה כללית יותר). שער עם מתח או שאלה אישית, שקפי עלילה (לפני → תובנה → אחרי), שקף הוכחה מהשטח, סיום CTA רך ואנושי.`,
    },
  ];
}
