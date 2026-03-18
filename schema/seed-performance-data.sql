-- Seed performance metrics for published articles
-- Run this in Supabase SQL Editor AFTER you have published articles
-- Generates 10 days of realistic, improving metrics per published article

-- Clear existing seed data (safe to re-run)
DELETE FROM performance_metrics
WHERE created_at > NOW() - INTERVAL '15 days';

-- Insert 10 days of metrics for each published article
INSERT INTO performance_metrics (article_id, date, impressions, clicks, avg_position, ctr, tracked_keyword)
SELECT
  a.id,
  (CURRENT_DATE - (d || ' days')::interval)::date AS date,
  -- Impressions: growing from ~500 to ~2500 over 10 days
  floor(500 + (10 - d) * 200 + random() * 300)::int AS impressions,
  -- Clicks: growing from ~30 to ~180
  floor(30 + (10 - d) * 15 + random() * 20)::int AS clicks,
  -- Avg position: improving from ~15 to ~8
  round((15 - (10 - d) * 0.7 + random() * 2)::numeric, 1) AS avg_position,
  -- CTR: improving from ~3% to ~8%
  round((0.03 + (10 - d) * 0.005 + random() * 0.01)::numeric, 3) AS ctr,
  -- Use first keyword as tracked keyword
  a.keywords[1] AS tracked_keyword
FROM articles a
CROSS JOIN generate_series(0, 9) AS d
WHERE a.status = 'published'
  AND a.keywords IS NOT NULL
  AND array_length(a.keywords, 1) > 0
ON CONFLICT (article_id, date, tracked_keyword) DO UPDATE SET
  impressions = EXCLUDED.impressions,
  clicks = EXCLUDED.clicks,
  avg_position = EXCLUDED.avg_position,
  ctr = EXCLUDED.ctr;
