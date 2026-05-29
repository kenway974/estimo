'use client'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxRating?: number
  interactive?: boolean
  onRate?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export function StarRating({ rating, maxRating = 5, interactive = false, onRate, size = 'md' }: StarRatingProps) {
  const sizes = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-6 w-6' }

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: maxRating }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizes[size],
            i < rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200',
            interactive && 'cursor-pointer hover:fill-amber-300 hover:text-amber-300 transition-colors'
          )}
          onClick={() => interactive && onRate?.(i + 1)}
        />
      ))}
    </div>
  )
}