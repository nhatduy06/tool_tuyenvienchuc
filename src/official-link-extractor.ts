import * as cheerio from 'cheerio';
import { TIMEOUT_MS, USER_AGENT } from './feed-reader.js';

const robotsCache = new Map<string, boolean>();

async function allowedByRobots(url: string): Promise<boolean> {
  const origin = new URL(url).origin;
  if (robotsCache.has(origin)) return robotsCache.get(origin)!;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const response = await fetch(`${origin}/robots.txt`, { signal: controller.signal, headers: { 'User-Agent': USER_AGENT } });
    clearTimeout(timer);
    if (!response.ok) return true;
    const robots = (await response.text()).toLowerCase();
    const disallowed = robots.split(/\r?\n/).some((line) => /^\s*disallow:\s*\/\s*$/.test(line));
    const allowed = !disallowed;
    robotsCache.set(origin, allowed);
    return allowed;
  } catch {
    return false;
  }
}

function isCandidate(url: string, text: string): boolean {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();
  const label = `${host} ${text}`.toLocaleLowerCase('vi-VN');
  return host.endsWith('.gov.vn') || host.endsWith('.edu.vn') || host.includes('moet.gov.vn') || host.includes('ubnd') || /\.pdf(?:$|[?#])/.test(parsed.pathname.toLowerCase()) || label.includes('sở giáo dục') || label.includes('so giao duc');
}

export async function extractOfficialUrl(aggregatorUrl: string): Promise<string | null> {
  if (!(await allowedByRobots(aggregatorUrl))) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(aggregatorUrl, { signal: controller.signal, headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok || !(response.headers.get('content-type') ?? '').includes('text/html')) return null;
    const html = await response.text();
    const $ = cheerio.load(html);
    for (const element of $('a[href]').toArray()) {
      const href = $(element).attr('href');
      if (!href) continue;
      try {
        const candidate = new URL(href, aggregatorUrl).toString();
        if (candidate !== aggregatorUrl && isCandidate(candidate, $(element).text())) return candidate;
      } catch { /* Ignore malformed links. */ }
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
