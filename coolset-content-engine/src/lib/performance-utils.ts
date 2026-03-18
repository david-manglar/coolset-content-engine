import type { PerformanceMetric } from './types'

export interface TrendData {
  impressionsChange: number | null // percentage
  clicksChange: number | null
  positionChange: number | null // absolute difference (negative = better)
  ctrChange: number | null // percentage points
}

export type AlertLevel = 'good' | 'warning' | 'danger'

export interface PerformanceAlert {
  level: AlertLevel
  label: string
}

export function computeTrend(
  latest: PerformanceMetric,
  previous: PerformanceMetric | null
): TrendData {
  if (!previous) {
    return { impressionsChange: null, clicksChange: null, positionChange: null, ctrChange: null }
  }

  const prevCtr = Number(previous.ctr)

  return {
    impressionsChange: previous.impressions > 0
      ? ((latest.impressions - previous.impressions) / previous.impressions) * 100
      : null,
    clicksChange: previous.clicks > 0
      ? ((latest.clicks - previous.clicks) / previous.clicks) * 100
      : null,
    positionChange: Number(latest.avg_position) - Number(previous.avg_position),
    ctrChange: (Number(latest.ctr) - prevCtr) * 100, // absolute change in percentage points
  }
}

export function getAlerts(trend: TrendData, latest: PerformanceMetric): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = []

  // Position dropped 3+ spots
  if (trend.positionChange !== null && trend.positionChange >= 3) {
    alerts.push({ level: 'danger', label: 'Ranking drop' })
  }

  // Impressions declined 20%+
  if (trend.impressionsChange !== null && trend.impressionsChange <= -20) {
    alerts.push({ level: 'danger', label: 'Traffic declining' })
  }

  // Low CTR
  if (Number(latest.ctr) < 0.02) {
    alerts.push({ level: 'warning', label: 'Low CTR' })
  }

  // Position improving nicely
  if (trend.positionChange !== null && trend.positionChange <= -2) {
    alerts.push({ level: 'good', label: 'Ranking up' })
  }

  // Strong traffic growth
  if (trend.impressionsChange !== null && trend.impressionsChange >= 20 && alerts.every(a => a.label !== 'Traffic declining')) {
    alerts.push({ level: 'good', label: 'Traffic growing' })
  }

  return alerts
}

export function getOverallTrend(trend: TrendData): { level: AlertLevel; label: string } {
  const posImproving = trend.positionChange !== null && trend.positionChange < -1
  const impressionsGrowing = trend.impressionsChange !== null && trend.impressionsChange > 10
  const posDropping = trend.positionChange !== null && trend.positionChange >= 3
  const impressionsDeclining = trend.impressionsChange !== null && trend.impressionsChange <= -20

  if (posDropping || impressionsDeclining) {
    return { level: 'danger', label: 'Needs attention' }
  }
  if (posImproving || impressionsGrowing) {
    return { level: 'good', label: 'Growing' }
  }
  return { level: 'warning', label: 'Stable' }
}
