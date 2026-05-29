import Link from 'next/link'
import Image from 'next/image'
import { Clock, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface BlogCardProps {
  slug: string
  title: string
  excerpt: string
  category: string
  readingTime: number
  publishedAt: Date | string | null
  imageUrl?: string | null
  imageAlt?: string | null
}

export function BlogCard({ slug, title, excerpt, category, readingTime, publishedAt, imageUrl, imageAlt }: BlogCardProps) {
  const date = publishedAt ? (typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt) : null

  return (
    <article className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all group">
      <div className="relative h-48 bg-gradient-to-br from-brand-navy to-brand-navy-light overflow-hidden">
        {imageUrl ? (
          <Image src={imageUrl} alt={imageAlt || title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <span className="text-white text-6xl">🔧</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-brand-orange text-white text-xs px-2 py-1 rounded-full font-medium">{category}</span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
          {date && <span>{format(date, 'dd MMMM yyyy', { locale: fr })}</span>}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {readingTime} min
          </span>
        </div>
        <h3 className="font-heading font-bold text-brand-navy mb-2 line-clamp-2 group-hover:text-brand-orange transition-colors">
          {title}
        </h3>
        <p className="text-slate-500 text-sm line-clamp-3 mb-4">{excerpt}</p>
        <Link
          href={`/blog/${slug}`}
          className="inline-flex items-center gap-2 text-brand-orange font-medium text-sm hover:gap-3 transition-all"
        >
          Lire l’article <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}