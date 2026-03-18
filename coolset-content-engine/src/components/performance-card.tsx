import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCwIcon } from 'lucide-react'
import { computeTrend, getAlerts } from '@/lib/performance-utils'
import type { PerformanceMetric } from '@/lib/types'

interface PerformanceCardProps {
  metrics: PerformanceMetric[]
  onRefresh?: () => Promise<void>
  refreshing?: boolean
}

function ChangeIndicator({ value, suffix = '%', inverted = false, neutralThreshold = 1, colorThreshold }: { value: number | null; suffix?: string; inverted?: boolean; neutralThreshold?: number; colorThreshold?: number }) {
  if (value === null) return null
  const abs = Math.abs(value)
  const isNeutral = abs < neutralThreshold
  const isPositive = inverted ? value < 0 : value > 0
  const effectiveColorThreshold = colorThreshold ?? neutralThreshold
  const isMuted = abs < effectiveColorThreshold
  const color = isNeutral || isMuted ? 'text-muted-foreground' : isPositive ? 'text-emerald-600' : 'text-red-500'
  const arrow = isNeutral ? '' : isPositive ? '↑ ' : '↓ '
  const display = `${arrow}${abs.toFixed(1)}${suffix}`
  return <span className={`text-xs font-medium ${color}`}>{display}</span>
}

export function PerformanceCard({ metrics, onRefresh, refreshing }: PerformanceCardProps) {
  const refreshButton = onRefresh && (
    <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing} className="gap-1.5 text-xs">
      <RefreshCwIcon className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
      {refreshing ? 'Refreshing…' : 'Refresh'}
    </Button>
  )

  if (metrics.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Performance</CardTitle>
          {refreshButton}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Performance data will appear after the next monitoring cycle.
          </p>
        </CardContent>
      </Card>
    )
  }

  const latest = metrics[0]
  const previous = metrics.length > 1 ? metrics[1] : null
  const trend = computeTrend(latest, previous)
  const alerts = getAlerts(trend, latest)

  const alertStyles = {
    good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Performance</CardTitle>
        {refreshButton}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Impressions</p>
            <p className="text-2xl font-semibold tabular-nums">{latest.impressions.toLocaleString()}</p>
            <ChangeIndicator value={trend.impressionsChange} suffix="%" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Clicks</p>
            <p className="text-2xl font-semibold tabular-nums">{latest.clicks.toLocaleString()}</p>
            <ChangeIndicator value={trend.clicksChange} suffix="%" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Position</p>
            <p className="text-2xl font-semibold tabular-nums">{Number(latest.avg_position).toFixed(1)}</p>
            <ChangeIndicator value={trend.positionChange} suffix="" inverted neutralThreshold={0.3} colorThreshold={0.5} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">CTR</p>
            <p className="text-2xl font-semibold tabular-nums">{(Number(latest.ctr) * 100).toFixed(1)}%</p>
            <ChangeIndicator value={trend.ctrChange} suffix="pp" neutralThreshold={0.3} colorThreshold={0.5} />
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {alerts.map((alert) => (
              <span
                key={alert.label}
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${alertStyles[alert.level]}`}
              >
                {alert.label}
              </span>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          Focus keyword: {latest.tracked_keyword} · {new Date(latest.date).toLocaleDateString('en-GB')}{previous ? ` · Changes vs previous week` : ''}
        </p>
      </CardContent>
    </Card>
  )
}
