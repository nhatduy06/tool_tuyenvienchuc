import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { FeedNotice } from './types.js';

const parser = new Parser();
const USER_AGENT = 'vienchuc247-notice-collector/1.0 (+https://github.com/)';
const TIMEOUT_MS = 15_000;

const REQUEST_HEADERS = {
  'User-Agent': USER_AGENT,
  Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7',
  'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
  Referer: 'https://tuyencongchuc.vn/',
  'Cache-Control': 'no-cache'
};

async function fetchWithRetry(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: REQUEST_HEADERS });
      if (response.status === 403) {
        throw new Error('HTTP 403 (trang gốc từ chối truy cập tự động)');
      }
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

async function readRssFeed(feedUrl: string): Promise<FeedNotice[]> {
  const xml = await fetchWithRetry(feedUrl);
  const feed = await parser.parseString(xml);
  return feed.items.flatMap((item) => {
    const title = item.title?.trim();
    const link = item.link?.trim();
    if (!title || !link) return [];
    return [{ title, link, description: item.contentSnippet?.trim() || item.content?.trim() || item.summary?.trim() || '', pubDate: item.pubDate }];
  });
}

function textFromHtml(html: string | undefined): string {
  if (!html) return '';
  return cheerio.load(html).text().replace(/\s+/g, ' ').trim();
}

interface WpPost {
  date?: string;
  link?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
}

// WordPress trả `date` theo giờ địa phương của site (không kèm múi giờ).
// Site này đặt tại Việt Nam nên hiểu là Asia/Ho_Chi_Minh (UTC+7).
function normalizeWpDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (/([+-]\d{2}:?\d{2}|Z)$/.test(value)) return value;
  return `${value}+07:00`;
}

async function readWordPressApi(feedUrl: string): Promise<FeedNotice[]> {
  const apiUrl = `${new URL(feedUrl).origin}/wp-json/wp/v2/posts?per_page=20&_fields=date,link,title,excerpt`;
  const json = await fetchWithRetry(apiUrl);
  const posts = JSON.parse(json) as WpPost[];
  return posts.flatMap((post) => {
    const title = textFromHtml(post.title?.rendered);
    const link = post.link?.trim();
    if (!title || !link) return [];
    return [{ title, link, description: textFromHtml(post.excerpt?.rendered), pubDate: normalizeWpDate(post.date) }];
  });
}

export async function readFeed(feedUrl: string): Promise<FeedNotice[]> {
  try {
    return await readRssFeed(feedUrl);
  } catch (rssError) {
    console.warn(`RSS thất bại (${String(rssError)}), thử WordPress API dự phòng của cùng trang...`);
    return readWordPressApi(feedUrl);
  }
}

export { USER_AGENT, TIMEOUT_MS };
