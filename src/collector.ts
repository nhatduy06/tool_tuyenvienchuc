import { createHash } from 'node:crypto';
import { config } from './config.js';
import { readFeed } from './feed-reader.js';
import { filterNotices } from './keyword-filter.js';
import { extractOfficialUrl } from './official-link-extractor.js';
import { getExistingAggregatorUrls, upsertNotice } from './supabase.js';
import { FeedNotice, RecruitmentNotice } from './types.js';

export function contentHash(title: string, publishedAt: string | null): string {
  return createHash('sha256').update(`${title}|${publishedAt ?? ''}`).digest('hex');
}

function toIsoDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toNotice(item: FeedNotice, officialUrl: string | null): RecruitmentNotice {
  const publishedAt = toIsoDate(item.pubDate);
  return { title: item.title, excerpt: item.description.slice(0, 2_000), aggregator_url: item.link, official_url: officialUrl, source_name: 'tuyencongchuc.vn', province: null, recruitment_type: 'viên chức giáo dục', published_at: publishedAt, content_hash: contentHash(item.title, publishedAt) };
}

export async function collect(dryRun = false): Promise<void> {
  const notices = await readFeed(config.feedUrl);
  const matched = filterNotices(notices, config.keywords);
  console.log(`Đọc ${notices.length} bài; đạt bộ lọc ${matched.length} bài.`);
  const existingUrls = dryRun ? new Set<string>() : await getExistingAggregatorUrls(matched.map((item) => item.link));
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  for (const item of matched) {
    try {
      const officialUrl = await extractOfficialUrl(item.link);
      const notice = toNotice(item, officialUrl);
      if (dryRun) {
        console.log(`[DRY-RUN] ${notice.title}\n  RSS: ${notice.aggregator_url}\n  Official: ${notice.official_url ?? '(không xác định)'}`);
      } else {
        await upsertNotice(notice);
        if (existingUrls.has(notice.aggregator_url)) updated += 1;
        else inserted += 1;
      }
    } catch (error) {
      errors += 1;
      console.error(`Lỗi xử lý "${item.title}":`, error);
    }
  }
  if (dryRun) inserted = matched.length;
  console.log(`Kết quả: bài mới ${inserted}; cập nhật ${updated}; lỗi ${errors}; chế độ ${dryRun ? 'dry-run' : 'ghi Supabase'}.`);
  if (errors > 0 && !dryRun) throw new Error(`${errors} bài không xử lý được.`);
}
