import {
  buildFetchedScrapeResult,
  buildInstagramSkipResult,
  formatScrapeResultsForPrompt,
  shouldSkipFetch,
  type ScrapeUrlResult,
} from '@/lib/scrape-result';
import { trimUrl } from '@/lib/reference-links';

async function fetchViaJina(url: string): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(id);
  }
}

/**
 * סריקה מובנית לכל כתובת — כולל דילוג כנה על אינסטגרם.
 */
export async function scrapeUrlsDetailed(
  urls: Array<string | null | undefined>
): Promise<ScrapeUrlResult[]> {
  const urlsToScrape = urls.map(trimUrl).filter(Boolean) as string[];
  if (urlsToScrape.length === 0) return [];

  const tasks = urlsToScrape.map(async (url): Promise<ScrapeUrlResult> => {
    if (shouldSkipFetch(url)) {
      return buildInstagramSkipResult(url);
    }

    try {
      const text = await fetchViaJina(url);
      return buildFetchedScrapeResult(url, text || '');
    } catch (err) {
      console.error(`Failed to scrape ${url}:`, err);
      return buildFetchedScrapeResult(url, '');
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
