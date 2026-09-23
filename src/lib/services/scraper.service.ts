import {
  buildFetchedScrapeResult,
  buildInstagramSkipResult,
  formatScrapeResultsForPrompt,
  type ScrapeUrlResult,
} from '@/lib/scrape-result';
import {
  classifyReferenceLink,
  extractInstagramUsername,
  extractYouTubeVideoId,
  hostFromUrl,
  trimUrl,
} from '@/lib/reference-links';

/**
 * משיכת מידע מסרטון יוטיוב (oEmbed רשמי + דף הווידאו לחילוץ תיאור מלא, כותרת, ערוץ ומילות מפתח)
 */
async function scrapeYouTube(url: string): Promise<ScrapeUrlResult> {
  const hostname = hostFromUrl(url) || 'youtube.com';
  const videoId = extractYouTubeVideoId(url);
  let title = '';
  let author = '';
  let description = '';

  // 1. YouTube official oEmbed API
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      title = (data.title || '').trim();
      author = (data.author_name || '').trim();
    }
  } catch (err) {
    console.warn('YouTube oEmbed error:', err);
  }

  // 2. Direct page fetch for rich description & keywords
  if (videoId) {
    try {
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'he,en;q=0.9',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (pageRes.ok) {
        const html = await pageRes.text();
        const shortDescMatch = html.match(/"shortDescription":"([^"]+)"/);
        if (shortDescMatch && shortDescMatch[1]) {
          description = shortDescMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\"/g, '"')
            .trim();
        }
        if (!title) {
          const titleMatch = html.match(/<title>([^<]+)<\/title>/);
          if (titleMatch) {
            title = titleMatch[1].replace(/ - YouTube$/, '').trim();
          }
        }
      }
    } catch (err) {
      console.warn('YouTube page fetch error:', err);
    }
  }

  if (!title && !description) {
    return buildFetchedScrapeResult(url, '');
  }

  const promptSections = [
    `=== תוכן ומסרים מסרטון יוטיוב שצורף (${url}) ===`,
    title ? `כותרת הסרטון: ${title}` : '',
    author ? `ערוץ יוטיוב / יוצר: ${author}` : '',
    description ? `תיאור הסרטון ונקודות תוכן מרכזיות:\n${description.slice(0, 3000)}` : '',
    `הנחיה לקרוסלה: המשתמש צירף סרטון יוטיוב זה כבסיס לקרוסלה. יש לבנות את שקפי הקרוסלה ישירות סביב הרעיונות, הטיפים והתובנות של סרטון זה!`,
  ].filter(Boolean);

  const promptText = promptSections.join('\n\n') + '\n';
  return {
    url,
    kind: 'youtube',
    hostname,
    status: 'success',
    promptText,
    contentChars: (title + description).length,
    signals: [title, author].filter(Boolean) as string[],
    instagramUsername: null,
    statusLabelHe: 'זוהה סרטון יוטיוב',
    detailHe: `נשלף תוכן מלא מסרטון יוטיוב: "${title || author || url}"`,
  };
}

/**
 * משיכת מידע מטיקטוק (oEmbed רשמי + מטא תגיות)
 */
async function scrapeTikTok(url: string): Promise<ScrapeUrlResult> {
  const hostname = hostFromUrl(url) || 'tiktok.com';
  let title = '';
  let author = '';

  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      title = (data.title || '').trim();
      author = (data.author_name || '').trim();
    }
  } catch (err) {
    console.warn('TikTok oEmbed error:', err);
  }

  if (!title && !author) {
    return buildFetchedScrapeResult(url, '');
  }

  const promptSections = [
    `=== תוכן מסרטון טיקטוק שצורף (${url}) ===`,
    title ? `כותרת וכיתוב הסרטון: ${title}` : '',
    author ? `יוצר/ת בטיקטוק: ${author}` : '',
    `הנחיה לקרוסלה: התבסס על המסר והנושא המרכזי של סרטון הטיקטוק בעיצוב שקפי הקרוסלה.`,
  ].filter(Boolean);

  return {
    url,
    kind: 'tiktok',
    hostname,
    status: 'success',
    promptText: promptSections.join('\n\n') + '\n',
    contentChars: (title + author).length,
    signals: [title, author].filter(Boolean) as string[],
    instagramUsername: null,
    statusLabelHe: 'זוהה סרטון טיקטוק',
    detailHe: `נשלף תוכן מטיקטוק: "${title.slice(0, 50) || author || url}"`,
  };
}

