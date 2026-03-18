'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import type { Article } from '@/lib/types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function ArticlesTable({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white py-16">
        <p className="text-muted-foreground">No articles yet.</p>
        <Link
          href="/articles/new"
          className="mt-2 text-sm font-medium text-accent hover:underline"
        >
          Create your first article
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {articles.map((article) => (
        <Link key={article.id} href={`/articles/${article.id}`}>
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground line-clamp-2">
                  {article.title || 'Untitled'}
                </h3>
                <div className="shrink-0">
                  <StatusBadge status={article.status} />
                </div>
              </div>

              {(article.status === 'brief' ? article.brief_json?.angle : article.meta_description || article.brief_json?.angle || article.topic_input) && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {article.status === 'brief' ? article.brief_json?.angle : (article.meta_description || article.brief_json?.angle || article.topic_input)}
                </p>
              )}

              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex flex-wrap gap-1">
                  {article.keywords?.slice(0, 3).map((kw) => (
                    <span
                      key={kw}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatDate(article.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
