import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const WEBFLOW_SITE_ID = '69b9bf2cdf9f7d46ffb459d9'
const WEBFLOW_COLLECTION_ID = '69b9bf7a2b437f32282547f9'
const WEBFLOW_API_TOKEN = process.env.WEBFLOW_TOKEN!

export async function POST(request: NextRequest) {
  let article_id: string | undefined

  try {
    const body = await request.json()
    article_id = body.article_id

    if (!article_id) {
      return NextResponse.json({ error: 'article_id is required' }, { status: 400 })
    }

    // 1. Fetch article from Supabase
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', article_id)
      .single()

    if (error || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const html = article.draft_html || article.final_html
    if (!html) {
      return NextResponse.json({ error: 'No HTML content to publish' }, { status: 400 })
    }

    // 2. Mark as cms_ready (transitional)
    await supabase.from('articles').update({ status: 'cms_ready' }).eq('id', article_id)

    // 3. Build visual suggestions context
    const visualSuggestions: Array<{ type: string; description: string; placement: string }> =
      article.visual_suggestions || []
    const visualsText =
      visualSuggestions.length > 0
        ? `\nVisual placeholders to inject:\n${visualSuggestions
            .map(
              (v, i) =>
                `${i + 1}. [${v.type.toUpperCase()}] "${v.description}" — placement: ${v.placement}`
            )
            .join('\n')}`
        : ''

    const slug =
      article.slug ||
      (article.title || 'article')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80)

    const metaDescription =
      article.meta_description ||
      (article.brief_json
        ? `${article.brief_json.keyword} — insights for ${article.brief_json.audience}`
        : article.title)

    // 4. Call Claude with a publish_to_webflow tool
    const tools: Anthropic.Tool[] = [
      {
        name: 'publish_to_webflow',
        description: 'Publish the formatted article HTML to Webflow CMS as a new collection item',
        input_schema: {
          type: 'object' as const,
          properties: {
            name: { type: 'string', description: 'Article title' },
            slug: {
              type: 'string',
              description: 'URL slug — alphanumeric and hyphens only, no spaces',
            },
            post_body: {
              type: 'string',
              description: 'Final HTML content with visual placeholders injected',
            },
            meta_description: { type: 'string', description: 'SEO meta description, max 160 chars' },
          },
          required: ['name', 'slug', 'post_body', 'meta_description'],
        },
      },
    ]

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `You are publishing a sustainability article to the Coolset Insights Webflow CMS.

Article title: ${article.title}
Slug: ${slug}
Meta description: ${metaDescription}
${visualsText}

HTML content:
${html}

Instructions:
1. If there are visual placeholders listed above, inject them into the HTML at the described placements using this exact format:
<div class="visual-placeholder" style="background:#f0f4ff;border:2px dashed #2E43FF;border-radius:8px;padding:32px 24px;margin:40px 0;text-align:center;color:#2E43FF;font-weight:500;">📷 [TYPE] Description here</div>

2. Call publish_to_webflow with the final HTML.`,
      },
    ]

    // Agentic loop — Claude will call the tool
    let response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8192,
      tools,
      messages,
    })

    let webflowItemId: string | null = null
    let webflowSlug: string | null = null

    while (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )
      if (!toolUse || toolUse.name !== 'publish_to_webflow') break

      const input = toolUse.input as {
        name: string
        slug: string
        post_body: string
        meta_description: string
      }

      // 5. Call Webflow CMS API directly
      const wfResponse = await fetch(
        `https://api.webflow.com/v2/collections/${WEBFLOW_COLLECTION_ID}/items/live`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isArchived: false,
            isDraft: false,
            fieldData: {
              name: input.name,
              slug: input.slug,
              'post-body': input.post_body,
              'meta-description': input.meta_description.slice(0, 160),
            },
          }),
        }
      )

      if (!wfResponse.ok) {
        const errorText = await wfResponse.text()
        throw new Error(`Webflow API error: ${wfResponse.status} — ${errorText}`)
      }

      const wfData = await wfResponse.json()
      webflowItemId = wfData.id
      webflowSlug = wfData.fieldData?.slug || input.slug

      // Continue conversation with tool result
      messages.push({ role: 'assistant', content: response.content })
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({ success: true, item_id: webflowItemId }),
          },
        ],
      })

      response = await anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 256,
        tools,
        messages,
      })
    }

    // 6. Publish the Webflow site so the article goes live
    await fetch(`https://api.webflow.com/v2/sites/${WEBFLOW_SITE_ID}/publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publishToWebflowSubdomain: true, customDomains: [] }),
    })

    // 7. Update Supabase to published
    await supabase
      .from('articles')
      .update({
        status: 'published',
        webflow_item_id: webflowItemId,
        webflow_slug: webflowSlug,
      })
      .eq('id', article_id)

    return NextResponse.json({
      success: true,
      webflow_item_id: webflowItemId,
      webflow_slug: webflowSlug,
      url: `https://coolset-blog-sample.webflow.io/blog-posts/${webflowSlug}`,
    })
  } catch (err) {
    console.error('[publish] error:', err)

    // Reset status back to draft on failure
    if (article_id) {
      await supabase.from('articles').update({ status: 'draft' }).eq('id', article_id)
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to publish' },
      { status: 500 }
    )
  }
}
