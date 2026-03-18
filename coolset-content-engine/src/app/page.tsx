'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { useDashboard } from '@/hooks/use-dashboard'
import { computeTrend, getOverallTrend } from '@/lib/performance-utils'
import { RefreshCwIcon } from 'lucide-react'

function TrendPill({ level, label }: { level: 'good' | 'warning' | 'danger'; label: string }) {
  const styles = {
    good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[level]}`}>
      {label}
    </span>
  )
}

function ChangeIndicator({ value, suffix = '%', inverted = false, neutralThreshold = 1, colorThreshold }: { value: number | null; suffix?: string; inverted?: boolean; neutralThreshold?: number; colorThreshold?: number }) {
  if (value === null) return null
  const abs = Math.abs(value)
  const isNeutral = abs < neutralThreshold
  const isPositive = inverted ? value < 0 : value > 0
  const effectiveColorThreshold = colorThreshold ?? neutralThreshold
  const isMuted = abs < effectiveColorThreshold // show arrow but stay grey
  const color = isNeutral || isMuted ? 'text-muted-foreground' : isPositive ? 'text-emerald-600' : 'text-red-500'
  const arrow = isNeutral ? '' : isPositive ? '↑' : '↓'
  const display = `${arrow}${abs.toFixed(1)}${suffix}`
  return <span className={`text-xs ${color}`}>{display}</span>
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function DashboardPage() {
  const {
    totalArticles,
    publishedCount,
    inProgressCount,
    aggregateMetrics,
    publishedArticles,
    recentArticles,
    loading,
    refreshMetrics,
    refreshing,
  } = useDashboard()

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-sm text-muted-foreground py-8 text-center">Loading dashboard…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <Link href="/articles/new">
          <Button>+ New Article</Button>
        </Link>
      </div>

      {/* Pipeline stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Total articles</p>
            <p className="text-2xl font-semibold">{totalArticles}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Published</p>
            <p className="text-2xl font-semibold text-emerald-600">{publishedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">In progress</p>
            <p className="text-2xl font-semibold text-amber-600">{inProgressCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance metrics */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Total impressions</p>
            <p className="text-2xl font-semibold">
              {aggregateMetrics.totalImpressions > 0
                ? aggregateMetrics.totalImpressions.toLocaleString()
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Avg CTR</p>
            <p className="text-2xl font-semibold">
              {aggregateMetrics.avgCtr > 0
                ? `${(aggregateMetrics.avgCtr * 100).toFixed(1)}%`
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Avg position</p>
            <p className="text-2xl font-semibold">
              {aggregateMetrics.avgPosition > 0
                ? aggregateMetrics.avgPosition.toFixed(1)
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance overview */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Performance overview</h2>
            {publishedArticles.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">Week-over-week comparison</p>
            )}
          </div>
          {publishedArticles.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshMetrics}
              disabled={refreshing}
              className="gap-1.5 text-xs"
            >
              <RefreshCwIcon className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh data'}
            </Button>
          )}
        </div>
        {publishedArticles.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-sm text-muted-foreground text-center">
                No published articles yet. Performance data will appear here after articles are added to CMS.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[36%]">Article</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Position</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-center">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publishedArticles.map(({ article, latestMetric, previousMetric }) => {
                    const trend = latestMetric ? computeTrend(latestMetric, previousMetric) : null
                    const overall = trend ? getOverallTrend(trend) : null

                    return (
                      <TableRow key={article.id}>
                        <TableCell className="max-w-0">
                          <Link
                            href={`/articles/${article.id}`}
                            className="text-sm text-foreground hover:text-accent truncate block"
                          >
                            {article.title}
                          </Link>
                        </TableCell>
                        {latestMetric && trend ? (
                          <>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="tabular-nums">{latestMetric.impressions.toLocaleString()}</span>
                                <ChangeIndicator value={trend.impressionsChange} />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="tabular-nums">{latestMetric.clicks.toLocaleString()}</span>
                                <ChangeIndicator value={trend.clicksChange} />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="tabular-nums">{Number(latestMetric.avg_position).toFixed(1)}</span>
                                <ChangeIndicator value={trend.positionChange} suffix="" inverted neutralThreshold={0.3} colorThreshold={0.5} />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="tabular-nums">{(Number(latestMetric.ctr) * 100).toFixed(1)}%</span>
                                <ChangeIndicator value={trend.ctrChange} suffix="pp" neutralThreshold={0.3} colorThreshold={0.5} />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {overall && <TrendPill level={overall.level} label={overall.label} />}
                            </TableCell>
                          </>
                        ) : (
                          <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                            Awaiting first monitoring cycle
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent activity */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent activity</h2>
          <Link href="/articles" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>
        {recentArticles.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-sm text-muted-foreground text-center">
                No articles yet. Create your first article to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {article.title || 'Untitled Article'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {timeAgo(article.updated_at)}
                      </p>
                    </div>
                    <StatusBadge status={article.status} />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
