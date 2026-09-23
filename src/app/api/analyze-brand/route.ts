import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateText } from '@/lib/services/ai.service';
import { scrapeUrlsDetailed } from '@/lib/services/scraper.service';
import { formatScrapeResultsForPrompt } from '@/lib/scrape-result';
import {
  buildBrandLearnedFacts,
  toLearningContextPayload,
} from '@/lib/brand-learned-summary';
import { requireSession } from '@/lib/api/require-session';
import {
  enforceRateLimit,
  rateLimitSubjectFromRequest,
} from '@/lib/api/rate-limit';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    const rateLimited = await enforceRateLimit({
      bucket: 'analyze',
      subject: rateLimitSubjectFromRequest(auth.user.email, req),
    });
    if (rateLimited) return rateLimited;

    const { websiteUrl, referenceLink1 } = await req.json();

    const scrapeReport = await scrapeUrlsDetailed([websiteUrl, referenceLink1]);
    const scrapedContext = formatScrapeResultsForPrompt(scrapeReport);

    const websiteResult = scrapeReport.find((r) => r.kind !== 'instagram');
    const igResults = scrapeReport.filter((r) => r.kind === 'instagram');

    if (
      !scrapedContext.trim() &&
      scrapeReport.every((r) => r.status === 'failed' || r.status === 'missing')
    ) {
      const emptyFacts = buildBrandLearnedFacts({
        websiteUrl,
        referenceLink1,
        scrapeReport,
      });
      return NextResponse.json({
        brandIdentity: 'לא הצלחנו למשוך מידע מהקישורים שהוזנו.',
        learningContext: toLearningContextPayload(emptyFacts),
        scrapeReport,
      });
    }

    const hasUsableSiteContent =
      websiteResult &&
      (websiteResult.status === 'success' || websiteResult.status === 'partial') &&
      websiteResult.promptText.trim().length > 0;

    let brandIdentity = '';

    if (hasUsableSiteContent) {
      const prompt = `
אתה מומחה מיתוג ושיווק. קיבלת מידע שנאסף מהאתר של עסק.
המטרה שלך היא לנתח את המידע ולכתוב סיכום מקצועי (זהות מותג) שישמש בינה מלאכותית אחרת כדי לכתוב עבורם פוסטים וקרוסלות בעתיד.

המידע שנאסף:
${scrapedContext}

הערות חשובות:
- קישורי אינסטגרם לא נקראים אוטומטית; אם מופיע רק שם משתמש — זה רמז חלש בלבד.
- אל תמציא פרטים שלא מופיעים בתוכן.

אנא כתוב סיכום של פסקה אחת עד שתיים בעברית הכולל:
1. מה העסק עושה ומי קהל היעד.
2. סגנון הכתיבה וטון הדיבור (לדוגמה: מקצועי, קליל, הומוריסטי, סמכותי).
3. מסרים מרכזיים או ערכים בולטים.

החזר רק את טקסט הסיכום, ללא כותרות וללא הקדמות.
    `;

      let aiModel = 'google/gemini-2.5-flash';
      let aiProvider = 'openrouter';
      try {
        const user = await prisma.user.findUnique({
          where: { email: auth.user.email },
          include: { workspaces: { include: { workspace: true } } },
        });
        if (user && user.workspaces.length > 0) {
          const ws = user.workspaces[0].workspace;
          if (ws.aiModel) {
            aiModel = ws.aiModel;
            if (aiModel === 'gemini-1.5-flash') {
              aiModel = 'google/gemini-2.5-flash';
            }
          }
          if (ws.aiProvider) {
            aiProvider = ws.aiProvider;
          }
        }
      } catch {
        /* fallback defaults */
      }

      brandIdentity = await generateText({
        prompt,
        provider: aiProvider,
        model: aiModel,
      });
    } else if (igResults.length > 0 && !websiteUrl) {
      const usernames = igResults
        .map((r) => r.instagramUsername)
        .filter(Boolean);
      brandIdentity = usernames.length
        ? `לא נשלף תוכן מפוסט אינסטגרם (לא נתמך אוטומטית). זוהה שם משתמש כרמז חלש: @${usernames.join(', @')}. השלימו ידנית מה העסק עושה, קהל היעד וטון הדיבור.`
        : 'לא נשלף תוכן מפוסט אינסטגרם (לא נתמך אוטומטית). השלימו ידנית מה העסק עושה, קהל היעד וטון הדיבור.';
    } else {
      brandIdentity = 'לא הצלחנו למשוך מידע מהקישורים שהוזנו.';
    }

    const facts = buildBrandLearnedFacts({
      websiteUrl,
      referenceLink1,
      brandIdentity,
      scrapeReport,
    });

    return NextResponse.json({
      brandIdentity,
      learningContext: toLearningContextPayload(facts),
      scrapeReport,
    });
  } catch (error) {
    console.error('Error analyzing brand:', error);
    return NextResponse.json({ error: 'Failed to analyze brand' }, { status: 500 });
  }
}
