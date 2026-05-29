'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, Phone } from 'lucide-react'

const TIME_SLOTS = [
  'Le matin (8h-12h)',
  'L\'après-midi (14h-18h)',
  'En soirée (18h-20h)',
  'Le samedi matin',
  'Dès que possible',
]

function RappelContent() {
  const searchParams = useSearchParams()
  const prospectId = searchParams.get('pid')

  const [form, setForm] = useState({ firstName: '', phone: '', preferredTime: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.phone) { setError('Prénom et téléphone requis'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId, action: 'CALLBACK_REQUESTED', ...form }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      setError('Erreur lors de la demande. Appelez directement le 06 52 49 52 90.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center max-w-md">
          <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
          <h1 className="font-heading font-bold text-brand-navy text-2xl mb-3">Demande envoyée !</h1>
          <p className="text-slate-500">Jean-Pierre vous rappellera le plus vite possible sur le {form.phone}.</p>
          <p className="text-sm text-slate-400 mt-2">En urgence, appelez directement :</p>
          <a href="tel:0652495290" className="btn-primary mt-3 w-full justify-center">📞 06 52 49 52 90</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container-site max-w-lg">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
              <Phone className="h-6 w-6 text-brand-orange" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-brand-navy text-2xl">Être rappelé(e)</h1>
              <p className="text-slate-500 text-sm">JP Clim vous rappelle à votre créneau</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Créneau préféré</label>
              <div className="grid grid-cols-1 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setForm({ ...form, preferredTime: slot })}
                    className={`p-3 rounded-lg border text-sm text-left transition-all ${
                      form.preferredTime === slot
                        ? 'border-brand-orange bg-orange-50 text-brand-navy font-medium'
                        : 'border-slate-200 hover:border-brand-orange text-slate-600'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message (optionnel)</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                placeholder="Décrivez brièvement votre besoin…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange text-white py-3 rounded-xl font-semibold hover:bg-brand-orange-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Envoyer ma demande de rappel
            </button>
            <p className="text-xs text-slate-400 text-center">Réponse sous quelques heures · Disponible 7j/7</p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function RappelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-orange" /></div>}>
      <RappelContent />
    </Suspense>
  )
}