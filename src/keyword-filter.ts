import { FeedNotice } from './types.js';

function normalize(value: string): string {
  return value.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

export function matchesNotice(notice: FeedNotice, keywords: string[]): boolean {
  const haystack = normalize(`${notice.title} ${notice.description}`);
  return keywords.some((keyword) => haystack.includes(normalize(keyword)));
}

export function filterNotices(notices: FeedNotice[], keywords: string[]): FeedNotice[] {
  return notices.filter((notice) => matchesNotice(notice, keywords));
}