/**
 * משיכת מידע מטוויטר / רשת X
 */
async function scrapeTwitter(url: string): Promise<ScrapeUrlResult> {
  const hostname = hostFromUrl(url) || 'x.com';
  let tweetText = '';
  let author = '';

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const html = await res.text();
      const ogTitle = html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1];
      const ogDesc = html.match(/property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1];
      tweetText = ogDesc || '';
      author = ogTitle || '';
    }
  } catch (err) {
    console.warn('Twitter scrape error:', err);
  }

  if (!tweetText && !author) {
    return buildFetchedScrapeResult(url, '');
  }

  const promptText = `=== תוכן מרשת X (טוויטר) המצורף (${url}) ===\n${author ? `כותב/ת: ${author}\n` : ''}${tweetText ? `טקסט הציוץ:\n${tweetText}\n` : ''}\nהנחיה לקרוסלה: פתח את הרעיון והמסר מהציוץ לקרוסלה שלמה ומעמיקה.\n`;

  return {
    url,
    kind: 'twitter',
    hostname,
    status: 'success',
    promptText,
    contentChars: (tweetText + author).length,
    signals: [author, tweetText.slice(0, 60)].filter(Boolean) as string[],
    instagramUsername: null,
    statusLabelHe: 'זוהה פוסט מרשת X',
    detailHe: `נשלף תוכן מרשת X: "${tweetText.slice(0, 50) || author}"`,
  };
}

/**
 * משיכת מידע מפייסבוק
 */
async function scrapeFacebook(url: string): Promise<ScrapeUrlResult> {
  const hostname = hostFromUrl(url) || 'facebook.com';
  let title = '';
  let desc = '';

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const html = await res.text();
      title = html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1] || '';
      desc = html.match(/property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1] || '';
    }
  } catch (err) {
    console.warn('Facebook scrape error:', err);
  }

  if (!title && !desc) {
    return buildFetchedScrapeResult(url, '');
  }

  const promptText = `=== תוכן מפייסבוק המצורף (${url}) ===\n${title ? `כותרת: ${title}\n` : ''}${desc ? `תיאור:\n${desc}\n` : ''}\n`;
  return {
    url,
    kind: 'facebook',
    hostname,
    status: 'success',
    promptText,
    contentChars: (title + desc).length,
    signals: [title, desc.slice(0, 60)].filter(Boolean) as string[],
    instagramUsername: null,
    statusLabelHe: 'זוהה פוסט מפייסבוק',
    detailHe: `נשלף תוכן מפייסבוק: "${title || desc.slice(0, 50)}"`,
  };
}

/**
 * משיכת מידע מאינסטגרם — מנסה מטא תגיות ציבוריות וחוזר לחילוץ שם משתמש אם חסום
 */
