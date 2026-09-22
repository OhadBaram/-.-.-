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
  'minimal, bold, gradient, dark-luxury, frame, split, story, quote, numbered, magazine, waves, neon, image-split, image-full-dark, image-circle-profile, image-split-bottom, image-polaroid, image-side, image-magazine, image-overlay, image-arch';

const FONT_IDS =
  'Heebo, Assistant, Rubik, Varela Round, Playpen Sans Hebrew, Gveret Levin, Solitreo, Fredoka';

const LAYOUT_PRESETS = 'first-and-last, first-only, all-images, no-images';

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

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      tools: [{ functionDeclarations: buildToolDeclarations() }],
      systemInstruction: `אתה עוזר העריכה של CaruselAI — קרוסלות אינסטגרם/לינקדאין בעברית.
תפקידך: להבין בקשות בעברית ולהפעיל כלים כדי לשנות את הקרוסלה.
כל תשובת טקסט למשתמש — בעברית בלבד, קצרה וידידותית (מה שינית).
כללות:
- אינדקסי שקפים הם 0-based בכלים. כשהמשתמש אומר «שקף 1» הכוונה לאינדקס 0.
- השקף הפעיל כרגע: ${activeSlideIndex + 1} (אינדקס ${activeSlideIndex}). סה״כ ${slideCount} שקפים.
- כשמבקשים לקצר/לשכתב את כולם — השתמש ב־update_many_slide_texts עם טקסט חדש לכל שקף.
- כשמבקשים לשכתב שקף אחד — update_slide_text.
- אל תמציא תבניות/גופנים שלא ברשימה.
- אם הבקשה לא ברורה — שאל שאלה קצרה בעברית בלי לקרוא לכלים.
מצב נוכחי: ${JSON.stringify(currentState)}`,
    });

    const result = await model.generateContent(command);
    const response = result.response;

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

    let text = actions.length
      ? 'ביצעתי את השינויים.'
      : 'לא הבנתי לגמרי — נסו לנסח אחרת או לבחור אחת מההצעות למטה.';
    try {
      const respText = response.text();
      if (respText) text = respText;
    } catch {
      // Gemini throws when response is tool-only
    }

    return NextResponse.json({ text, actions });
  } catch (error) {
    console.error('Copilot error:', error);
    return NextResponse.json(
      { error: 'Failed to process copilot command' },
      { status: 500 }
    );
  }
}
