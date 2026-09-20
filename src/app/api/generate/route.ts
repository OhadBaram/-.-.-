import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getTenantDB } from '@/lib/tenant-db';
import { generateCarouselSchema } from '@/lib/validations';

export const maxDuration = 60; // Allow function to run up to 60 seconds

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key',
});

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

    let scrapedContext = '';
    let brandIdentityContext = '';

    const finalWebsiteUrl = websiteUrl || ws?.websiteUrl;
    const finalRef1 = referenceLink1 || ws?.referenceLink1;
    const finalRef2 = referenceLink2 || ws?.referenceLink2;
    const finalRef3 = referenceLink3 || ws?.referenceLink3;
    const finalBrandIdentity = brand || ws?.brandIdentity;

    if (finalBrandIdentity) {
      brandIdentityContext = `\nזהות המותג המוגדרת במערכת: ${finalBrandIdentity}\n`;
    }

    const urlsToScrape = [finalWebsiteUrl, finalRef1, finalRef2, finalRef3].filter(Boolean) as string[];
      
    if (urlsToScrape.length > 0) {
      const scrapePromises = urlsToScrape.map(async (url) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 25000); 
        try {
          const res = await fetch(`https://r.jina.ai/${url}`, { 
            signal: controller.signal,
            next: { revalidate: 86400 } // Cache the scraped result for 24 hours!
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          return `--- תוכן מתוך ${url} ---\n${text.substring(0, 3000)}\n`;
        } catch (err) {
          console.error(`Failed to scrape ${url}:`, err);
          return '';
        } finally {
          clearTimeout(id);
        }
      });
      
      const results = await Promise.allSettled(scrapePromises);
      scrapedContext = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map(r => r.value)
        .join('\n');
    }

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

    let text = '';

    if (aiProvider === 'openrouter') {
      if (!process.env.OPENROUTER_API_KEY) {
        return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 });
      }
      const completion = await openai.chat.completions.create({
        model: aiModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      text = completion.choices[0].message.content || '[]';
    } else {
      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
      }
      const model = genAI.getGenerativeModel({ 
        model: aiModel,
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      text = response.text();
    }
    
    // Clean up potential markdown wrapping
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let slides;
    try {
      const parsed = JSON.parse(text);
      slides = Array.isArray(parsed) ? parsed : (parsed.slides || parsed);
    } catch (e) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Invalid JSON format from AI');
    }

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
