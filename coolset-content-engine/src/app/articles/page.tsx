'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArticlesTable } from '@/components/articles-table'
import { useArticles } from '@/hooks/use-articles'
import type { ArticleStatus } from '@/lib/types'

const FILTER_OPTIONS: { value: ArticleStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'brief', label: 'Brief' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In review' },
  { value: 'cms_ready', label: 'Publishing' },
  { value: 'published', label: 'Published' },
]

const labelToValue = Object.fromEntries(FILTER_OPTIONS.map((o) => [o.label, o.value]))
const valueToLabel = Object.fromEntries(FILTER_OPTIONS.map((o) => [o.value, o.label]))

export default function ArticlesPage() {
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'all'>('all')
  const { articles, loading } = useArticles(statusFilter === 'all' ? undefined : statusFilter)

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Content Pipeline</h1>
        <Link href="/articles/new">
          <Button>+ New Article</Button>
        </Link>
      </div>

      <div className="mb-4">
        <Select
          value={valueToLabel[statusFilter]}
          onValueChange={(val) => setStatusFilter(val ? (labelToValue[val] ?? 'all') : 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.label}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading articles…</p>
      ) : (
        <ArticlesTable articles={articles} />
      )}
    </div>
  )
}
