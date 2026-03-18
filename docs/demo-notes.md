# Demo Notes & Decision Log

Key decisions made during planning, with reasoning. Useful for the case presentation to show thinking process.

---

## Architecture: Supabase as the central brain, not just storage

**Decision:** Use Supabase as the source of truth for the entire pipeline — articles, link graph, performance data, scraped content — rather than relying on Webflow or spreadsheets.

**Why:** The bidirectional internal linking requirement is fundamentally a graph problem. Having all content in a queryable database makes link matching, status tracking, and performance monitoring straightforward. It also decouples content management from the CMS — Webflow becomes a publishing destination, not the data layer. This is especially relevant since Coolset currently uses Notion; the same Supabase layer could bridge Notion and Webflow in a production version.

---

## Human-in-the-loop: review the draft, not the CMS-ready output

**Decision:** Place the human review gate after draft generation but before CMS formatting and Webflow publishing.

**Why:** Reviewing after CMS formatting would mean building a preview renderer and wasting formatting work on rejected content. By reviewing the draft directly (which is already HTML), the preview is trivial to render in the UI. More importantly, approval then triggers a satisfying automation cascade — one click fires CMS formatting, Webflow publish, and internal linking all at once. This makes the demo more compelling and the architecture simpler. Rejection is also cheap: no API calls wasted, just loop back through the LLM with revision notes.

---

## Real integrations over mocks

**Decision:** Set up a real Webflow trial account and use DataForSEO's free tier rather than mocking these integrations.

**Why:** Webflow is Coolset's production CMS — showing a real integration demonstrates understanding of their actual stack. DataForSEO's unlimited free trial removes cost as a blocker. The case asks for a prototype that could realistically evolve, and mocked integrations don't prove that the pipeline actually works end-to-end. Breadth over depth: a real but simple integration beats a polished mock.

---

## n8n as orchestration layer, not the UI's backend

**Decision:** Keep all workflow logic in n8n, triggered by webhooks from the Next.js frontend. The frontend calls n8n, n8n does the work, Supabase stores the results.

**Why:** This is a pattern I've used in other automation projects and it plays to my strengths. n8n handles LLM calls, API integrations, and multi-step workflows visually — which is also great for demo purposes (you can show the workflow graph). The frontend stays thin: it's just a UI layer that triggers workflows and reads from Supabase. This separation also means the pipeline can be triggered from other sources later (Slack, scheduled, API) without touching the frontend.

---

## OpenRouter for LLM flexibility

**Decision:** Use OpenRouter for LLM calls in n8n rather than direct API keys for individual providers.

**Why:** OpenRouter gives access to multiple models through one API. This means we can experiment with different models for different pipeline steps (e.g., a cheaper model for formatting, a stronger one for drafting) without managing multiple API keys or changing n8n workflows. Practical for a prototype where you want to iterate quickly.

---

## shadcn/ui + Coolset brand colors

**Decision:** Use shadcn/ui components themed with Coolset's actual brand palette (#060850, #2E43FF, #80B3FF).

**Why:** shadcn gives a clean, professional look out of the box with minimal effort — important when time-boxed to ~8 hours. Using Coolset's actual colors shows attention to detail and makes the demo feel like a real internal tool, not a generic prototype. It's a small investment that significantly improves presentation impact.

---

## DataForSEO: post-publish first, keyword research if time allows

**Decision:** Focus SEO integration on post-publish performance monitoring. Add keyword research at the brief generation stage only if time permits.

**Why:** The case explicitly mentions performance monitoring and iteration triggers. Post-publish monitoring is where the feedback loop closes — it turns the pipeline from a one-shot generator into a continuous improvement system. Keyword research at brief stage is valuable but additive, not essential for the core loop. Time-boxing means doing the most impactful integration first.

---

## No MCPs or special connectors

**Decision:** Skip setting up MCP connectors for Supabase and n8n, despite them being available.

**Why:** For an 8-hour project, the setup time doesn't justify the benefit. We interact with n8n through its visual UI and webhooks, and with Supabase through its JS SDK and dashboard. MCPs would add a layer of convenience during development but wouldn't change the output. Every minute spent on tooling is a minute not spent on the prototype.

---

## Notes for the presentation

- Show the n8n workflow graphs during the demo — they make the automation tangible
- Demo the full loop: topic input → brief → draft → human review → approve → published in Webflow
- Highlight the internal linking logic as the most technically interesting piece
- The one-click approval cascade is a strong demo moment
- Be ready to discuss what a v2 would look like (Notion integration, more review stages, A/B testing, multi-language)
