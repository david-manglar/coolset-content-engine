'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/status-badge'
import { ArticlePreview } from '@/components/article-preview'
import { DraftEditor } from '@/components/draft-editor'
import { ReviewActions } from '@/components/review-actions'
import { PerformanceCard } from '@/components/performance-card'
import { VisualSuggestions } from '@/components/visual-suggestions'
import { InternalLinksCard } from '@/components/internal-links-card'
import { BriefEditor } from '@/components/brief-editor'
import { useArticle } from '@/hooks/use-article'
import { useArticles } from '@/hooks/use-articles'
import { supabase } from '@/lib/supabase'
import { triggerWebhook } from '@/lib/webhooks'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import type { VisualSuggestion } from '@/lib/types'

const GENERATION_MESSAGES = [
  'Reading your brief...',
  'Researching the topic...',
  'Structuring the article...',
  'Writing the first sections...',
  'Applying Coolset tone of voice...',
  'Generating visual suggestions...',
  'Polishing the draft...',
  'Almost there...',
]

function wordCount(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text ? text.split(' ').length : 0
}

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { article, links, metrics, loading, refreshMetrics, refreshing } = useArticle(id)
  const { articles: allArticles } = useArticles()
  const [generating, setGenerating] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)

  // Rotate through messages every 6s while generating
  useEffect(() => {
    if (!generating) return
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % GENERATION_MESSAGES.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [generating])

  // Auto-close dialog when draft arrives via Realtime
  useEffect(() => {
    if (generating && article?.status === 'draft' && article?.draft_html) {
      setGenerating(false)
      setMessageIndex(0)
      toast.success('Draft is ready!')
    }
  }, [generating, article?.status, article?.draft_html])

  const handleDraftSave = useCallback(async (html: string) => {
    const { error } = await supabase
      .from('articles')
      .update({ draft_html: html })
      .eq('id', id)
    if (error) {
      toast.error('Failed to save draft.')
    } else {
      toast.success('Draft saved.')
    }
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <p className="text-sm text-muted-foreground py-8 text-center">Loading article…</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <p className="text-muted-foreground">Article not found.</p>
        <Link href="/articles" className="mt-2 text-sm text-accent hover:underline">
          ← Back to articles
        </Link>
      </div>
    )
  }

  async function handleGenerateDraft() {
    try {
      setGenerating(true)
      setMessageIndex(0)
      await triggerWebhook('generateDraft', { article_id: article!.id })
    } catch {
      setGenerating(false)
      setMessageIndex(0)
      toast.error('Failed to trigger draft generation. Check webhook configuration.')
    }
  }

  async function handleVisualsUpdate(visuals: VisualSuggestion[]) {
    const { error } = await supabase
      .from('articles')
      .update({ visual_suggestions: visuals })
      .eq('id', id)
    if (error) toast.error('Failed to save visual suggestions.')
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/articles"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to articles
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {article.title || 'Untitled Article'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(article.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <StatusBadge status={article.status} />
      </div>

      {article.keywords && article.keywords.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {article.keywords.map((kw) => (
            <span
              key={kw}
              className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {article.meta_description && (
        <div className="mb-6 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Meta description</p>
          <div className="rounded-md border border-border bg-muted px-3 py-2.5">
            <p className="text-sm italic text-muted-foreground">{article.meta_description}</p>
          </div>
        </div>
      )}

      {article.draft_html && (
        <div className="mb-6">
          <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-sm font-medium text-foreground">
            {wordCount(article.draft_html).toLocaleString()} words
          </span>
        </div>
      )}

      <Separator className="mb-6" />

      {/* Brief status */}
      {article.status === 'brief' && (
        <div className="space-y-6">
          {article.brief_json ? (
            <>
              <BriefEditor
                articleId={article.id}
                brief={article.brief_json}
              />
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-800">
                    Review the brief above, then generate the article draft.
                  </p>
                  <Button onClick={handleGenerateDraft} size="sm">
                    Generate draft
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Brief is being generated...
            </p>
          )}
        </div>
      )}

      {/* Draft / Review status */}
      {(article.status === 'draft' || article.status === 'review') && (
        <div className="space-y-6">
          {article.draft_html && (
            <DraftEditor
              html={article.draft_html}
              onSave={handleDraftSave}
            />
          )}

          <VisualSuggestions
            suggestions={article.visual_suggestions ?? []}
            onUpdate={handleVisualsUpdate}
          />

          <InternalLinksCard
            links={links}
            currentArticleId={id}
            articles={allArticles}
            currentArticle={article}
          />

          <Separator />

          <div>
            <h2 className="mb-3 text-lg font-medium">Review</h2>
            <ReviewActions
              articleId={article.id}
              status={article.status}
            />
          </div>
        </div>
      )}

      {/* Publishing status */}
      {article.status === 'cms_ready' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
            <p className="text-sm text-sky-800">
              Publishing article to Webflow...
            </p>
          </div>
          {article.final_html && (
            <div>
              <h2 className="mb-3 text-lg font-medium">Final preview</h2>
              <ArticlePreview html={article.final_html} />
            </div>
          )}
        </div>
      )}

      {/* Published status */}
      {article.status === 'published' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
            <p className="text-sm text-emerald-800">
              Published on Webflow
              {article.webflow_slug && (
                <span className="ml-1 font-mono text-xs">
                  /blog-posts/{article.webflow_slug}
                </span>
              )}
            </p>
            {article.webflow_slug && (
              <a
                href={`https://coolset-blog-sample.webflow.io/blog-posts/${article.webflow_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                View live &rarr;
              </a>
            )}
          </div>

          {(article.final_html || article.draft_html) && (
            <div>
              <h2 className="mb-3 text-lg font-medium">Article preview</h2>
              <ArticlePreview html={article.final_html || article.draft_html!} />
            </div>
          )}

          <PerformanceCard metrics={metrics} onRefresh={refreshMetrics} refreshing={refreshing} />

          <InternalLinksCard
            links={links}
            currentArticleId={id}
            articles={allArticles}
            currentArticle={article}
          />
        </div>
      )}

      {/* Draft generation overlay */}
      <Dialog open={generating} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">
              Writing your article
            </DialogTitle>
            <DialogDescription className="text-center">
              This usually takes 1–2 minutes
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2Icon className="h-8 w-8 animate-spin text-[#2E43FF]" />
            <p
              key={messageIndex}
              className="animate-in fade-in duration-500 text-sm text-muted-foreground"
            >
              {GENERATION_MESSAGES[messageIndex]}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
