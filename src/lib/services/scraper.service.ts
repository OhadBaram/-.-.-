export async function scrapeUrls(urls: string[]): Promise<string> {
  const urlsToScrape = urls.filter(Boolean);
  
  if (urlsToScrape.length === 0) {
    return '';
  }

  const scrapePromises = urlsToScrape.map(async (url) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000); 
    try {
      const res = await fetch(`https://r.jina.ai/${url}`, { 
        signal: controller.signal,
        next: { revalidate: 86400 } // Cache the scraped result for 24 hours
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      return `--- מידע מהקישור: ${url} ---\n${text.substring(0, 3000)}\n`;
    } catch (err) {
      console.error(`Failed to scrape ${url}:`, err);
      return '';
    } finally {
      clearTimeout(id);
    }
  });
  
  const results = await Promise.allSettled(scrapePromises);
  const scrapedContext = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map(r => r.value)
    .join('\n');

  return scrapedContext;
}
