import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { FileText, Eye, EyeOff } from 'lucide-react'

async function getPosts() {
  try {
    return await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } })
  } catch { return [] }
}

export default async function AdminBlogPage() {
  const posts = await getPosts()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Articles de blog ({posts.length})</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Titre', 'Catégorie', 'Statut', 'Publié le', 'Lecture'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 max-w-xs truncate">{post.title}</div>
                    <div className="text-xs text-slate-400">/blog/{post.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{post.category}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs font-medium ${post.published ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {post.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {post.published ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {post.publishedAt ? format(post.publishedAt, 'dd/MM/yyyy', { locale: fr }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{post.readingTime} min</td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucun article</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
