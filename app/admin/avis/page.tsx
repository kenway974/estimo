import { prisma } from '@/lib/prisma'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { revalidatePath } from 'next/cache'

async function getReviews() {
  try {
    return await prisma.review.findMany({ orderBy: { createdAt: 'desc' } })
  } catch { return [] }
}

async function publishReview(id: string) {
  'use server'
  await prisma.review.update({ where: { id }, data: { published: true, verified: true } })
  revalidatePath('/admin/avis')
  revalidatePath('/avis')
}

async function deleteReview(id: string) {
  'use server'
  await prisma.review.delete({ where: { id } })
  revalidatePath('/admin/avis')
}

export default async function AdminAvisPage() {
  const reviews = await getReviews()
  const pending = reviews.filter((r) => !r.published)
  const published = reviews.filter((r) => r.published)

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Gestion des avis</h1>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-slate-700 mb-4">À modérer ({pending.length})</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pending.map((r) => (
              <div key={r.id} className="border-2 border-amber-200 rounded-xl overflow-hidden">
                <ReviewCard {...r} createdAt={r.createdAt} />
                <div className="flex gap-2 p-3 bg-amber-50 border-t border-amber-200">
                  <form action={publishReview.bind(null, r.id)}>
                    <button type="submit" className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-600">Publier</button>
                  </form>
                  <form action={deleteReview.bind(null, r.id)}>
                    <button type="submit" className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-200">Supprimer</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-slate-700 mb-4">Publiés ({published.length})</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {published.map((r) => (
            <div key={r.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <ReviewCard {...r} createdAt={r.createdAt} />
              <div className="flex gap-2 p-3 bg-slate-50 border-t">
                <form action={deleteReview.bind(null, r.id)}>
                  <button type="submit" className="text-red-400 hover:text-red-600 text-xs">Supprimer</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
