import type { ArticleStatus } from './types'

export const AUDIENCES = [
  'Sustainability managers',
  'ESG analysts & reporting teams',
  'CFOs & finance leaders',
  'Compliance officers',
  'Procurement & supply chain managers',
  'C-suite / board members',
  'Sustainability consultants',
]

export const STATUS_CONFIG: Record<ArticleStatus, { label: string; color: string }> = {
  brief: { label: 'Brief', color: 'bg-zinc-100 text-zinc-700' },
  draft: { label: 'Draft', color: 'bg-amber-100 text-amber-800' },
  review: { label: 'In review', color: 'bg-blue-100 text-blue-800' },
  cms_ready: { label: 'Publishing', color: 'bg-sky-100 text-sky-800' },
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-800' },
}
