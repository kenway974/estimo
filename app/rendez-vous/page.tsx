'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimeSlot } from '@/lib/calendar/types'

function BookingContent() {
  const searchParams = useSearchParams()
  const prospectId = searchParams.get('pid')

  const [currentWeek, setCurrentWeek] = useState(0)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [form, setForm] = useState({ firstName: '', phone: '', email: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weekStart = startOfWeek(addDays(new Date(), currentWeek * 7 + 1), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    setLoadingSlots(true)
    const from = weekStart.toISOString()
    const to = addDays(weekStart, 7).toISOString()
    fetch(`/api/booking/slots?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [currentWeek])

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return
    if (!form.firstName || !form.phone) { setError('Prénom et téléphone requis'); return }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/booking/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: selectedSlot.id, prospectId, ...form }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      setError('Erreur lors de la réservation. Réessayez ou appelez le 06 52 49 52 90.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center max-w-md">
          <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
          <h1 className="font-heading font-bold text-brand-navy text-2xl mb-3">Demande de RDV envoyée !</h1>
          <p className="text-slate-500 mb-2">
            Jean-Pierre vous contactera sous 24h pour confirmer le rendez-vous.
          </p>
          {selectedSlot && (
            <div className="bg-slate-50 rounded-xl p-4 mt-4 text-sm text-slate-700">
              📅 {format(new Date(selectedSlot.date), 'EEEE dd MMMM yyyy', { locale: fr })}<br />
              🕐 {selectedSlot.startTime} – {selectedSlot.endTime}
            </div>
          )}
          <a href="tel:0652495290" className="btn-primary mt-6 w-full justify-center">
            📞 Confirmer par téléphone
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container-site max-w-4xl">
        <h1 className="font-heading font-bold text-brand-navy text-3xl mb-2 text-center">
          Prendre rendez-vous
        </h1>
        <p className="text-slate-500 text-center mb-10">
          Choisissez un créneau pour votre visite diagnostic gratuite. Jean-Pierre vous confirmera sous 24h.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Calendrier */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setCurrentWeek((w) => Math.max(0, w - 1))}
                disabled={currentWeek === 0}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-semibold text-brand-navy text-sm">
                Semaine du {format(weekStart, 'dd MMMM', { locale: fr })}
              </span>
              <button
                onClick={() => setCurrentWeek((w) => Math.min(3, w + 1))}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {loadingSlots ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-orange" />
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-2">
                {weekDays.map((day) => {
                  const daySlots = slots.filter((s) => isSameDay(new Date(s.date), day))
                  return (
                    <div key={day.toISOString()} className="space-y-2">
                      <div className="text-center text-xs font-medium text-slate-500 pb-1 border-b border-slate-100">
                        <div>{format(day, 'EEE', { locale: fr })}</div>
                        <div className="text-brand-navy font-bold">{format(day, 'dd')}</div>
                      </div>
                      {daySlots.length === 0 ? (
                        <div className="text-center text-xs text-slate-300 py-2">—</div>
                      ) : (
                        daySlots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={cn(
                              'w-full text-xs py-2 px-1 rounded-lg border transition-all font-medium',
                              selectedSlot?.id === slot.id
                                ? 'bg-brand-orange border-brand-orange text-white'
                                : 'border-slate-200 hover:border-brand-orange hover:bg-orange-50 text-slate-700'
                            )}
                          >
                            {slot.startTime}
                          </button>
                        ))
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {selectedSlot && (
              <div className="mt-5 p-3 bg-orange-50 rounded-xl flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-brand-orange" />
                <span className="font-medium text-brand-navy">
                  {format(new Date(selectedSlot.date), 'EEEE dd MMMM', { locale: fr })} · {selectedSlot.startTime} – {selectedSlot.endTime}
                </span>
              </div>
            )}
          </div>

          {/* Formulaire */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-brand-navy mb-5 flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-orange" />
              Vos coordonnées
            </h2>
            <form onSubmit={handleBook} className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Précisions (optionnel)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Adresse, description du projet…"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={!selectedSlot || submitting}
                className="w-full bg-brand-orange text-white py-3 rounded-xl font-semibold hover:bg-brand-orange-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {selectedSlot ? 'Confirmer le rendez-vous' : 'Sélectionnez un créneau'}
              </button>
              <p className="text-xs text-slate-400 text-center">
                Gratuit · Sans engagement · Jean-Pierre vous confirme sous 24h
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RendezVousPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-orange" /></div>}>
      <BookingContent />
    </Suspense>
  )
}
