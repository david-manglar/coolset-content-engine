'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Article, PerformanceMetric } from '@/lib/types'

interface ArticleWithMetrics {
  article: Article
  latestMetric: PerformanceMetric | null
  previousMetric: PerformanceMetric | null
}

interface AggregateMetrics {
  totalImpressions: number
  avgCtr: number
  avgPosition: number
}

interface DashboardData {
  totalArticles: number
  publishedCount: number
  inProgressCount: number
  briefCount: number
  draftCount: number
  reviewCount: number
  aggregateMetrics: AggregateMetrics
  publishedArticles: ArticleWithMetrics[]
  recentArticles: Article[]
  loading: boolean
}

export function useDashboard(): DashboardData & { refreshMetrics: () => Promise<void>; refreshing: boolean } {
  const [articles, setArticles] = useState<Article[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchMetrics = useCallback(async () => {
    const { data } = await supabase
      .from('performance_metrics')
      .select('*')
      .order('date', { ascending: false })
    if (data) setMetrics(data as PerformanceMetric[])
  }, [])

  const refreshMetrics = useCallback(async () => {
    setRefreshing(true)
    await fetchMetrics()
    // Small delay so the spinner is visible even on fast fetches
    await new Promise((r) => setTimeout(r, 600))
    setRefreshing(false)
  }, [fetchMetrics])

  useEffect(() => {
    async function fetchData() {
      const [articlesRes, metricsRes] = await Promise.all([
        supabase
          .from('articles')
          .select('*')
          .order('updated_at', { ascending: false }),
        supabase
          .from('performance_metrics')
          .select('*')
          .order('date', { ascending: false }),
      ])

      if (articlesRes.data) setArticles(articlesRes.data as Article[])
      if (metricsRes.data) setMetrics(metricsRes.data as PerformanceMetric[])
      setLoading(false)
    }

    fetchData()

    const channel = supabase
      .channel('dashboard-articles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'articles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setArticles((prev) => [payload.new as Article, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setArticles((prev) =>
              prev.map((a) =>
                a.id === (payload.new as Article).id ? (payload.new as Article) : a
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setArticles((prev) =>
              prev.filter((a) => a.id !== (payload.old as { id: string }).id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const published = articles.filter((a) => a.status === 'published')
  const briefCount = articles.filter((a) => a.status === 'brief').length
  const draftCount = articles.filter((a) => a.status === 'draft').length
  const reviewCount = articles.filter((a) => a.status === 'review').length

  // Get latest + previous metric per published article
  const publishedArticles: ArticleWithMetrics[] = published.map((article) => {
    const articleMetrics = metrics.filter((m) => m.article_id === article.id)
    return {
      article,
      latestMetric: articleMetrics.length > 0 ? articleMetrics[0] : null,
      previousMetric: articleMetrics.length > 1 ? articleMetrics[1] : null,
    }
  })

  // Aggregate metrics across all published articles (use latest metric per article)
  const latestMetrics = publishedArticles
    .map((pa) => pa.latestMetric)
    .filter((m): m is PerformanceMetric => m !== null)

  const aggregateMetrics: AggregateMetrics = {
    totalImpressions: latestMetrics.reduce((sum, m) => sum + m.impressions, 0),
    avgCtr:
      latestMetrics.length > 0
        ? latestMetrics.reduce((sum, m) => sum + Number(m.ctr), 0) / latestMetrics.length
        : 0,
    avgPosition:
      latestMetrics.length > 0
        ? latestMetrics.reduce((sum, m) => sum + Number(m.avg_position), 0) / latestMetrics.length
        : 0,
  }

  return {
    totalArticles: articles.length,
    publishedCount: published.length,
    inProgressCount: briefCount + draftCount + reviewCount,
    briefCount,
    draftCount,
    reviewCount,
    aggregateMetrics,
    publishedArticles,
    recentArticles: articles.slice(0, 8),
    loading,
    refreshMetrics,
    refreshing,
  }
}
