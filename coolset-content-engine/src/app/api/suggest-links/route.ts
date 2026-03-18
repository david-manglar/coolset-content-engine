import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_MODEL = 'google/gemini-2.5-flash'

interface ArticleSummary {
  id: string
  title: string
  keyword?: string
  key_points?: string[]
}

interface LinkSuggestion {
  id: string
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY not set' }, { status: 500 })
  }

  const { current, candidates } = (await req.json()) as {
    current: ArticleSummary
    candidates: ArticleSummary[]
  }

  if (!candidates.length) {
    return NextResponse.json({ suggestions: [] })
  }

  const formatArticle = (a: ArticleSummary) =>
    `- ID: ${a.id}\n  Title: ${a.title}\n  Keyword: ${a.keyword ?? 'n/a'}\n  Key points: ${(a.key_points ?? []).join(' | ')}`

  const prompt = `You are an internal linking assistant for Coolset's content team.

Current article:
${formatArticle(current)}

Candidate articles:
${candidates.map(formatArticle).join('\n')}

Which candidates are topically related enough to the current article to warrant an internal link?
Consider semantic relatedness, not just exact keyword matches.

Return ONLY a JSON array of matching IDs (empty array if none):
[{"id": "..."}]`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: `OpenRouter error: ${err}` }, { status: 500 })
  }

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content ?? '[]'

  let suggestions: LinkSuggestion[] = []
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    suggestions = JSON.parse(cleaned)
  } catch {
    return NextResponse.json({ error: 'Failed to parse LLM response', raw }, { status: 500 })
  }

  return NextResponse.json({ suggestions })
}
