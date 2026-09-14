import { createClient } from '@supabase/supabase-js';
import { assertSupabaseConfig } from './config.js';
import { RecruitmentNotice } from './types.js';

export function getSupabase() {
  const { url, key } = assertSupabaseConfig();
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function getExistingAggregatorUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();
  const { data, error } = await getSupabase().from('recruitment_notices').select('aggregator_url').in('aggregator_url', urls);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.aggregator_url as string));
}

export async function upsertNotice(notice: RecruitmentNotice): Promise<'inserted-or-updated'> {
  const { error } = await getSupabase().from('recruitment_notices').upsert({ ...notice, updated_at: new Date().toISOString(), is_published: true }, { onConflict: 'aggregator_url' });
  if (error) throw error;
  return 'inserted-or-updated';
}
