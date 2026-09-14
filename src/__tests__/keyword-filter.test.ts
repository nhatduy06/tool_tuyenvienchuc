import { describe, expect, it } from 'vitest';
import { filterNotices, matchesNotice } from '../keyword-filter.js';

const item = (title: string, description = '') => ({ title, description, link: 'https://example.com/1' });

describe('keyword filter', () => {
  it('matches Vietnamese education keywords without accent sensitivity', () => {
    expect(matchesNotice(item('Tuyển giáo viên mầm non'), ['tuyển giáo viên'])).toBe(true);
    expect(matchesNotice(item('Thông báo tuyển dụng nhân sự'), ['tuyển giáo viên', 'trường học'])).toBe(false);
  });

  it('checks title and description', () => {
    expect(filterNotices([item('Thông báo mới', 'Phòng giáo dục thông báo')], ['phòng giáo dục'])).toHaveLength(1);
  });
});
