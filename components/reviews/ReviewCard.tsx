import { StarRating } from './StarRating'
import { CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ReviewCardProps {
  authorName: string
  authorCity?: string | null
  rating: number
  content: string
  service?: string | null
  verified?: boolean
  createdAt: Date | string
  source?: 'SITE' | 'GOOGLE'
}

export function ReviewCard({ authorName, authorCity, rating, content, service, verified, createdAt, source }: ReviewCardProps) {
  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-brand-navy">{authorName}</span>
            {verified && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" />
                Vérifié
              </span>
            )}
            {source === 'GOOGLE' && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Google</span>
            )}
          </div>
          {authorCity && <span className="text-sm text-slate-500">{authorCity}</span>}
        </div>
        <StarRating rating={rating} size="sm" />
      </div>
      <p className="text-slate-700 text-sm leading-relaxed mb-3">&ldquo;{content}&rdquo;</p>
      <div className="flex items-center justify-between">
        {service && (
          <span className="text-xs bg-orange-50 text-brand-orange px-2 py-1 rounded-full">{service}</span>
        )}
        <span className="text-xs text-slate-400 ml-auto">
          {formatDistanceToNow(date, { addSuffix: true, locale: fr })}
        </span>
      </div>
    </div>
  )
}