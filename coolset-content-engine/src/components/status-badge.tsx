import { STATUS_CONFIG } from '@/lib/constants'
import type { ArticleStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: ArticleStatus }) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.color
      )}
    >
      {config.label}
    </span>
  )
}
