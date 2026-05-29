import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_LABELS: Record<string, string> = {
  ESTIMATE_VIEWED: 'Estimation vue',
  QUOTE_SENT: 'Devis envoyé',
  CALLBACK_REQUESTED: 'Rappel demandé',
  APPOINTMENT_BOOKED: 'RDV pris',
  CONTACTED: 'Contacté',
  CONVERTED: 'Converti',
  LOST: 'Perdu',
}

const STATUS_COLORS: Record<string, string> = {
  ESTIMATE_VIEWED: 'bg-slate-100 text-slate-600',
  QUOTE_SENT: 'bg-blue-100 text-blue-700',
  CALLBACK_REQUESTED: 'bg-orange-100 text-orange-700',
  APPOINTMENT_BOOKED: 'bg-purple-100 text-purple-700',
  CONTACTED: 'bg-cyan-100 text-cyan-700',
  CONVERTED: 'bg-emerald-100 text-emerald-700',
  LOST: 'bg-red-100 text-red-700',
}

async function getLeads() {
  try {
    return await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: { events: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })
  } catch { return [] }
}

export default async function AdminLeadsPage() {
  const leads = await getLeads()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Leads ({leads.length})</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Prénom', 'Contact', 'Service', 'Estimation', 'Statut', 'Dernier événement', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{lead.firstName}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{lead.phone}</div>
                    {lead.email && <div className="text-slate-400 text-xs">{lead.email}</div>}
                    <div className="text-slate-400 text-xs">{lead.city}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.serviceType}</td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {lead.estimateMin.toLocaleString('fr-FR')}€ – {lead.estimateMax.toLocaleString('fr-FR')}€
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[lead.status] || lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {lead.events[0]?.type || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(lead.createdAt, 'dd/MM/yy HH:mm', { locale: fr })}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Aucun lead</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
