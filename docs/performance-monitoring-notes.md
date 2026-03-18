# Performance Monitoring & Alerting — Demo Notes

## What the demo shows

Week-over-week comparison of published articles. The UI compares the latest `performance_metrics` row to the previous one, all client-side.

**Change indicators** (↑/↓) next to each metric, with two-tier thresholds:
- Impressions & clicks: < 1% = grey (neutral), otherwise green/red
- Position & CTR: < 0.3 = no arrow, 0.3–0.5 = grey arrow, > 0.5 = green/red

**Dashboard trend pills** per article: "Growing" (green), "Stable" (amber), "Needs attention" (red).

**Alert flags** on the detail page when thresholds are crossed:

| Alert | Trigger | Level |
|-------|---------|-------|
| Ranking drop | Position worsened by 3+ spots | Danger (red) |
| Traffic declining | Impressions dropped 20%+ WoW | Danger (red) |
| Low CTR | CTR below 2% | Warning (amber) |
| Ranking up | Position improved by 2+ spots | Good (green) |
| Traffic growing | Impressions grew 20%+ WoW | Good (green) |

**Refresh button** on both dashboard and detail page re-fetches from Supabase (simulates polling; in production would trigger the n8n workflow).

## Production n8n workflow

**One single scheduled workflow** (e.g. weekly) covers both dashboard and detail pages — same data model.

1. Query Supabase → all articles with `status = 'published'`
2. For each → call DataForSEO / Google Search Console with `tracked_keyword`
3. Insert new row into `performance_metrics` — the UI derives everything from there

## Future extensions

- **Slack/email alerts**: post-insert step checks thresholds, notifies if action needed
- **GA4 integration**: parallel branch for bounce rate, time on page
- **Auto optimization**: on ranking drop, LLM suggests content improvements
