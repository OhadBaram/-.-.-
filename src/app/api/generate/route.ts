import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getTenantDB } from '@/lib/tenant-db';
import { generateCarouselSchema } from '@/lib/validations';
import { generateJson } from '@/lib/services/ai.service';
import { scrapeUrls } from '@/lib/services/scraper.service';

export const maxDuration = 60; // Allow function to run up to 60 seconds

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    
    const validatedFields = generateCarouselSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json({ error: 'Invalid input', details: validatedFields.error.format() }, { status: 400 });
    }
    
    // Fallback schema for new fields if validations.ts hasn't been updated yet
    const { topic, audience, goal, brand } = validatedFields.data;
    const websiteUrl = body.websiteUrl || null;
    const referenceLink1 = body.referenceLink1 || null;
    const referenceLink2 = body.referenceLink2 || null;
    const referenceLink3 = body.referenceLink3 || null;

    let aiProvider = process.env.DEFAULT_AI_PROVIDER || 'openrouter';
    let aiModel = process.env.DEFAULT_AI_MODEL || 'google/gemini-2.5-flash';
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
          if (aiModel === 'gemini-1.5-flash') {
            aiModel = 'google/gemini-2.5-flash';
            aiProvider = 'openrouter';
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
            
            pastCarouselsContext = `\nלהלן קרוסלות קודמות שהמשתמש יצר בעבר:\n${formatted}\nלמד מהסגנון והנושאים שהמשתמש אוהב, אך כמומחה שיווק, הקפד *לגוון* את התוכן, הזוויות והמסרים בקרוסלה החדשה כדי שלא יהיו חזרתיים.\n`;
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

    const prompt = `
אתה קופירייטר ומעצב קרוסלות לאינסטגרם.
צור קרוסלה בת 5 עד 7 שקפים עבור אינסטגרם בהתבסס על הנתונים הבאים:
נושא: ${topic}
קהל יעד: ${audience}
מטרה: ${goal}
זהות המותג: ${brand}
${brandIdentityContext}
${pastCarouselsContext}
${scrapedContext ? `\nלמד על סגנון המותג, הנושאים והטון מהתוכן הבא שנאסף מהרשת (אופציונלי אך מומלץ להתבסס עליו):\n${scrapedContext}\n` : ''}
עבור כל שקף, אנא ספק את הטקסט בעברית בלבד. 
החזר את התשובה בפורמט JSON בלבד, המכיל מערך של אובייקטים או אובייקט JSON המכיל מפתח slides עם המערך (ללא טקסט נוסף).
כל אובייקט ייצג שקף ויכלול את השדות:
- id: מחרוזת מזהה (לדוגמה "1")
- text: טקסט השקף (קצר וקולע, מקסימום 15 מילים לשקף)
- backgroundColor: קוד צבע HEX (רך ונעים לעין שמתאים למותג)
- textColor: קוד צבע HEX (קריא ומתאים לרקע)
`;

    const parsedJson = await generateJson({ prompt, provider: aiProvider, model: aiModel });
    const slides = Array.isArray(parsedJson) ? parsedJson : (parsedJson.slides || parsedJson);

    if (workspaceId && session?.user?.email) {
      try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) {
           const tenantDb = await getTenantDB(workspaceId, user.id, ['owner', 'admin', 'member']);
           await tenantDb.carousel.create({
             data: {
               title: topic,
               topic,
               targetAudience: audience,
               status: 'generated',
               slidesData: slides,
             }
           });
        }
      } catch (dbError) {
        console.warn('Could not save to database', dbError);
      }
    }

    return NextResponse.json({ slides });
  } catch (error) {
    console.error('Error generating carousel:', error);
    return NextResponse.json({ error: 'Failed to generate carousel' }, { status: 500 });
  }
}
