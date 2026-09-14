export interface FeedNotice {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
}

export interface RecruitmentNotice {
  title: string;
  excerpt: string;
  aggregator_url: string;
  official_url: string | null;
  source_name: string;
  province: string | null;
  recruitment_type: string | null;
  published_at: string | null;
  content_hash: string;
}
