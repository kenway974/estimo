import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { BlogCard } from '@/components/blog/BlogCard'

export const metadata: Metadata = {
  title: 'Blog & Conseils — Chauffage, Climatisation, VMC | JP Clim',
  description: 'Guides pratiques et conseils d\'experts en chauffage, climatisation et VMC pour les Franciliens. Entretien, économies d\'énergie, choix des équipements.',
}

async function getPosts() {
  try {
    return await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
    })
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const posts = await getPosts()
  const categories = [...new Set(posts.map((p) => p.category))]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-brand-navy py-16 text-white text-center">
        <h1 className="font-heading font-bold text-4xl mb-3">Conseils & guides pratiques</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Des articles rédigés par des professionnels du génie climatique pour vous aider à mieux entretenir vos équipements et optimiser votre consommation.
        </p>
      </div>

      <div className="container-site py-12">
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="bg-brand-orange text-white px-4 py-1.5 rounded-full text-sm font-medium">Tous</span>
            {categories.map((cat) => (
              <span key={cat} className="bg-white text-slate-600 border border-slate-200 px-4 py-1.5 rounded-full text-sm hover:border-brand-orange hover:text-brand-orange cursor-pointer transition-colors">
                {cat}
              </span>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg">Articles bientôt disponibles…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => <BlogCard key={p.id} {...p} publishedAt={p.publishedAt} />)}
          </div>
        )}
      </div>
    </div>
  )
}
