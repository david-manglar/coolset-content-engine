'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'

interface ReviewActionsProps {
  articleId: string
  status: string
}

export function ReviewActions({ articleId, status }: ReviewActionsProps) {
  const [approving, setApproving] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleApprove() {
    setApproving(true)
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Publish failed')
      }
      toast.success('Published to Webflow!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish.')
    } finally {
      setApproving(false)
    }
  }

  async function handleSaveChanges() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('articles')
        .update({ status: 'review' })
        .eq('id', articleId)

      if (error) throw error

      toast.success('Changes saved.')
    } catch {
      toast.error('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex gap-3">
      <Button onClick={handleApprove} disabled={approving} className="bg-emerald-600 hover:bg-emerald-700">
        {approving && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
        {approving ? 'Publishing...' : 'Approve & Publish'}
      </Button>

      {status === 'draft' && (
        <Button variant="outline" onClick={handleSaveChanges} disabled={saving}>
          {saving && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      )}
    </div>
  )
}
