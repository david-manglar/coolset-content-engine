import type { Article, BriefJson } from './types'
import { MOCK_ARTICLES } from './mock-data'

// In-memory store so new articles persist across page navigations during the session
let dynamicArticles: Article[] = []

export function getAllArticles(): Article[] {
  return [...dynamicArticles, ...MOCK_ARTICLES]
}

export function getArticle(id: string): Article | undefined {
  return dynamicArticles.find((a) => a.id === id) || MOCK_ARTICLES.find((a) => a.id === id)
}

export function updateArticleBrief(id: string, brief: BriefJson): void {
  const article = dynamicArticles.find((a) => a.id === id)
  if (article) {
    article.brief_json = brief
    article.updated_at = new Date().toISOString()
  }
}

export function generateMockBrief(topic: string, audience?: string, humanInput?: string): Article {
  const id = crypto.randomUUID()
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

  const brief: BriefJson = {
    keyword: topic.split(' ').slice(0, 4).join(' ').toLowerCase(),
    outline: [
      `What is ${topic.split(' ').slice(0, 3).join(' ')}?`,
      'Why it matters for sustainability teams',
      'Key requirements and frameworks',
      'Step-by-step implementation guide',
      'Common challenges and how to overcome them',
      'Tools and resources to get started',
    ],
    angle: `A practical, action-oriented guide for sustainability professionals who need to understand and implement ${topic.toLowerCase()}. Focuses on real-world applicability rather than theory.`,
    audience: audience || 'Sustainability managers',
    key_points: [
      'Regulatory context and why this topic is increasingly urgent',
      'Practical steps that teams can start implementing immediately',
      'How this connects to broader ESG reporting obligations (CSRD, ESRS)',
      'Data requirements and where to find reliable sources',
    ],
  }

  const article: Article = {
    id,
    title: topic
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    slug,
    status: 'brief',
    topic_input: topic,
    target_audience: audience || null,
    human_input: humanInput || null,
    brief_json: brief,
    draft_html: null,
    final_html: null,
    keywords: brief.keyword.split(' ').filter(Boolean),
    meta_description: null,
    visual_suggestions: null,
    revision_notes: null,
    webflow_item_id: null,
    webflow_slug: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  dynamicArticles = [article, ...dynamicArticles]
  return article
}
