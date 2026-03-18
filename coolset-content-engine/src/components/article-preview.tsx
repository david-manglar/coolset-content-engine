export function ArticlePreview({ html }: { html: string }) {
  return (
    <div className="rounded-lg border bg-white p-8">
      <div
        className="prose prose-zinc max-w-none prose-headings:text-foreground prose-p:text-foreground/80 prose-a:text-accent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