async function scrapeInstagram(url: string): Promise<ScrapeUrlResult> {
  const username = extractInstagramUsername(url);
  const hostname = hostFromUrl(url) || 'instagram.com';
  let metaDesc = '';
  let metaTitle = '';

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'he,en;q=0.9',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const html = await res.text();
      metaTitle =
        html.match(/<meta\s+(?:name|property)=["'](?:title|og:title)["']\s+content=["']([^"']+)["']/i)?.[1] ||
        '';
      metaDesc =
        html.match(/<meta\s+(?:name|property)=["'](?:description|og:description)["']\s+content=["']([^"']+)["']/i)?.[1] ||
        '';
    }
  } catch (err) {
    console.warn('Instagram meta fetch error:', err);
  }

  if (metaDesc && metaDesc.length > 20 && !metaDesc.includes('Log In') && !metaDesc.includes('התחבר')) {
    const promptText = `=== תוכן מאינסטגרם (${url}) ===\n${username ? `חשבון: @${username}\n` : ''}${metaTitle ? `כותרת: ${metaTitle}\n` : ''}תיאור הפוסט/פרופיל:\n${metaDesc}\n`;
    return {
      url,
      kind: 'instagram',
      hostname,
      status: 'success',
      promptText,
      contentChars: metaDesc.length,
      signals: [username ? `@${username}` : '', metaDesc.slice(0, 60)].filter(Boolean) as string[],
      instagramUsername: username,
      statusLabelHe: 'זוהה תוכן אינסטגרם',
      detailHe: `נשלף תוכן מאינסטגרם: "${metaDesc.slice(0, 50)}…"`,
    };
  }

  // Fallback to username skip result
  return buildInstagramSkipResult(url);
}

/**
 * משיכת מידע מאתר אינטרנט כללי — שילוב מהיר של קריאת HTML ישירה וגיבוי Jina
 */
async function scrapeWebsite(url: string): Promise<ScrapeUrlResult> {
  // 1. Direct fetch with HTML text extraction (fast ~300ms)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const res = await fetch(withProto, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

      const descMatch =
        html.match(/<meta\s+(?:name|property)=["'](?:description|og:description)["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<meta\s+content=["']([^"']+)["']\s+(?:name|property)=["'](?:description|og:description)["']/i);
      const description = descMatch ? descMatch[1].replace(/\s+/g, ' ').trim() : '';

      const body = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

      const combined = [
        title ? `כותרת האתר: ${title}` : '',
        description ? `תיאור האתר: ${description}` : '',
        body ? `תוכן מרכזי מהאתר:\n${body.slice(0, 3000)}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      if (combined.length >= 100) {
        return buildFetchedScrapeResult(url, combined);
      }
    }
  } catch (directErr) {
    console.warn(`Direct website fetch failed for ${url}:`, directErr);
  }

  // 2. Fallback to Jina AI
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 7000);
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const res = await fetch(`https://r.jina.ai/${withProto}`, {
      signal: controller.signal,
    });
    clearTimeout(id);
    if (res.ok) {
      const text = await res.text();
      return buildFetchedScrapeResult(url, text || '');
    }
  } catch (jinaErr) {
    console.warn(`Jina fetch failed for ${url}:`, jinaErr);
  }

  return buildFetchedScrapeResult(url, '');
}

/**
 * סריקה מובנית לכל כתובת — תמיכה מלאה בכל הפלטפורמות החברתיות ואתרי אינטרנט.
 */
export async function scrapeUrlsDetailed(
  urls: Array<string | null | undefined>
): Promise<ScrapeUrlResult[]> {
  const urlsToScrape = urls.map(trimUrl).filter(Boolean) as string[];
  if (urlsToScrape.length === 0) return [];

  const tasks = urlsToScrape.map(async (url): Promise<ScrapeUrlResult> => {
    const kind = classifyReferenceLink(url);
    switch (kind) {
      case 'youtube':
        return scrapeYouTube(url);
      case 'tiktok':
        return scrapeTikTok(url);
      case 'twitter':
        return scrapeTwitter(url);
      case 'facebook':
        return scrapeFacebook(url);
      case 'instagram':
        return scrapeInstagram(url);
      case 'website':
      default:
        return scrapeWebsite(url);
    }
  });

  return Promise.all(tasks);
}

/**
 * תאימות לאחור: מחרוזת אחת לפרומפט.
 */
export async function scrapeUrls(urls: string[]): Promise<string> {
  const results = await scrapeUrlsDetailed(urls);
  return formatScrapeResultsForPrompt(results);
}
