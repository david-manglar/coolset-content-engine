'use client'

import { useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface MetaDescriptionFieldProps {
  articleId: string
  value: string | null
}

export function MetaDescriptionField({ articleId, value }: MetaDescriptionFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  async function handleBlur() {
    const current = ref.current?.value ?? ''
    const { error } = await supabase
      .from('articles')
      .update({ meta_description: current })
      .eq('id', articleId)
    if (error) toast.error('Failed to save meta description.')
  }

  return (
    <div className="mb-6 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Meta description</p>
      <Textarea
        ref={ref}
        defaultValue={value ?? ''}
        onBlur={handleBlur}
        placeholder="Write a meta description for this article (max 160 chars)"
        maxLength={160}
        rows={2}
        className="resize-none text-sm bg-[#FAFBFF] border-border"
      />
      <p className="text-right text-xs text-muted-foreground">{(value ?? '').length}/160</p>
    </div>
  )
}
