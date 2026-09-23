import { NextResponse } from 'next/server';
import {
  GoogleGenerativeAI,
  FunctionDeclaration,
  SchemaType,
} from '@google/generative-ai';
import { requireSession } from '@/lib/api/require-session';
import {
  enforceRateLimit,
  rateLimitSubjectFromRequest,
} from '@/lib/api/rate-limit';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

const TEMPLATE_IDS =
  'minimal, bold, gradient, dark-luxury, frame, split, story, quote, numbered, magazine, waves, neon, image-split, image-full-dark, image-circle-profile, image-split-bottom, image-polaroid, image-side, image-magazine, image-overlay, image-arch, image-dual-split, image-compare, image-grid-2';

const FONT_IDS =
  'Heebo, Assistant, Rubik, Varela Round, Playpen Sans Hebrew, Gveret Levin, Solitreo, Fredoka';

const LAYOUT_PRESETS = 'first-and-last, first-only, all-images, no-images';

const TEMPLATE_HEBREW_NAMES: Record<string, string> = {
  'minimal': 'מינימליסטי',
  'bold': 'נועז',
  'gradient': 'גרדיאנט',
  'dark-luxury': 'יוקרה כהה',
  'frame': 'ממוסגר',
  'split': 'מפוצל',
  'story': 'סיפור',
  'quote': 'ציטוט',
  'numbered': 'ממוספר',
  'magazine': 'מגזין',
  'waves': 'גלים',
  'neon': 'ניאון',
  'image-split': 'חצי תמונה',
  'image-full-dark': 'תמונת רקע כהה',
  'image-circle-profile': 'תמונת פרופיל',
  'image-split-bottom': 'פיצול תחתון',
  'image-polaroid': 'פולארויד',
  'image-side': 'חצי רוחב',
  'image-magazine': 'שער מגזין',
  'image-overlay': 'תמונה עם שכבה',
  'image-arch': 'מסגרת קשת',
  'image-dual-split': 'פיצול 2 תמונות',
  'image-compare': 'השוואה לפני/אחרי',
  'image-grid-2': 'גריד 2 תמונות',
};

