import 'dotenv/config';
import { z } from 'zod';

export const DEFAULT_KEYWORDS = [
  'tuyển giáo viên', 'viên chức giáo dục', 'giáo viên mầm non',
  'giáo viên tiểu học', 'giáo viên THCS', 'giáo viên THPT',
  'nhân viên trường học', 'hợp đồng giáo viên', 'tuyển dụng giáo dục',
  'trường học', 'sở giáo dục', 'phòng giáo dục'
];

const envSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RSS_FEED_URL: z.string().url().default('https://tuyencongchuc.vn/feed/'),
  NOTICE_KEYWORDS: z.string().optional()
});

const env = envSchema.parse(process.env);

export const config = {
  feedUrl: env.RSS_FEED_URL,
  supabaseUrl: env.SUPABASE_URL,
  supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  keywords: (env.NOTICE_KEYWORDS?.split(',').map((keyword) => keyword.trim()).filter(Boolean) ?? DEFAULT_KEYWORDS)
};

export function assertSupabaseConfig(): { url: string; key: string } {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.');
  }
  return { url: config.supabaseUrl, key: config.supabaseServiceRoleKey };
}
