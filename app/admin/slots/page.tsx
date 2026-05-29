'use client'
import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus, Trash2, Loader2, CheckCircle } from 'lucide-react'

interface Slot {
  id: string
  date: string
  startTime: string
  endTime: string
  available: boolean
  duration: number
}

export default function AdminSlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [newSlot, setNewSlot] = useState({ date: '', startHour: '9', duration: '120' })
  const [adding, setAdding] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadSlots()
  }, [])

  const loadSlots = async () => {
    setLoading(true)
    const from = new Date().toISOString()
    const to = addDays(new Date(), 30).toISOString()
    const res = await fetch(`/api/booking/slots?from=${from}&to=${to}`)
    const data = await res.json()
    setSlots(data.slots || [])
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!newSlot.date) return
    setAdding(true)
    const date = new Date(newSlot.date)
    date.setHours(parseInt(newSlot.startHour), 0, 0, 0)
    await fetch('/api/admin/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: date.toISOString(), duration: parseInt(newSlot.duration) }),
    })
    setAdding(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
    loadSlots()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/slots?id=${id}`, { method: 'DELETE' })
    setSlots((s) => s.filter((slot) => slot.id !== id))
  }

  const handleAutoGenerate = async () => {
    setAdding(true)
    await fetch('/api/admin/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoGenerate: true, days: 30 }),
    })
    setAdding(false)
    loadSlots()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gestion des créneaux</h1>
        <button onClick={handleAutoGenerate} disabled={adding} className="bg-brand-navy text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-brand-navy-light transition-colors disabled:opacity-60">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Générer 30 jours
        </button>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Ajouter un créneau manuel</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Date</label>
            <input type="date" value={newSlot.date} onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Heure début</label>
            <select value={newSlot.startHour} onChange={(e) => setNewSlot({ ...newSlot, startHour: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => <option key={h} value={h}>{h}:00</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Durée</label>
            <select value={newSlot.duration} onChange={(e) => setNewSlot({ ...newSlot, duration: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <option value="60">1h</option>
              <option value="120">2h</option>
              <option value="180">3h</option>
            </select>
          </div>
          <button onClick={handleAdd} disabled={adding || !newSlot.date} className="bg-brand-orange text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-brand-orange-dark transition-colors disabled:opacity-60">
            {success ? <CheckCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Ajouter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Créneaux disponibles ({slots.length})</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-orange" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Date', 'Horaire', 'Durée', 'Statut', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {slots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{format(new Date(slot.date), 'EEEE dd MMMM yyyy', { locale: fr })}</td>
                    <td className="px-4 py-3 text-slate-600">{slot.startTime} – {slot.endTime}</td>
                    <td className="px-4 py-3 text-slate-500">{slot.duration} min</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${slot.available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {slot.available ? 'Disponible' : 'Réservé'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {slot.available && (
                        <button onClick={() => handleDelete(slot.id)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {slots.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucun créneau disponible</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
