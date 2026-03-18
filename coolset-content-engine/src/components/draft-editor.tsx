'use client'

import { useState, useCallback, useRef, memo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Button } from '@/components/ui/button'
import { ArticlePreview } from '@/components/article-preview'
import { toast } from 'sonner'

interface DraftEditorProps {
  html: string
  onSave?: (html: string) => void
  readOnly?: boolean
}

function LinkInput({
  onSubmit,
  onCancel,
  initialUrl = '',
}: {
  onSubmit: (url: string) => void
  onCancel: () => void
  initialUrl?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-1.5 rounded border bg-white px-2 py-1 shadow-sm">
      <input
        ref={inputRef}
        type="url"
        defaultValue={initialUrl}
        placeholder="https://..."
        autoFocus
        className="w-56 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            const val = inputRef.current?.value.trim()
            if (val) onSubmit(val)
          }
          if (e.key === 'Escape') onCancel()
        }}
      />
      <button
        type="button"
        onClick={() => {
          const val = inputRef.current?.value.trim()
          if (val) onSubmit(val)
        }}
        className="rounded px-1.5 py-0.5 text-xs font-medium text-accent hover:bg-accent/10"
      >
        Apply
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted"
      >
        Cancel
      </button>
    </div>
  )
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  const [showLinkInput, setShowLinkInput] = useState(false)

  if (!editor) return null

  const btnClass = (active: boolean) =>
    `px-2 py-1 text-sm rounded ${active ? 'bg-accent text-white' : 'bg-muted text-foreground hover:bg-muted/80'}`

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b bg-white/95 px-3 py-2 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnClass(editor.isActive('heading', { level: 1 }))}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive('heading', { level: 2 }))}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btnClass(editor.isActive('heading', { level: 3 }))}
      >
        H3
      </button>

      <div className="mx-1 w-px self-stretch bg-border" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
      >
        <em>I</em>
      </button>

      <div className="mx-1 w-px self-stretch bg-border" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
      >
        &bull; List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive('orderedList'))}
      >
        1. List
      </button>

      <div className="mx-1 w-px self-stretch bg-border" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive('blockquote'))}
      >
        Quote
      </button>

      {showLinkInput ? (
        <LinkInput
          initialUrl={editor.getAttributes('link').href || ''}
          onSubmit={(url) => {
            editor.chain().focus().setLink({ href: url }).run()
            setShowLinkInput(false)
          }}
          onCancel={() => {
            editor.chain().focus().run()
            setShowLinkInput(false)
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowLinkInput(true)}
          className={btnClass(editor.isActive('link'))}
        >
          Link
        </button>
      )}

      {editor.isActive('link') && !showLinkInput && (
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
        >
          Unlink
        </button>
      )}

      <div className="mx-1 w-px self-stretch bg-border" />

      <button
        type="button"
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        className="rounded px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
      >
        Clear formatting
      </button>
    </div>
  )
}

export const DraftEditor = memo(function DraftEditor({ html, onSave, readOnly = false }: DraftEditorProps) {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview')
  const [savedHtml, setSavedHtml] = useState(html)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: savedHtml,
    editable: true,
    immediatelyRender: false,
  })

  const handleSave = useCallback(() => {
    if (!editor) return
    const newHtml = editor.getHTML()
    setSavedHtml(newHtml)
    onSave?.(newHtml)
    setMode('preview')
    toast.success('Draft updated')
  }, [editor, onSave])

  const handleCancel = useCallback(() => {
    editor?.commands.setContent(savedHtml)
    setMode('preview')
  }, [editor, savedHtml])

  const handleEdit = useCallback(() => {
    editor?.commands.setContent(savedHtml)
    setMode('edit')
  }, [editor, savedHtml])

  if (mode === 'preview') {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Draft preview</h2>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              Edit draft
            </Button>
          )}
        </div>
        <ArticlePreview html={savedHtml} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium">Editing draft</h2>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            Save changes
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
      <div className="rounded-lg border bg-white overflow-hidden max-h-[70vh] overflow-y-auto">
        <Toolbar editor={editor} />
        <div className="p-8">
          <EditorContent
            editor={editor}
            className="prose prose-zinc max-w-none prose-headings:text-foreground prose-p:text-foreground/80 prose-a:text-accent focus:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[200px]"
          />
        </div>
      </div>
    </div>
  )
})
