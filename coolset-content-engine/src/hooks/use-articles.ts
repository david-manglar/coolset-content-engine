'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Article, ArticleStatus } from '@/lib/types'

export function useArticles(statusFilter?: ArticleStatus) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let query = supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    query.then(({ data, error }) => {
      if (error) console.error('Error fetching articles:', error)
      if (data) setArticles(data as Article[])
      setLoading(false)
    })

    const channel = supabase
      .channel('articles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'articles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setArticles((prev) => [payload.new as Article, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setArticles((prev) =>
              prev.map((a) =>
                a.id === (payload.new as Article).id
                  ? (payload.new as Article)
                  : a
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
  }, [statusFilter])

  return { articles, loading }
}
