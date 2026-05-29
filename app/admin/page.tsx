import { prisma } from '@/lib/prisma'
import { Users, Calendar, Star, TrendingUp } from 'lucide-react'

async function getStats() {
  try {
    const [totalLeads, newLeads, bookings, reviews] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.review.count({ where: { published: false } }),
    ])
    return { totalLeads, newLeads, bookings, reviews }
  } catch {
    return { totalLeads: 0, newLeads: 0, bookings: 0, reviews: 0 }
  }
}

async function getRecentLeads() {
  try {
    return await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  } catch {
    return []
  }
}

export default async function AdminPage() {
  const [stats, leads] = await Promise.all([getStats(), getRecentLeads()])

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: 'Leads total', value: stats.totalLeads, color: 'text-blue-500 bg-blue-50' },
          { icon: TrendingUp, label: 'Cette semaine', value: stats.newLeads, color: 'text-emerald-500 bg-emerald-50' },
          { icon: Calendar, label: 'RDV en attente', value: stats.bookings, color: 'text-orange-500 bg-orange-50' },
          { icon: Star, label: 'Avis à modérer', value: stats.reviews, color: 'text-purple-500 bg-purple-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{value}</div>
            <div className="text-sm text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Derniers leads</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Prénom', 'Ville', 'Service', 'Estimation', 'Statut', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{lead.firstName}</td>
                  <td className="px-4 py-3 text-slate-500">{lead.city}</td>
                  <td className="px-4 py-3 text-slate-500">{lead.serviceType}</td>
                  <td className="px-4 py-3 text-slate-700">{lead.estimateMin.toLocaleString('fr-FR')}–{lead.estimateMax.toLocaleString('fr-FR')}€</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      lead.status === 'APPOINTMENT_BOOKED' ? 'bg-emerald-100 text-emerald-700' :
                      lead.status === 'QUOTE_SENT' ? 'bg-blue-100 text-blue-700' :
                      lead.status === 'CALLBACK_REQUESTED' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{new Date(lead.createdAt).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucun lead pour le moment</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
