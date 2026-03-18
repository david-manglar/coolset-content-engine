'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CheckIcon, XIcon, Loader2Icon, PlusIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { suggestInternalLinks } from '@/lib/suggest-links'
import type { InternalLink, Article } from '@/lib/types'

const LINK_STATUS_STYLES: Record<string, string> = {
  suggested: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  applied: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-zinc-100 text-zinc-500',
}

interface InternalLinksCardProps {
  links: InternalLink[]
  currentArticleId: string
  articles: Article[]
  currentArticle?: Article
  onLinksUpdated?: (links: InternalLink[]) => void
}

export function InternalLinksCard({
  links: initialLinks,
  currentArticleId,
  articles,
  currentArticle,
  onLinksUpdated,
}: InternalLinksCardProps) {
  const [links, setLinks] = useState(initialLinks)
  const [suggesting, setSuggesting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addTargetId, setAddTargetId] = useState('')
  const [addAnchorText, setAddAnchorText] = useState('')
  const didSuggest = useRef(false)

  // Sync with parent
  useEffect(() => {
    setLinks(initialLinks)
  }, [initialLinks])

  // Auto-suggest on mount if article has brief data and no existing suggestions
  useEffect(() => {
    if (didSuggest.current) return
    if (!currentArticle) return
    if (!currentArticle.brief_json?.keyword && !currentArticle.title) return
    if (links.length > 0) return
    if (articles.length <= 1) return

    didSuggest.current = true
    setSuggesting(true)

    suggestInternalLinks(currentArticle, articles).then((newLinks) => {
      if (newLinks.length > 0) {
        setLinks(newLinks)
        onLinksUpdated?.(newLinks)
      }
      setSuggesting(false)
    })
  }, [currentArticle, articles, links, onLinksUpdated])

  function handleRefresh() {
    if (!currentArticle || articles.length <= 1 || suggesting) return
    didSuggest.current = false
    setSuggesting(true)
    suggestInternalLinks(currentArticle, articles).then((newLinks) => {
      if (newLinks.length > 0) {
        setLinks((prev) => [...prev, ...newLinks])
        onLinksUpdated?.([...links, ...newLinks])
      }
      setSuggesting(false)
    })
  }

  async function handleUpdateStatus(linkId: string, status: 'approved' | 'rejected') {
    const { error } = await supabase
      .from('internal_links')
      .update({ status })
      .eq('id', linkId)

    if (!error) {
      setLinks((prev) =>
        prev.map((l) => (l.id === linkId ? { ...l, status } : l))
      )
    }
  }

  async function handleAddLink() {
    if (!addTargetId || !addAnchorText.trim()) return

    const { data, error } = await supabase
      .from('internal_links')
      .insert({
        source_article_id: currentArticleId,
        target_article_id: addTargetId,
        anchor_text: addAnchorText.trim(),
        context_snippet: 'Manually added',
        status: 'suggested',
      })
      .select()
      .single()

    if (!error && data) {
      setLinks((prev) => [data as InternalLink, ...prev])
      setAddTargetId('')
      setAddAnchorText('')
      setShowAddForm(false)
    }
  }

  function getLinkedArticle(link: InternalLink) {
    const targetId =
      link.source_article_id === currentArticleId
        ? link.target_article_id
        : link.source_article_id
    return articles.find((a) => a.id === targetId)
  }

  // Articles available for manual linking (exclude self only — allow duplicating direction)
  const availableTargets = articles.filter((a) => a.id !== currentArticleId)

  if (suggesting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            Analyzing articles for link suggestions…
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Internal links</CardTitle>
        {!showAddForm && availableTargets.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={suggesting}
              className="h-7 text-xs"
            >
              <RefreshCwIcon className="mr-1 h-3 w-3" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="h-7 text-xs"
            >
              <PlusIcon className="mr-1 h-3 w-3" />
              Add link
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Add link form */}
        {showAddForm && (
          <div className="mb-4 rounded-lg border border-dashed p-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Link to article</label>
              <Select value={addTargetId} onValueChange={(v) => setAddTargetId(v ?? '')}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Select article…" />
                </SelectTrigger>
                <SelectContent>
                  {availableTargets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-2 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Anchor text</label>
              <Input
                placeholder="e.g. carbon pricing strategies"
                value={addAnchorText}
                onChange={(e) => setAddAnchorText(e.target.value)}
                className="w-full text-sm"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleAddLink} disabled={!addTargetId || !addAnchorText.trim()}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false)
                  setAddTargetId('')
                  setAddAnchorText('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {links.length === 0 && !showAddForm ? (
          <p className="text-sm text-muted-foreground">
            No internal links yet. Suggestions will appear when related articles exist.
          </p>
        ) : (
          <div className="space-y-3">
            {links.map((link) => {
              const linkedArticle = getLinkedArticle(link)
              const isOutgoing = link.source_article_id === currentArticleId

              return (
                <div key={link.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {isOutgoing ? 'Links to' : 'Linked from'}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${LINK_STATUS_STYLES[link.status] ?? 'bg-zinc-100 text-zinc-600'}`}
                      >
                        {link.status.charAt(0).toUpperCase() + link.status.slice(1)}
                      </span>
                    </div>

                    {linkedArticle ? (
                      <Link
                        href={`/articles/${linkedArticle.id}`}
                        className="mt-1 block text-sm font-medium text-foreground hover:text-accent"
                      >
                        {linkedArticle.title}
                      </Link>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">Unknown article</p>
                    )}

                  </div>

                  {link.status === 'suggested' && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => handleUpdateStatus(link.id, 'approved')}
                        className="rounded-md border p-1.5 text-emerald-600 hover:bg-emerald-50"
                        title="Approve"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(link.id, 'rejected')}
                        className="rounded-md border p-1.5 text-zinc-400 hover:bg-zinc-50"
                        title="Reject"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
