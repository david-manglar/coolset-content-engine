'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { VisualSuggestion, VisualType } from '@/lib/types'

interface VisualSuggestionsProps {
  suggestions: VisualSuggestion[]
  onUpdate?: (suggestions: VisualSuggestion[]) => void
  readOnly?: boolean
}

function VisualCard({
  suggestion,
  onEdit,
  onRemove,
  readOnly,
}: {
  suggestion: VisualSuggestion
  onEdit?: () => void
  onRemove?: () => void
  readOnly?: boolean
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-sm">{suggestion.description}</p>
      {suggestion.type !== 'cover' && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Placement: {suggestion.placement}
        </p>
      )}
      {!readOnly && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="text-xs text-accent hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-500 hover:underline"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

function VisualForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: VisualSuggestion
  onSave: (suggestion: VisualSuggestion) => void
  onCancel: () => void
}) {
  const [type, setType] = useState<VisualType>(initial?.type ?? 'supporting')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [placement, setPlacement] = useState(initial?.placement ?? '')

  function handleSubmit() {
    if (!description.trim()) return
    onSave({
      type,
      description: description.trim(),
      placement: type === 'cover' ? 'Article header / cover image' : placement.trim(),
    })
  }

  return (
    <div className="space-y-3 rounded-lg border bg-white p-4">
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select value={type} onValueChange={(val) => setType((val as VisualType) ?? type)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">Cover</SelectItem>
            <SelectItem value="supporting">Supporting visual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the visual — what should it show?"
          rows={2}
        />
      </div>
      {type === 'supporting' && (
        <div className="space-y-1.5">
          <Label>Placement</Label>
          <Input
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            placeholder="e.g., After the introduction section"
          />
        </div>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={!description.trim()}>
          {initial ? 'Save' : 'Add'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export function VisualSuggestions({ suggestions, onUpdate, readOnly = false }: VisualSuggestionsProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  const cover = suggestions
    .map((s, i) => ({ ...s, _index: i }))
    .filter((s) => s.type === 'cover')
  const supporting = suggestions
    .map((s, i) => ({ ...s, _index: i }))
    .filter((s) => s.type === 'supporting')

  function handleEdit(index: number, updated: VisualSuggestion) {
    const next = [...suggestions]
    next[index] = updated
    onUpdate?.(next)
    setEditingIndex(null)
    toast.success('Visual suggestion updated')
  }

  function handleRemove(index: number) {
    const next = suggestions.filter((_, i) => i !== index)
    onUpdate?.(next)
    toast.success('Visual suggestion removed')
  }

  function handleAdd(suggestion: VisualSuggestion) {
    onUpdate?.([...suggestions, suggestion])
    setAdding(false)
    toast.success('Visual suggestion added')
  }

  function renderCard(s: VisualSuggestion & { _index: number }) {
    if (editingIndex === s._index) {
      return (
        <VisualForm
          key={s._index}
          initial={s}
          onSave={(updated) => handleEdit(s._index, updated)}
          onCancel={() => setEditingIndex(null)}
        />
      )
    }
    return (
      <VisualCard
        key={s._index}
        suggestion={s}
        readOnly={readOnly}
        onEdit={() => setEditingIndex(s._index)}
        onRemove={() => handleRemove(s._index)}
      />
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Visual suggestions</CardTitle>
        {!readOnly && !adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            Add visual
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {cover.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Cover</p>
            <div className="space-y-2">
              {cover.map(renderCard)}
            </div>
          </div>
        )}

        {supporting.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Supporting visuals</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {supporting.map(renderCard)}
            </div>
          </div>
        )}

        {cover.length === 0 && supporting.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">No visual suggestions yet.</p>
        )}

        {adding && (
          <VisualForm
            onSave={handleAdd}
            onCancel={() => setAdding(false)}
          />
        )}
      </CardContent>
    </Card>
  )
}
