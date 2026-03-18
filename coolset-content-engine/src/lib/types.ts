export type ArticleStatus = 'brief' | 'draft' | 'review' | 'cms_ready' | 'published'
export type LinkStatus = 'suggested' | 'approved' | 'applied' | 'rejected'

export interface BriefJson {
  keyword: string
  outline: string[]
  angle: string
  audience: string
  key_points: string[]
}

export type VisualType = 'cover' | 'supporting'

export interface VisualSuggestion {
  type: VisualType
  description: string
  placement: string
}

export interface Article {
  id: string
  title: string
  slug: string
  status: ArticleStatus
  topic_input: string
  target_audience: string | null
  human_input: string | null
  brief_json: BriefJson | null
  draft_html: string | null
  final_html: string | null
  keywords: string[] | null
  meta_description: string | null
  visual_suggestions: VisualSuggestion[] | null
  revision_notes: string | null
  webflow_item_id: string | null
  webflow_slug: string | null
  created_at: string
  updated_at: string
}

export interface InternalLink {
  id: string
  source_article_id: string
  target_article_id: string
  anchor_text: string
  context_snippet: string
  status: LinkStatus
  created_at: string
}

export interface PerformanceMetric {
  id: string
  article_id: string
  date: string
  impressions: number
  clicks: number
  avg_position: number
  ctr: number
  tracked_keyword: string
  created_at: string
}
