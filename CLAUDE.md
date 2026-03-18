# Coolset Content Engine - Project Guide

## What This Is
A prototype content production pipeline for Coolset (sustainability management platform) built as a GTM engineering case. The system automates content creation from topic input through to CMS publishing and performance monitoring.

## Architecture
- **Frontend (Content Engine UI):** Next.js app deployed on Vercel. Entry point for users — topic input, pipeline status, draft editing, review/approval. Calls n8n webhooks to trigger workflows.
- **Orchestration (n8n Cloud):** All pipeline workflows live here. Handles LLM calls, data transformations, API integrations (Webflow, DataForSEO). Triggered by the UI via webhook endpoints.
- **Database (Supabase):** Central data layer. Stores articles, briefs, drafts, internal link graph, performance metrics, and scraped existing content. Source of truth for the entire pipeline. Realtime enabled on `articles` table.
- **CMS (Webflow):** Publishing destination. Articles pushed via Webflow CMS API from n8n after final formatting. User adds actual images in Webflow as a final step before going live.
- **SEO (DataForSEO):** Post-publish performance monitoring. Potentially also keyword research at brief stage if time allows.

## Pipeline Steps & Status Machine
`brief` → `draft` → `review` → `cms_ready` → `published` (displayed as "Added to CMS")

1. **Topic input** → User fills form: topic ("What is it?"), target audience (dropdown), human input ("What do you want to get across?")
2. **Brief generation** (n8n + LLM) → Structured brief with keyword, outline, angle, audience, key points. User can edit the brief before proceeding.
3. **Draft creation** (n8n + LLM + Coolset tone/style) → Article draft as HTML + visual suggestions (cover + supporting)
4. **Human review gate** → Reviewer edits draft in rich text editor (Tiptap), adjusts visual suggestions (add/edit/remove), then approves or requests revision
5. **Approve** → n8n formats HTML for Webflow, injects visual placeholders at specified placements, pushes to Webflow CMS. Status → `published` ("Added to CMS")
6. **User adds images in Webflow** → Replaces placeholders with actual visuals, publishes live
7. **Internal linking** (n8n + LLM + Supabase) → Bidirectional link suggestions between articles
8. **Performance monitoring** (n8n scheduled + DataForSEO) → Tracks impressions, clicks, avg position, CTR per keyword

### Status Details
| Status | Label | What happens |
|--------|-------|-------------|
| `brief` | Brief | LLM generates structured brief. User can edit before draft generation. |
| `draft` | Draft | LLM has generated article + visual suggestions. Waiting for human review. |
| `review` | In review | Human is actively reviewing. Same UI as draft (rich text editor + visual suggestions + review actions). |
| `cms_ready` | CMS ready | Transient state — n8n is formatting HTML and pushing to Webflow. Resolves automatically. |
| `published` | Added to CMS | Article is in Webflow CMS with visual placeholders. User replaces with real images and publishes live. |

### Review Flow
- **Draft vs In Review:** Both statuses show the same UI (editable draft + review actions). `draft` = LLM has generated the article, waiting for a human. `review` = a human is actively reviewing it. For this prototype both behave identically — the distinction exists for future workflow logic (e.g. auto-assign, notifications).
- Reviewer sees the draft in a **rich text editor** (Tiptap) — they can edit content directly (formatting, headings, lists, links) without raw HTML. This avoids unnecessary LLM round-trips for small edits.
- **Approve** → triggers n8n workflow: formats HTML (injects visual placeholders) → pushes to Webflow CMS → status → `published` ("Added to CMS")
- **Request revision** → frontend saves revision notes + keeps status as `draft` directly in Supabase (no n8n needed — user edits manually via rich text editor)

### Visual Suggestions
Two categories of visual suggestions are generated per article:
- **Cover** — the hero visual at the top of the article
- **Supporting visuals** — diagrams, infographics, tables etc. placed within the article body

Each suggestion includes a description and placement hint. Users can **edit, add, and remove** suggestions during draft/review. When the article is approved:
- n8n injects placeholder blocks into the HTML at each suggestion's placement (styled placeholder with the description text)
- The article is pushed to Webflow CMS with placeholders in place
- The user replaces placeholders with actual images in Webflow as a final step before going live

Future versions could connect to an image generation workflow (DALL-E, Midjourney API) to auto-generate visuals from the descriptions.

