import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getTenantDB } from '@/lib/tenant-db';
import { generateCarouselSchema } from '@/lib/validations';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    
    const validatedFields = generateCarouselSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json({ error: 'Invalid input', details: validatedFields.error.format() }, { status: 400 });
    }
    
    const { topic, audience, goal, brand } = validatedFields.data;

    let aiProvider = process.env.DEFAULT_AI_PROVIDER || 'gemini';
    let aiModel = process.env.DEFAULT_AI_MODEL || 'gemini-1.5-flash';
    let workspaceId = null;
    let ws = null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { workspaces: { include: { workspace: true } } }
      });
      if (user && user.workspaces.length > 0) {
        ws = user.workspaces[0].workspace;
        workspaceId = ws.id;
        if (ws.aiProvider) aiProvider = ws.aiProvider;
        if (ws.aiModel) aiModel = ws.aiModel;
      }
    }

    let scrapedContext = '';
    let brandIdentityContext = '';

    if (ws) {
      if (ws.brandIdentity) {
        brandIdentityContext = `\nזהות המותג המוגדרת במערכת: ${ws.brandIdentity}\n`;
      }

      const urlsToScrape = [ws.websiteUrl, ws.referenceLink1, ws.referenceLink2, ws.referenceLink3].filter(Boolean) as string[];
      
      if (urlsToScrape.length > 0) {
        const scrapePromises = urlsToScrape.map(async (url) => {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 10000);
          try {
            const res = await fetch(`https://r.jina.ai/${url}`, { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            return `--- תוכן מתוך ${url} ---\n${text}\n`;
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
    }

    const prompt = `
אתה קופירייטר ומעצב קרוסלות לאינסטגרם.
צור קרוסלה בת 5 עד 7 שקפים עבור אינסטגרם בהתבסס על הנתונים הבאים:
נושא: ${topic}
קהל יעד: ${audience}
מטרה: ${goal}
זהות המותג: ${brand}
${brandIdentityContext}
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
