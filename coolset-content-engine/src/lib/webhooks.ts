const WEBHOOK_URLS = {
  generateBrief: process.env.NEXT_PUBLIC_N8N_WEBHOOK_GENERATE_BRIEF,
  generateDraft: process.env.NEXT_PUBLIC_N8N_WEBHOOK_GENERATE_DRAFT,
  publish: process.env.NEXT_PUBLIC_N8N_WEBHOOK_PUBLISH,
} as const

type WebhookName = keyof typeof WEBHOOK_URLS

export async function triggerWebhook(
  webhook: WebhookName,
  payload: Record<string, unknown>
): Promise<unknown> {
  const url = WEBHOOK_URLS[webhook]
  if (!url) {
    console.warn(`Webhook URL not configured: ${webhook}`)
    return null
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`Webhook ${webhook} failed: ${res.status}`)
  }

  const text = await res.text()
  if (!text) return { success: true }
  try {
    return JSON.parse(text)
  } catch {
    return { success: true, raw: text }
  }
}
