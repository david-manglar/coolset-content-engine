import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArticleForm } from '@/components/article-form'

export default function NewArticlePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link
        href="/articles"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to articles
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New Article Brief</CardTitle>
        </CardHeader>
        <CardContent>
          <ArticleForm />
        </CardContent>
      </Card>
    </div>
  )
}
