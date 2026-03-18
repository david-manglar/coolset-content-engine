import { supabase } from '@/lib/supabase'
import type { Article, InternalLink } from '@/lib/types'

/**
 * Generate internal link suggestions for an article using an LLM
 * to find semantically related articles (not just keyword overlap).
 * Inserts suggestions directly into Supabase.
 */
export async function suggestInternalLinks(
  article: Article,
  allArticles: Article[]
): Promise<InternalLink[]> {
  const LINKABLE_STATUSES = ['draft', 'review', 'cms_ready', 'published']
  const candidates = allArticles.filter(
    (a) => a.id !== article.id && LINKABLE_STATUSES.includes(a.status)
  )
  if (candidates.length === 0) return []

  // Deduplicate against existing links
  const { data: freshLinks } = await supabase
    .from('internal_links')
    .select('source_article_id, target_article_id')
    .or(`source_article_id.eq.${article.id},target_article_id.eq.${article.id}`)

  const existingPairs = new Set(
    (freshLinks ?? []).map(
      (l: { source_article_id: string; target_article_id: string }) =>
        `${l.source_article_id}:${l.target_article_id}`
    )
  )

  const newCandidates = candidates.filter(
    (c) =>
      !existingPairs.has(`${article.id}:${c.id}`) &&
      !existingPairs.has(`${c.id}:${article.id}`)
  )

  if (newCandidates.length === 0) return []

  // Call LLM via API route
  const res = await fetch('/api/suggest-links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current: {
        id: article.id,
        title: article.title,
        keyword: article.brief_json?.keyword,
        key_points: article.brief_json?.key_points,
      },
      candidates: newCandidates.map((c) => ({
        id: c.id,
        title: c.title,
        keyword: c.brief_json?.keyword,
        key_points: c.brief_json?.key_points,
      })),
    }),
  })

  if (!res.ok) {
    console.error('suggest-links API error:', await res.text())
    return []
  }

  const { suggestions } = await res.json()
  if (!suggestions?.length) return []

  // Insert into Supabase
  const rows = suggestions.map((s: { id: string }) => {
    const target = newCandidates.find((c) => c.id === s.id)
    return {
      source_article_id: article.id,
      target_article_id: s.id,
      anchor_text: target?.title ?? '',
      status: 'suggested',
    }
  })

  const { data, error } = await supabase
    .from('internal_links')
    .insert(rows)
    .select()

  if (error) {
    console.error('Failed to insert link suggestions:', error)
    return []
  }

  return (data ?? []) as InternalLink[]
}