function buildToolDeclarations(): FunctionDeclaration[] {
  return [
    {
      name: 'update_slide_text',
      description:
        'Update the Hebrew text of one slide (0-based index). Use for rewrite/shorten/tone changes on a single slide.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          slideIndex: {
            type: SchemaType.NUMBER,
            description: '0-based slide index',
          },
          newText: {
            type: SchemaType.STRING,
            description: 'New Hebrew text for the slide',
          },
        },
        required: ['slideIndex', 'newText'],
      },
    },
    {
      name: 'update_many_slide_texts',
      description:
        'Update Hebrew text on multiple slides at once. Prefer this when rewriting/shortening the whole carousel.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          updates: {
            type: SchemaType.ARRAY,
            description: 'List of slide text updates',
            items: {
              type: SchemaType.OBJECT,
              properties: {
                slideIndex: { type: SchemaType.NUMBER },
                newText: { type: SchemaType.STRING },
              },
              required: ['slideIndex', 'newText'],
            },
          },
        },
        required: ['updates'],
      },
    },
    {
      name: 'change_template',
      description:
        'Change visual template for one slide (slideIndex) or all slides (omit slideIndex).',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          templateId: {
            type: SchemaType.STRING,
            description: `Template id. One of: ${TEMPLATE_IDS}`,
          },
          slideIndex: {
            type: SchemaType.NUMBER,
            description: 'Optional 0-based slide index',
          },
        },
        required: ['templateId'],
      },
    },
    {
      name: 'change_font',
      description: 'Change the global font for all slides.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          fontFamily: {
            type: SchemaType.STRING,
            description: `Font family. One of: ${FONT_IDS}`,
          },
        },
        required: ['fontFamily'],
      },
    },
    {
      name: 'update_colors',
      description: 'Update brand accent color and light/dark theme.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          brandColor: {
            type: SchemaType.STRING,
            description: 'Hex color, e.g. #2563eb',
          },
          theme: {
            type: SchemaType.STRING,
            description: "Either 'light' or 'dark'",
          },
        },
        required: ['brandColor', 'theme'],
      },
    },
    {
      name: 'set_image_transform',
      description:
        'Adjust image framing on a slide: zoom in/out (scale 0.5 to 2.5), pan/crop offsets, shape (circle, ellipse, rounded, arch, rect), top crop percentage, and visual vibe.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          slideIndex: {
            type: SchemaType.NUMBER,
            description: '0-based slide index',
          },
          scale: {
            type: SchemaType.NUMBER,
            description: 'Zoom scale: 1.0 default, 1.3 is zoom in (+30%), 0.8 is zoom out (-20%)',
          },
          cropTopPercent: {
            type: SchemaType.NUMBER,
            description: 'Percentage to crop from the top (e.g. 20 for cutting 20% off top)',
          },
          shape: {
            type: SchemaType.STRING,
            description: "Shape mask. One of: 'rect', 'circle', 'ellipse', 'rounded', 'arch'",
          },
          vibe: {
            type: SchemaType.STRING,
            description: "Atmosphere vibe effect. One of: 'none', 'luxury', 'glow', 'tech', 'warm', 'dynamic'",
          },
          offsetX: {
            type: SchemaType.NUMBER,
            description: 'Horizontal pan offset in percent (-50 to 50)',
          },
          offsetY: {
            type: SchemaType.NUMBER,
            description: 'Vertical pan offset in percent (-50 to 50)',
          },
        },
        required: ['slideIndex'],
      },
    },
    {
      name: 'set_layout_preset',
      description:
        'Apply a carousel image-layout preset that decides which slides use image templates.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          presetId: {
            type: SchemaType.STRING,
            description: `One of: ${LAYOUT_PRESETS}`,
          },
        },
        required: ['presetId'],
      },
    },
    {
      name: 'add_slide',
      description: 'Insert a new slide after a given index (or at the end).',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          afterIndex: {
            type: SchemaType.NUMBER,
            description: '0-based index; new slide is inserted after it',
          },
          text: {
            type: SchemaType.STRING,
            description: 'Optional Hebrew text for the new slide',
          },
        },
        required: [],
      },
    },
    {
      name: 'remove_slide',
      description: 'Remove a slide by 0-based index. Cannot remove the last remaining slide.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          slideIndex: { type: SchemaType.NUMBER },
        },
        required: ['slideIndex'],
      },
    },
    {
      name: 'reorder_slide',
      description: 'Move a slide from one index to another.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          fromIndex: { type: SchemaType.NUMBER },
          toIndex: { type: SchemaType.NUMBER },
        },
        required: ['fromIndex', 'toIndex'],
      },
    },
    {
      name: 'generate_slide_image',
      description:
        'Generate an AI image for a specific slide based on a concept or visual description.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          slideIndex: {
            type: SchemaType.NUMBER,
            description: '0-based slide index',
          },
          prompt: {
            type: SchemaType.STRING,
            description:
              'Visual description of the desired image (e.g. "a modern entrepreneur in a coffee shop")',
          },
        },
        required: ['slideIndex', 'prompt'],
      },
    },
    {
      name: 'set_active_slide',
      description: 'Focus the UI on a specific slide (0-based index).',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          slideIndex: { type: SchemaType.NUMBER },
        },
        required: ['slideIndex'],
      },
    },
    {
      name: 'set_slide_typography',
      description:
        'Adjust font size and vertical text position for one slide.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          slideIndex: { type: SchemaType.NUMBER },
          fontSize: {
            type: SchemaType.NUMBER,
            description: 'Font size in px, typically 48–120',
          },
          textY: {
            type: SchemaType.NUMBER,
            description: 'Vertical position percent, typically 20–80',
          },
        },
        required: ['slideIndex'],
      },
    },
  ];
}

