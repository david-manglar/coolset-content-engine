'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Article, InternalLink, PerformanceMetric } from '@/lib/types'

export function useArticle(id: string) {
  const [article, setArticle] = useState<Article | null>(null)
  const [links, setLinks] = useState<InternalLink[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)

  const refetchLinks = useCallback(async () => {
    const { data } = await supabase
      .from('internal_links')
      .select('*')
      .or(`source_article_id.eq.${id},target_article_id.eq.${id}`)
      .order('created_at', { ascending: false })
    if (data) setLinks(data as InternalLink[])
  }, [id])

  useEffect(() => {
    async function fetchData() {
      const [articleRes, linksRes, metricsRes] = await Promise.all([
        supabase.from('articles').select('*').eq('id', id).single(),
        supabase
          .from('internal_links')
          .select('*')
          .or(`source_article_id.eq.${id},target_article_id.eq.${id}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('performance_metrics')
          .select('*')
          .eq('article_id', id)
          .order('date', { ascending: false })
          .limit(10),
      ])

      if (articleRes.data) setArticle(articleRes.data as Article)
      if (linksRes.data) setLinks(linksRes.data as InternalLink[])
      if (metricsRes.data) setMetrics(metricsRes.data as PerformanceMetric[])
      setLoading(false)
    }

    fetchData()

    const channel = supabase
      .channel(`article-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'articles',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setArticle((prev) => ({ ...prev, ...payload.new } as Article))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  const [refreshing, setRefreshing] = useState(false)

  const refreshMetrics = useCallback(async () => {
    setRefreshing(true)
    const { data } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('article_id', id)
      .order('date', { ascending: false })
      .limit(10)
    if (data) setMetrics(data as PerformanceMetric[])
    await new Promise((r) => setTimeout(r, 600))
    setRefreshing(false)
  }, [id])

  return { article, links, metrics, loading, refetchLinks, refreshMetrics, refreshing }
}