### Internal Links
Internal links show: anchor text, status (suggested/approved/applied/rejected), direction (links to / linked from), and the linked article's title (clickable). Links are bidirectional — the UI shows both outgoing and incoming links for the current article.

### Article Input Fields
- **"What is it?"** — Topic/angle description (required)
- **"Who is it for?"** — Target audience from predefined dropdown: Sustainability managers, ESG analysts & reporting teams, CFOs & finance leaders, Compliance officers, Procurement & supply chain managers, C-suite / board members, Sustainability consultants
- **"What do you want to get across?"** — Human sauce: unique insights, opinions, data points the AI should weave into the content (optional but encouraged)

## Data Model (Supabase)
4 tables: `articles` (pipeline state machine), `internal_links` (link graph), `performance_metrics` (time-series SEO data), `existing_content` (scraped Academy articles for linking context). Full schema with column types and constraints in `/schema/supabase-schema.md`.

## Key Principles
- Breadth over depth: full pipeline working end-to-end matters more than any single step being perfect
- Keep it real: use actual APIs (Webflow, DataForSEO) where possible, not mocks
- Coolset tone: all LLM-generated content must follow the extracted tone/style guide (see /reference/coolset-style-guide.md once created)
- Time-boxed: ~8 hours total. Don't overengineer.

## Tech Stack Decisions
- Next.js 16 (App Router) + shadcn/ui v4 + Tailwind CSS v4 + Tiptap (rich text editor)
- DM Sans font (sans-serif)
- Vercel for deployment
- n8n Cloud for workflow orchestration
- Supabase for database + Realtime
- Webflow CMS API for publishing
- DataForSEO for SEO/performance data
- OpenRouter for LLM calls (used in n8n workflows)

## n8n Workflows & Frontend Responsibilities

### What the frontend handles directly (Supabase reads/writes, no n8n):
- Insert article row (topic, audience, human_input, status=brief)
- Save brief edits (update brief_json)
- Save draft edits from Tiptap (update draft_html)
- Save visual suggestion edits (update visual_suggestions)
- Save revision notes (update revision_notes, keep status=draft)
- All reads, Realtime subscriptions, status display

### n8n workflows (only for external API calls):
| # | Workflow | Trigger | What it does |
|---|---------|---------|-------------|
| 1 | Generate brief | Webhook | Reads article from Supabase → LLM call (OpenRouter) → writes brief_json back |
| 2 | Generate draft | Webhook | Reads brief_json → LLM call → writes draft_html + visual_suggestions → status → `draft` |
| 3 | Publish to Webflow | Webhook | Reads draft_html + visual_suggestions → injects placeholders → Webflow CMS API → saves webflow IDs → status → `published` |
| 4 | Internal linking | Webhook (stretch) | After publish: queries existing articles → LLM suggests links → inserts into internal_links table |
| 5 | Performance monitoring | Scheduled (stretch) | DataForSEO API for published articles → inserts into performance_metrics |

Workflows 1-3 are required for end-to-end. Workflows 4-5 are stretch goals — UI already supports displaying their data via mock data.

## Project Structure
```
/coolset-content-engine/    # Next.js app (Content Engine UI)
/n8n/                       # n8n workflow exports/documentation
/prompts/                   # AI/LLM prompts (system + user prompts for content generation)
/schema/                    # Database schema definitions (Supabase)
/reference/                 # Style guide, scraped content, research notes
/docs/                      # Case brief, strategic write-up, demo/decision notes
```

## Brand Colors (Coolset)
- White 1: #FFFFFF
- White 2: #FAFBFF
- Blue 1: #060850 (dark/primary)
- Blue 2: #2E43FF (accent)
- Blue 3: #80B3FF (light accent)

Use these to theme the shadcn components. The UI should feel clean and professional, aligned with Coolset's brand.

## Current State
- **UI is fully built** with mock data — all pages, components, and flows working
- **Not yet connected** to Supabase or n8n — uses in-memory mock store
- **Next step:** Swap mock store for Supabase hooks, set up n8n workflows, test end-to-end
- **Pending Supabase migration:** `ALTER TABLE articles ADD COLUMN target_audience text; ALTER TABLE articles ADD COLUMN human_input text;`

## What NOT to Do
- Don't build auth or user management
- Don't over-polish the UI — functional and clean is enough
- Don't spend more than ~30min on any single pipeline step before moving on
- Don't write the strategic one-pager until the prototype is done