function formatDetailedActionSummary(
  actions: { name: string; args: Record<string, unknown> }[]
): string[] {
  const details: string[] = [];
  for (const a of actions) {
    const sIdx = typeof a.args.slideIndex === 'number' ? a.args.slideIndex + 1 : null;
    switch (a.name) {
      case 'update_slide_text': {
        const txt = typeof a.args.newText === 'string' ? a.args.newText.trim() : '';
        const preview = txt.length > 60 ? txt.slice(0, 57) + '…' : txt;
        details.push(`שקף ${sIdx ?? 1}: שוכתב הטקסט ל-«${preview}»`);
        break;
      }
      case 'update_many_slide_texts': {
        const count = Array.isArray(a.args.updates) ? a.args.updates.length : 0;
        details.push(`עודכנו ושוכתבו הטקסטים ב-${count} שקפים בהתאם להוראה`);
        break;
      }
      case 'change_template': {
        const tplName = TEMPLATE_HEBREW_NAMES[String(a.args.templateId)] || a.args.templateId;
        if (sIdx != null) {
          details.push(`שקף ${sIdx}: שונתה התבנית הויזואלית ל-'${tplName}'`);
        } else {
          details.push(`כל השקפים: שונתה התבנית הויזואלית ל-'${tplName}'`);
        }
        break;
      }
      case 'change_font': {
        details.push(`עודכן הגופן הראשי ל-'${a.args.fontFamily}'`);
        break;
      }
      case 'update_colors': {
        const themeLabel = a.args.theme === 'dark' ? 'עיצוב כהה' : 'עיצוב בהיר';
        details.push(`עודכנו צבע המותג (${a.args.brandColor}) ומצב התצוגה (${themeLabel})`);
        break;
      }
      case 'set_image_transform': {
        const parts: string[] = [];
        if (typeof a.args.scale === 'number') {
          const pct = Math.round(Number(a.args.scale) * 100);
          if (pct > 100) parts.push(`קירוב תמונה (זום ${pct}%)`);
          else if (pct < 100) parts.push(`הרחקת תמונה (זום ${pct}%)`);
          else parts.push(`איפוס זום ל-100%`);
        }
        if (typeof a.args.cropTopPercent === 'number' && Number(a.args.cropTopPercent) > 0) {
          parts.push(`חיתוך ${a.args.cropTopPercent}% מהחלק העליון`);
        }
        if (a.args.shape) {
          const shapeHebrew: Record<string, string> = {
            circle: 'עיגול', ellipse: 'אליפסה', rounded: 'מסגרת מעוגלת', arch: 'קשת', rect: 'מלבן'
          };
          parts.push(`שיבוץ בצורת ${shapeHebrew[String(a.args.shape)] || a.args.shape}`);
        }
        if (a.args.vibe && a.args.vibe !== 'none') {
          const vibeHebrew: Record<string, string> = {
            luxury: 'יוקרתי ומנצנץ', glow: 'הילה זוהרת', tech: 'הייטק עתידני', warm: 'שקיעה חמימה', dynamic: 'דינמי'
          };
          parts.push(`החלת וייב '${vibeHebrew[String(a.args.vibe)] || a.args.vibe}'`);
        }
        if (typeof a.args.offsetX === 'number' || typeof a.args.offsetY === 'number') {
          parts.push(`כיוונון מיקום וחיתוך`);
        }
        details.push(`שקף ${sIdx ?? 1}: ${parts.length ? parts.join(', ') : 'התאמת הגדרות תמונה'}`);
        break;
      }
      case 'generate_slide_image': {
        const desc = a.args?.prompt ? ` לפי תיאור: "${a.args.prompt}"` : '';
        details.push(`יצירת תמונת AI לשקף ${sIdx ?? 1}${desc}`);
        break;
      }
      case 'add_slide': {
        details.push(`נוסף שקף חדש לקרוסלה`);
        break;
      }
      case 'remove_slide': {
        details.push(`הוסר שקף ${sIdx ?? 1}`);
        break;
      }
      case 'reorder_slide': {
        const from = Number(a.args.fromIndex) + 1;
        const to = Number(a.args.toIndex) + 1;
        details.push(`סדר שקפים עודכן: שקף ${from} הועבר למיקום ${to}`);
        break;
      }
      case 'set_slide_typography': {
        details.push(`שקף ${sIdx ?? 1}: כוונון גודל גופן ומיקום אנכי`);
        break;
      }
      case 'set_layout_preset': {
        details.push(`הוחלפה פריסת התמונות בקרוסלה`);
        break;
      }
      default: {
        details.push(`בוצעה פעולה: ${a.name}`);
      }
    }
  }
  return details;
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    const rateLimited = await enforceRateLimit({
      bucket: 'copilot',
      subject: rateLimitSubjectFromRequest(auth.user.email, req),
    });
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { command, currentState } = body;

    if (!command || !currentState) {
      return NextResponse.json(
        { error: 'Missing command or state' },
        { status: 400 }
      );
    }

    const slideCount = Array.isArray(currentState.slides)
      ? currentState.slides.length
      : 0;
    const activeSlideIndex =
      typeof currentState.activeSlideIndex === 'number'
        ? currentState.activeSlideIndex
        : 0;

    const systemInstruction = `אתה עוזר העריכה והקריאייטיב של CaruselAI — קרוסלות אינסטגרם/לינקדאין בעברית.
תפקידך: להבין במדויק את בקשת המשתמש ולהפעיל את הכלים המתאימים ביותר.
חשוב מאוד:
1. אל תענה לעולם בתשובות גנריות קצרות כמו "ביצעתי את השינויים".
2. הסבר בקצרה מה הבנת מהבקשה ומה הצעד שנקטת.
3. אינדקסי שקפים הם 0-based בכלים. כשהמשתמש אומר «שקף 1» הכוונה לאינדקס 0.
4. השקף הפעיל כרגע: ${activeSlideIndex + 1} (אינדקס ${activeSlideIndex}). סה״כ ${slideCount} שקפים.
5. לשליטה בתמונה (זום, חיתוך עליון, צורה כגון עיגול/אליפסה, וייב כגון יוקרתי/הייטק) — השתמש ב־set_image_transform.
6. תבניות מרובות תמונות זמינות: image-dual-split (פיצול 2 תמונות), image-compare (השוואה לפני/אחרי), image-grid-2 (גריד 2 תמונות).
7. לשינוי טקסט בשקף בודד: update_slide_text. לשכתוב מרובה שקפים: update_many_slide_texts.
מצב נוכחי של הקרוסלה: ${JSON.stringify(currentState)}`;

    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.8-flash'];
    let response: any = null;
    let lastError: any = null;

    for (const m of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: m,
          tools: [{ functionDeclarations: buildToolDeclarations() }],
          systemInstruction,
        });
        const result = await model.generateContent(command);
        response = result.response;
        break;
      } catch (err: any) {
        console.warn(`Copilot model ${m} failed: ${err?.message || err}. Trying next...`);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error('All models failed');
    }

    const actions: { name: string; args: Record<string, unknown> }[] = [];
    const calls = response.functionCalls();

    if (calls) {
      for (const call of calls) {
        actions.push({
          name: call.name,
          args: (call.args || {}) as Record<string, unknown>,
        });
      }
    }

    // Build comprehensive Hebrew response details
    const actionDetails = formatDetailedActionSummary(actions);
    let summaryText = '';
    if (actionDetails.length > 0) {
      summaryText = actionDetails.map((item) => `✓ ${item}`).join('\n');
    }

    let modelThought = '';
    try {
      const respText = response.text()?.trim();
      if (respText && respText !== 'ביצעתי את השינויים.') {
        modelThought = respText;
      }
    } catch {
      // Gemini throws when only tool calls are returned
    }

    let text = '';
    if (actions.length > 0) {
      if (modelThought) {
        text = `${modelThought}\n\nפעולות שבוצעו בפועל:\n${summaryText}`;
      } else {
        text = `הבנתי את הבקשה. להלן הפעולות שבוצעו במדויק:\n${summaryText}`;
      }
    } else if (modelThought) {
      text = modelThought;
    } else {
      text = 'לא זוהתה פעולה לביצוע. אפשר לבקש למשל: «קצר את שקף 2», «קרב את התמונה ל-130%», «שנה לצורת עיגול» או «החלף תבנית ליוקרתי».';
    }

    return NextResponse.json({
      text,
      actions,
      summary: summaryText,
    });
  } catch (error: any) {
    console.error('Copilot error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process copilot command' },
      { status: 500 }
    );
  }
}
