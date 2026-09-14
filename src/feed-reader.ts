import Parser from 'rss-parser';
import { FeedNotice } from './types.js';

const parser = new Parser();
const USER_AGENT = 'vienchuc247-notice-collector/1.0 (+https://github.com/)';
const TIMEOUT_MS = 15_000;

async function fetchWithRetry(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': USER_AGENT } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`Không tải được ${url}: ${String(lastError)}`);
}

export async function readFeed(feedUrl: string): Promise<FeedNotice[]> {
  const xml = await fetchWithRetry(feedUrl);
  const feed = await parser.parseString(xml);
  return feed.items.flatMap((item) => {
    const title = item.title?.trim();
    const link = item.link?.trim();
    if (!title || !link) return [];
    return [{ title, link, description: item.contentSnippet?.trim() || item.content?.trim() || item.summary?.trim() || '', pubDate: item.pubDate }];
  });
}

export { USER_AGENT, TIMEOUT_MS };
