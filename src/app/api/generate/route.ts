import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantDB } from '@/lib/tenant-db';
import { generateCarouselSchema } from '@/lib/validations';
import { generateJson } from '@/lib/services/ai.service';
import { scrapeUrls } from '@/lib/services/scraper.service';
import {
  buildDensityPrompt,
  buildStructurePrompt,
  buildTopicFidelityConstraint,
  buildVisualStylePrompt,
  type DensityId,
  type VisualStyleId,
  type WizardOptions,
} from '@/lib/wizard';
import { requireSession } from '@/lib/api/require-session';
import {
  enforceRateLimit,
  rateLimitSubjectFromRequest,
} from '@/lib/api/rate-limit';
import {
  applyPaletteColorsToSlides,
  resolveGenerationPalette,
  serializeBrandPalette,
} from '@/lib/brand-palette';

export const maxDuration = 60; // Allow function to run up to 60 seconds

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    const rateLimited = await enforceRateLimit({
      bucket: 'generate',
      subject: rateLimitSubjectFromRequest(auth.user.email, req),
    });
    if (rateLimited) return rateLimited;

    const session = auth.session;
    const body = await req.json();
    
    const validatedFields = generateCarouselSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json({ error: 'Invalid input', details: validatedFields.error.format() }, { status: 400 });
    }
    
    const {
      topic,
      audience,
      goal,
      brand,
      brandColors,
      slideCount,
      density,
      visualStyle,
      visualStyleCustom,
      useRecommendedStructure,
      narrativeDirection,
      publishTarget,
      flowVariant,
    } = validatedFields.data;
    const websiteUrl = body.websiteUrl || null;
    const referenceLink1 = body.referenceLink1 || null;
    const referenceLink2 = body.referenceLink2 || null;
    const referenceLink3 = body.referenceLink3 || null;

    const wizardOptions: WizardOptions = {
      slideCount: slideCount || 7,
      useRecommendedStructure: useRecommendedStructure ?? true,
      visualStyle: (visualStyle || 'minimal') as VisualStyleId,
      visualStyleCustom: visualStyleCustom || '',
      density: (density || 'standard') as DensityId,
      audience: audience || '',
      goal: goal || '',
    };
    const densityHint = buildDensityPrompt(wizardOptions.density);
    const visualHint = buildVisualStylePrompt(wizardOptions);
    const structureHint = buildStructurePrompt(
      wizardOptions.slideCount,
      wizardOptions.useRecommendedStructure,
      narrativeDirection
        ? {
            title: narrativeDirection.title,
            structureHint:
              narrativeDirection.structureHint ||
              narrativeDirection.summary ||
              '',
          }
        : null
    );

    let aiProvider = process.env.DEFAULT_AI_PROVIDER || 'gemini';
    let aiModel = process.env.DEFAULT_AI_MODEL || 'gemini-3.8-flash';
    let workspaceId = null;
    let ws: any = null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { workspaces: { include: { workspace: true } } }
      });
      if (user && user.workspaces.length > 0) {
        ws = user.workspaces[0].workspace;
        workspaceId = ws.id;
        if (ws.aiProvider) aiProvider = ws.aiProvider;
        if (ws.aiModel) {
          aiModel = ws.aiModel;
          if (aiModel === 'gemini-1.5-flash' || !aiModel) {
            aiModel = 'gemini-3.8-flash';
            aiProvider = 'gemini';
          }
        }
      }
    }

    let pastCarouselsContext = '';
    if (workspaceId && session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (user) {
        const { getWorkspaceUsage } = await import('@/lib/usage');
        const usage = await getWorkspaceUsage(workspaceId, user.id);
        if (!usage.canGenerate) {
          return NextResponse.json({ 
            error: `הגעת למגבלת היצירה החודשית שלך (${usage.limit} קרוסלות בחודש). אנא שדרג את החבילה שלך.` 
          }, { status: 402 });
        }
        
        try {
          const tenantDb = await getTenantDB(workspaceId, user.id, ['owner', 'admin', 'member']);
          const recentCarousels = await tenantDb.carousel.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10
          });
          const pastCarousels = recentCarousels.filter((c: any) => c.slidesData != null).slice(0, 3);
          if (pastCarousels.length > 0) {
            const formatted = pastCarousels.map((c: any, i: number) => {
              let slidesStr = '';
              try {
                if (Array.isArray(c.slidesData)) {
                  slidesStr = c.slidesData.map((s: any) => s.text).join(' | ');
                } else if (c.slidesData && Array.isArray((c.slidesData as any).slides)) {
                  slidesStr = (c.slidesData as any).slides.map((s: any) => s.text).join(' | ');
                }
              } catch(e){}
              return `Past Carousel ${i + 1} (Topic: ${c.topic || 'Unknown'}): [${slidesStr}]`;
            }).join('\n');
            
            pastCarouselsContext = `\nלהלן קרוסלות קודמות שהמשתמש יצר בעבר:\n${formatted}\nלמד מהסגנון והטון בלבד — אל תחליף את נושא הקרוסלה החדשה בנושאים ישנים. כמומחה שיווק, גוון זוויות ומסרים *בתוך* הנושא הנוכחי בלבד.\n`;
          }
        } catch (dbErr) {
          console.warn('Failed to fetch past carousels:', dbErr);
        }
      }
    }

    let brandIdentityContext = '';

    const finalWebsiteUrl = websiteUrl || ws?.websiteUrl;
    const finalRef1 = referenceLink1 || ws?.referenceLink1;
    const finalRef2 = referenceLink2 || ws?.referenceLink2;
    const finalRef3 = referenceLink3 || ws?.referenceLink3;
    const finalBrandIdentity = brand || ws?.brandIdentity;

    if (finalBrandIdentity) {
      brandIdentityContext = `\nזהות המותג המוגדרת במערכת: ${finalBrandIdentity}\n`;
    }

    const scrapedContext = await scrapeUrls([finalWebsiteUrl, finalRef1, finalRef2, finalRef3]);

    const count = wizardOptions.slideCount;
    const narrativeLine = narrativeDirection
      ? `כיוון נרטיבי שנבחר: ${narrativeDirection.title}${
          narrativeDirection.summary ? ` — ${narrativeDirection.summary}` : ''
        }`
      : 'כיוון נרטיבי: לא נבחר במפורש — בחר מבנה חזק לנושא.';

    const topicFidelity = buildTopicFidelityConstraint(topic);

    const resolvedPalette = resolveGenerationPalette({
      brandColors: brandColors ?? null,
      topic,
      visualStyle: wizardOptions.visualStyle,
    });
    const paletteJson = serializeBrandPalette(resolvedPalette);

    const prompt = `
אתה קופירייטר ומעצב קרוסלות לאינסטגרם בפורמט אנכי 1080×1350.
צור חבילת קרוסלה מלאה: שקפים + כיתוב פוסט + חבילת האשטאגים.
נושא / טקסט מקור: ${topic}
קהל יעד: ${audience || 'כללי'}
מטרה: ${goal || 'מתן ערך ומעורבות'}
זהות המותג / טון: ${brand || 'טבעי וברור בעברית'}
${narrativeLine}
${topicFidelity}
${brandIdentityContext}
${pastCarouselsContext}
${scrapedContext ? `\nלמד על סגנון המותג והטון מהתוכן הבא שנאסף מהרשת (אופציונלי). אל תחליף את נושא הקרוסלה בנושאים מהאתר — הנושא שסופק למעלה מנצח:\n${scrapedContext}\n` : ''}

הנחיות מבנה (חובה):
${structureHint}
- שער = הוק שעוצר גלילה — עדיין על הנושא המדויק שסופק
- כל שקף תוכן = רעיון אחד בלבד *בתוך* אותו נושא מדויק
- כלול שקף הוכחה כשיש מקום במבנה
- שקף אחרון = CTA ברור הקשור לאותו נושא/הצעה

הנחיות צפיפות מידע:
${densityHint}

הנחיות סגנון ויזואלי (צבעים וטון):
${visualHint}

פלטת מותג דינמית (חובה להשתמש בה — לא לבן/שחור שטוח):
${paletteJson}
- backgroundColor חייב להיות אחד מ־backgrounds בפלטה (או גוון קרוב מאוד אליו), מותאם לנושא.
- אסור להחזיר #ffffff / #000000 / #111827 כרקע ברירת מחדל כשיש גוונים צבעוניים בפלטה.
- textColor חייב להיות קריא מעל הרקע (כהה על רקע בהיר, בהיר על רקע כהה).
- האקסנטים מיועדים להדגשות/קווים — לא לרקע מלא אלא אם הסגנון דורש.

צור מערך באורך מדויק של ${count} שקפים בלבד — לא יותר ולא פחות.
עבור כל שקף, אנא ספק את הטקסט בעברית בלבד.
החזר JSON בלבד עם המפתחות:
1. "explanation": הסבר קצר בעברית (כ-3 משפטים) על האסטרטגיה והמבנה — וציין במפורש איך נשמרת נאמנות לנושא המדויק.
2. "slides": מערך השקפים. כל אובייקט:
   - id: מחרוזת מזהה (לדוגמה "1")
   - role: אחד מתוך cover | content | proof | cta (שקף ראשון cover, אחרון cta, הוכחה proof אם קיימת)
   - text: טקסט השקף בעברית לפי צפיפות המידע שנבחרה (נאמן לנושא המדויק)
   - backgroundColor: HEX מרקעי הפלטה / גוון צבעוני לפי הנושא (לא לבן שטוח)
   - textColor: HEX קריא מעל הרקע
3. "caption": כיתוב פוסט מלא בעברית (3–6 שורות), כולל פתיח, ערך קצר, וקריאה לפעולה — בלי האשטאגים בתוך הכיתוב; חייב לעסוק בנושא המדויק.
4. "hashtags": מערך של 8–15 האשטאגים רלוונטיים בעברית ו/או באנגלית (עם #), מותאמים לנושא המדויק (לא רק לקטגוריה הרחבה).
`;


    const parsedJson = await generateJson({ prompt, provider: aiProvider, model: aiModel });
    const rawSlides = Array.isArray(parsedJson) ? parsedJson : (parsedJson.slides || parsedJson);
    const slides = applyPaletteColorsToSlides(
      Array.isArray(rawSlides) ? rawSlides : [],
      resolvedPalette,
      wizardOptions.visualStyle === 'luxury'
    );
    const explanation = parsedJson.explanation || '';
    const caption =
      typeof parsedJson.caption === 'string' ? parsedJson.caption.trim() : '';
    const hashtags = Array.isArray(parsedJson.hashtags)
      ? parsedJson.hashtags
          .map((tag: unknown) => String(tag || '').trim())
          .filter(Boolean)
          .map((tag: string) => (tag.startsWith('#') ? tag : `#${tag}`))
      : [];

    const wizardMeta = {
      slideCount: wizardOptions.slideCount,
      density: wizardOptions.density,
      visualStyle: wizardOptions.visualStyle,
      visualStyleCustom: wizardOptions.visualStyleCustom || '',
      directionTitle: narrativeDirection?.title || null,
    };

    const packagePayload = {
      slides,
      caption,
      hashtags,
      wizardMeta,
      brandColors: resolvedPalette,
      narrativeDirection: narrativeDirection
        ? {
            id: narrativeDirection.id,
            title: narrativeDirection.title,
          }
        : null,
    };

    if (workspaceId && session?.user?.email) {
      try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) {
           const tenantDb = await getTenantDB(workspaceId, user.id, ['owner', 'admin', 'member']);
           await tenantDb.carousel.create({
             data: {
               title: topic,
               topic,
               targetAudience: audience ?? null,
               status: 'generated',
               slidesData: packagePayload,
               workspace: { connect: { id: workspaceId } },
             }
           });
        }
      } catch (dbError) {
        console.warn('Could not save to database', dbError);
      }
    }

    return NextResponse.json({
      slides,
      explanation,
      caption,
      hashtags,
      wizardMeta,
      brandColors: resolvedPalette,
      narrativeDirection: packagePayload.narrativeDirection,
      publishTarget,
      flowVariant,
    });
  } catch (error: unknown) {
    console.error('Error generating carousel:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate carousel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
