'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { triggerWebhook } from '@/lib/webhooks'
import { AUDIENCES } from '@/lib/constants'
import { Loader2Icon, PlusIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

interface Claim {
  text: string
  source: string
}

function serializeResearchInput(claims: Claim[], angle: string, avoid: string): string {
  const parts: string[] = []
  const validClaims = claims.filter((c) => c.text.trim())
  if (validClaims.length > 0) {
    parts.push('KEY CLAIMS:\n' + validClaims.map((c) => `- ${c.text.trim()}${c.source.trim() ? ` (source: ${c.source.trim()})` : ''}`).join('\n'))
  }
  if (angle.trim()) parts.push(`OUR ANGLE:\n${angle.trim()}`)
  if (avoid.trim()) parts.push(`AVOID:\n${avoid.trim()}`)
  return parts.join('\n\n')
}

export function ArticleForm() {
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('')
  const [claims, setClaims] = useState<Claim[]>([{ text: '', source: '' }])
  const [angle, setAngle] = useState('')
  const [avoid, setAvoid] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  function addClaim() {
    setClaims((prev) => [...prev, { text: '', source: '' }])
  }

  function removeClaim(i: number) {
    setClaims((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateClaim(i: number, field: keyof Claim, value: string) {
    setClaims((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return

    setSubmitting(true)

    try {
      // 1. Insert article directly into Supabase
      const slug = topic
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60)

      const humanInput = serializeResearchInput(claims, angle, avoid)

      const { data, error } = await supabase
        .from('articles')
        .insert({
          title: topic
            .trim()
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
          slug,
          status: 'brief',
          topic_input: topic.trim(),
          target_audience: audience || null,
          human_input: humanInput || null,
        })
        .select('id')
        .single()

      if (error) throw error

      // 2. Trigger n8n to generate the brief
      await triggerWebhook('generateBrief', { article_id: data.id })

      toast.success('Article created! Generating brief...')
      router.push(`/articles/${data.id}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to create article.')
    } finally {
      setSubmitting(false)
    }
  }

  const isValid = topic.trim().length > 0 && audience.length > 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="topic">What is it?</Label>
        <Textarea
          id="topic"
          placeholder="e.g., A guide to CSRD double materiality assessments for companies approaching compliance for the first time"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground">
          Describe the topic and angle for this piece.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Who is it for?</Label>
        <Select value={audience} onValueChange={(val) => setAudience(val ?? '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select target audience" />
          </SelectTrigger>
          <SelectContent>
            {AUDIENCES.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-5 rounded-lg border border-border bg-muted/30 p-4">
        <div>
          <p className="text-sm font-medium mb-0.5">Research input</p>
          <p className="text-sm text-muted-foreground">
            What the AI can't invent: proprietary data, your POV, guardrails.
          </p>
        </div>

        {/* Key claims */}
        <div className="space-y-2">
          <Label>Key claims & data points</Label>
          <p className="text-xs text-muted-foreground -mt-1">
            Stats, findings, or specific claims that should anchor the piece.
          </p>
          <div className="space-y-2">
            {claims.map((claim, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex-1 space-y-1.5">
                  <Input
                    placeholder="e.g., 73% of European companies will miss CSRD deadlines without external help"
                    value={claim.text}
                    onChange={(e) => updateClaim(i, 'text', e.target.value)}
                  />
                  <Input
                    placeholder="Source URL or reference (optional)"
                    value={claim.source}
                    onChange={(e) => updateClaim(i, 'source', e.target.value)}
                    className="text-xs"
                  />
                </div>
                {claims.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => removeClaim(i)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1"
            onClick={addClaim}
          >
            <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
            Add claim
          </Button>
        </div>

        {/* Our angle */}
        <div className="space-y-2">
          <Label htmlFor="angle">Our angle</Label>
          <p className="text-xs text-muted-foreground -mt-1">
            Coolset's take. What should readers walk away believing?
          </p>
          <Textarea
            id="angle"
            placeholder="e.g., Most companies treat double materiality as a compliance checkbox. We think it's actually a strategic lens for identifying long-term risk. The piece should push this."
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* What to avoid */}
        <div className="space-y-2">
          <Label htmlFor="avoid">What to avoid</Label>
          <p className="text-xs text-muted-foreground -mt-1">
            Incorrect framings, outdated data, competitor mentions, legal sensitivities.
          </p>
          <Textarea
            id="avoid"
            placeholder="e.g., Don't cite the 2022 EU Taxonomy figures, these were updated in Q1 2024. Avoid mentioning competitors by name."
            value={avoid}
            onChange={(e) => setAvoid(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>
      </div>

      <Button type="submit" disabled={!isValid || submitting}>
        {submitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
        {submitting ? 'Generating brief...' : 'Generate Brief'}
      </Button>
    </form>
  )
}
