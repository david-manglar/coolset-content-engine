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
import { supabase } from '@/lib/supabase'
import { AUDIENCES } from '@/lib/constants'
import { toast } from 'sonner'
import type { BriefJson } from '@/lib/types'

interface BriefEditorProps {
  articleId: string
  brief: BriefJson
}

export function BriefEditor({ articleId, brief: rawBrief }: BriefEditorProps) {
  // Handle case where brief_json comes as a string from Supabase
  const brief: BriefJson = typeof rawBrief === 'string' ? JSON.parse(rawBrief) : rawBrief

  const [editing, setEditing] = useState(false)
  const [keyword, setKeyword] = useState(brief.keyword)
  const [angle, setAngle] = useState(brief.angle)
  const [audience, setAudience] = useState(brief.audience)
  const [outline, setOutline] = useState((brief.outline ?? []).join('\n'))
  const [keyPoints, setKeyPoints] = useState((brief.key_points ?? []).join('\n'))

  async function handleSave() {
    const updated: BriefJson = {
      keyword: keyword.trim(),
      angle: angle.trim(),
      audience: audience.trim(),
      outline: outline.split('\n').map((l) => l.trim()).filter(Boolean),
      key_points: keyPoints.split('\n').map((l) => l.trim()).filter(Boolean),
    }
    const { error } = await supabase
      .from('articles')
      .update({ brief_json: updated })
      .eq('id', articleId)
    if (error) {
      toast.error('Failed to save brief.')
      return
    }
    setEditing(false)
    toast.success('Brief updated')
  }

  function handleCancel() {
    setKeyword(brief.keyword)
    setAngle(brief.angle)
    setAudience(brief.audience)
    setOutline(brief.outline.join('\n'))
    setKeyPoints(brief.key_points.join('\n'))
    setEditing(false)
  }

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Content Brief</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit brief
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Target keyword</p>
            <p className="mt-0.5">{brief.keyword}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Angle</p>
            <p className="mt-0.5">{brief.angle}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Audience</p>
            <p className="mt-0.5">{brief.audience}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Outline</p>
            <ol className="mt-1 list-inside list-decimal space-y-1 text-sm">
              {brief.outline.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Key points</p>
            <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
              {brief.key_points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit Brief</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="keyword">Target keyword</Label>
          <Input
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="angle">Angle</Label>
          <Textarea
            id="angle"
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Audience</Label>
          <Select value={audience} onValueChange={(val) => setAudience(val ?? audience)}>
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
        <div className="space-y-1.5">
          <Label htmlFor="outline">Outline (one section per line)</Label>
          <Textarea
            id="outline"
            value={outline}
            onChange={(e) => setOutline(e.target.value)}
            rows={6}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="keypoints">Key points (one per line)</Label>
          <Textarea
            id="keypoints"
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            rows={4}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave}>Save changes</Button>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
