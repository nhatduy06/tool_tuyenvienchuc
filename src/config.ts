import 'dotenv/config';
import { z } from 'zod';

// Ghi nguồn bắt buộc theo yêu cầu của trang gốc:
// "Chuyên trang đăng tải thông báo tuyển dụng công chức, viên chức của các cơ quan nhà nước -
// Ghi rõ nguồn "www.tuyencongchuc.vn" khi phát hành lại thông tin từ website này."
export const SOURCE_NAME = 'www.tuyencongchuc.vn';
export const SOURCE_FEED_URL = 'https://tuyencongchuc.vn/feed/';

export const DEFAULT_KEYWORDS = [
  'tuyển giáo viên', 'giáo viên', 'viên chức giáo dục', 'giáo viên mầm non',
  'giáo viên tiểu học', 'giáo viên THCS', 'giáo viên THPT',
  'nhân viên trường học', 'hợp đồng giáo viên', 'tuyển dụng giáo dục',
  'trường học', 'sở giáo dục', 'phòng giáo dục'
];

const envSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RSS_FEED_URL: z.string().url().default(SOURCE_FEED_URL),
  NOTICE_KEYWORDS: z.string().optional()
});

const env = envSchema.parse(process.env);
const configuredKeywords = env.NOTICE_KEYWORDS?.split(',').map((keyword) => keyword.trim()).filter(Boolean) ?? [];

export const config = {
  feedUrl: env.RSS_FEED_URL,
  supabaseUrl: env.SUPABASE_URL,
  supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  keywords: configuredKeywords.length > 0 ? configuredKeywords : DEFAULT_KEYWORDS
};

export function assertSupabaseConfig(): { url: string; key: string } {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.');
  }
  return { url: config.supabaseUrl, key: config.supabaseServiceRoleKey };
}
