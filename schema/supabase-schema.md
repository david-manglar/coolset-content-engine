# Supabase Schema — Coolset Content Engine

## Table: `articles`
The core pipeline table. Each row is a content piece moving through statuses.

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Default: gen_random_uuid() |
| title | text | Article title |
| slug | text (unique) | URL slug, auto-generated from title |
| status | text | One of: `brief`, `draft`, `review`, `cms_ready`, `published`. `published` = "Added to CMS" (pushed to Webflow with visual placeholders, user adds real images in Webflow before going live). `review` = human gate after draft. |
| topic_input | text | Original topic input from the user ("What is it?") |
| target_audience | text | Selected audience segment ("Who is it for?") |
| human_input | text | User's unique insights, angles, opinions ("What do you want to get across?") |
| brief_json | jsonb | Structured brief: keyword, outline, angle, audience, key points |
| draft_html | text | LLM-generated article draft (HTML) |
| final_html | text | CMS-ready formatted HTML |
| keywords | text[] | Target keywords array |
| meta_description | text | SEO meta description |
| visual_suggestions | jsonb | LLM-suggested visuals. Each object has: `type` ('cover' or 'supporting'), `description`, `placement` |
| revision_notes | text | Reviewer feedback when requesting revision (nullable) |
| webflow_item_id | text | Webflow CMS item ID after publishing |
| webflow_slug | text | Webflow URL slug |
| created_at | timestamptz | Default: now() |
| updated_at | timestamptz | Default: now(), auto-updated via trigger |

## Table: `internal_links`
Tracks the link graph between articles. Enables bidirectional internal linking.

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Default: gen_random_uuid() |
| source_article_id | uuid (FK → articles.id) | Article containing the link |
| target_article_id | uuid (FK → articles.id) | Article being linked to |
| anchor_text | text | Suggested or applied anchor text |
| context_snippet | text | Surrounding sentence/paragraph for context |
| status | text | One of: `suggested`, `approved`, `applied`, `rejected` |
| created_at | timestamptz | Default: now() |

## Table: `performance_metrics`
Time-series performance data per article. Populated by scheduled n8n workflow via DataForSEO.

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Default: gen_random_uuid() |
| article_id | uuid (FK → articles.id) | |
| date | date | Measurement date |
| impressions | integer | Search impressions |
| clicks | integer | Search clicks |
| avg_position | numeric | Average SERP position |
| ctr | numeric | Click-through rate |
| tracked_keyword | text | The keyword being tracked |
| created_at | timestamptz | Default: now() |

**Unique constraint:** (article_id, date, tracked_keyword)

## Table: `existing_content`
Scraped Coolset Academy articles. Used as context for internal linking logic.

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Default: gen_random_uuid() |
| title | text | Original article title |
| url | text (unique) | Source URL |
| content_text | text | Extracted plain text |
| content_summary | text | LLM-generated summary for matching |
| keywords | text[] | Extracted/inferred keywords |
| scraped_at | timestamptz | Default: now() |

## Constraints & Indexes
- All FKs have `ON DELETE CASCADE`
- `articles.status` has a CHECK constraint: `brief`, `draft`, `review`, `cms_ready`, `published`
- `internal_links.status` has a CHECK constraint: `suggested`, `approved`, `applied`, `rejected`
- Indexes on: `articles(status)`, `internal_links(source_article_id)`, `internal_links(target_article_id)`, `performance_metrics(article_id)`, `performance_metrics(date)`
- A `before update` trigger on `articles` auto-sets `updated_at = now()`

## Supabase Project Configuration

### Row Level Security (RLS)
RLS is **enabled** on all 4 tables with a permissive "Allow all" policy (`using (true) with check (true)`). This keeps Supabase happy without blocking access — no auth in this prototype.

### Realtime
Enabled on the **`articles` table only**. This lets the frontend subscribe to status changes (e.g., `brief` → `draft`) via Supabase Realtime channels. The other tables don't need it:
- `internal_links` — bulk-generated, viewed on demand
- `performance_metrics` — populated by scheduled jobs, not time-sensitive
- `existing_content` — populated once during setup, then read-only

### API Access
- **Frontend (Next.js):** Uses the **anon key** via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars.
- **n8n:** Uses the **service_role key** (bypasses RLS). Can use either the built-in Supabase node or HTTP Request node hitting `https://<project-ref>.supabase.co/rest/v1/<table>`.

## Design Notes
- The `existing_content` table gets populated once during setup (scrape), then used read-only during linking
- `internal_links` references only `articles` rows for the prototype; `existing_content` is used as read-only context for the LLM during link suggestions
