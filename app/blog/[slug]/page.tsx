import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { BlogPostSchema } from '@/components/seo/SchemaOrg'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react'
import { BlogCard } from '@/components/blog/BlogCard'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Article introuvable' }
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt?.toISOString(),
    },
  }
}

async function getPost(slug: string) {
  try {
    return await prisma.blogPost.findFirst({ where: { slug, published: true } })
  } catch {
    return null
  }
}

async function getRelated(currentSlug: string, category: string) {
  try {
    return await prisma.blogPost.findMany({
      where: { published: true, category, slug: { not: currentSlug } },
      take: 3,
    })
  } catch {
    return []
  }
}

function renderContent(content: string): string {
  return content
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-brand-navy mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-brand-navy mt-10 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-brand-navy mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-brand-navy">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="flex items-start gap-2 text-slate-700"><span class="text-brand-orange mt-1">•</span><span>$1</span></li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="flex items-start gap-2 text-slate-700 ml-2"><span class="font-semibold text-brand-orange min-w-[1.5rem]">$1.</span><span>$2</span></li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="space-y-2 my-4 pl-2">$&</ul>')
    .replace(/\n\n/g, '</p><p class="text-slate-700 leading-relaxed my-4">')
    .replace(/^(?!<)(.+)$/gm, '<p class="text-slate-700 leading-relaxed my-4">$1</p>')
    .replace(/\|(.+)\|/g, (m) => {
      const cells = m.split('|').filter(Boolean)
      return `<tr>${cells.map((c) => `<td class="border border-slate-200 px-3 py-2 text-sm">${c.trim()}</td>`).join('')}</tr>`
    })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const [post, related] = await Promise.all([getPost(slug), getPost(slug).then((p) => p ? getRelated(slug, p.category) : [])])

  if (!post) notFound()

  return (
    <>
      <BlogPostSchema post={post} />
      <div className="min-h-screen bg-slate-50">
        {/* Hero */}
        <div className="bg-brand-navy py-16 text-white">
          <div className="container-site max-w-3xl">
            <Link href="/blog" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6">
              <ArrowLeft className="h-4 w-4" /> Retour au blog
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-brand-orange/20 text-brand-orange text-xs px-3 py-1 rounded-full">{post.category}</span>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                {post.publishedAt && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(post.publishedAt, 'dd MMMM yyyy', { locale: fr })}</span>}
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{post.readingTime} min</span>
              </div>
            </div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl leading-tight">{post.title}</h1>
          </div>
        </div>

        <div className="container-site max-w-3xl py-12">
          {/* Article */}
          <article className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
            <p className="text-lg text-slate-500 leading-relaxed mb-6 font-medium italic">{post.excerpt}</p>
            <div dangerouslySetInnerHTML={{ __html: renderContent(post.content) }} />

            {/* Auteur */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-navy rounded-full flex items-center justify-center text-white font-bold">JP</div>
              <div>
                <div className="font-semibold text-brand-navy">Jean-Pierre</div>
                <div className="text-sm text-slate-500">Gérant JP Clim Chauffagiste · Île-de-France · Expérience depuis 2008</div>
              </div>
            </div>
          </article>

          {/* CTA intégré */}
          <div className="bg-brand-navy text-white rounded-2xl p-8 mb-8">
            <h2 className="font-heading font-bold text-xl mb-3">Besoin d'un professionnel ?</h2>
            <p className="text-slate-400 text-sm mb-5">JP Clim intervient en Île-de-France pour tous vos travaux de chauffage, climatisation et VMC.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/estimation" className="bg-brand-orange hover:bg-brand-orange-dark text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors inline-flex items-center gap-2">
                Estimation gratuite <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="tel:0652495290" className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                📞 06 52 49 52 90
              </a>
            </div>
          </div>

          {/* Articles liés */}
          {related.length > 0 && (
            <div>
              <h2 className="font-heading font-bold text-brand-navy text-xl mb-5">Articles similaires</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {related.map((p) => <BlogCard key={p.id} {...p} publishedAt={p.publishedAt} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
