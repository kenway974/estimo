import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Avis clients — JP Clim Chauffagiste Île-de-France',
  description: 'Découvrez les avis de nos clients satisfaits en Île-de-France. Installation chaudière, climatisation, VMC, plomberie. Déposez votre avis.',
}

async function getReviews() {
  try {
    return await prisma.review.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    return []
  }
}

export default async function AvisPage() {
  const reviews = await getReviews()
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '5.0'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-brand-navy py-16 text-white text-center">
        <h1 className="font-heading font-bold text-4xl mb-3">Avis clients</h1>
        <div className="flex items-center justify-center gap-2 mb-2">
          {[1,2,3,4,5].map((i) => <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />)}
          <span className="font-bold text-2xl ml-2">{avgRating}/5</span>
        </div>
        <p className="text-slate-400">{reviews.length} avis vérifiés</p>
      </div>

      <div className="container-site max-w-5xl py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avis */}
          <div className="lg:col-span-2">
            <h2 className="font-heading font-bold text-brand-navy text-2xl mb-6">Ce que disent nos clients</h2>
            {reviews.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-slate-400">
                Soyez le premier à laisser un avis !
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reviews.map((r) => <ReviewCard key={r.id} {...r} createdAt={r.createdAt} />)}
              </div>
            )}
          </div>

          {/* Formulaire */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-fit">
            <h2 className="font-heading font-bold text-brand-navy text-xl mb-4">Déposer mon avis</h2>
            <p className="text-sm text-slate-500 mb-5">Vous avez fait appel à JP Clim ? Partagez votre expérience.</p>
            <ReviewForm />
          </div>
        </div>
      </div>
    </div>
  )
}