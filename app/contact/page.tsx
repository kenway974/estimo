'use client'
import { useState } from 'react'
import { Phone, Mail, Instagram, Clock, MapPin, CheckCircle, Loader2, Send } from 'lucide-react'

const SUBJECTS = [
  'Demande de devis',
  'Installation neuve',
  'Dépannage urgent',
  'Entretien / maintenance',
  'Question générale',
  'Partenariat / sous-traitance',
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) { setError('Veuillez remplir tous les champs obligatoires'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, action: 'CONTACT_FORM' }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      setError('Erreur lors de l\'envoi. Appelez directement le 06 52 49 52 90.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-brand-navy py-16 text-white text-center">
        <h1 className="font-heading font-bold text-4xl mb-3">Contactez-nous</h1>
        <p className="text-slate-400 text-lg">Réponse sous 24h · Disponible 7j/7</p>
      </div>

      <div className="container-site max-w-5xl py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Infos contact */}
          <div className="space-y-5">
            {[
              { icon: Phone, label: 'Téléphone', value: '06 52 49 52 90', href: 'tel:0652495290', sub: 'Disponible 24h/7j — urgences' },
              { icon: Mail, label: 'Email', value: 'jpclim.chauffagiste@gmail.com', href: 'mailto:jpclim.chauffagiste@gmail.com', sub: 'Réponse sous 24h' },
              { icon: Instagram, label: 'Instagram', value: '@jpclim.chauffagiste', href: 'https://instagram.com/jpclim.chauffagiste', sub: 'Actualités & réalisations' },
              { icon: MapPin, label: 'Zone d\'intervention', value: 'Île-de-France', href: undefined, sub: 'Paris + 7 départements' },
              { icon: Clock, label: 'Horaires', value: 'Lun–Sam : 7h–20h', href: undefined, sub: 'Urgences : 24h/7j' },
            ].map(({ icon: Icon, label, value, href, sub }) => (
              <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-start gap-3">
                <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-brand-orange" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">{label}</div>
                  {href ? (
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="font-semibold text-brand-navy text-sm hover:text-brand-orange transition-colors">
                      {value}
                    </a>
                  ) : (
                    <span className="font-semibold text-brand-navy text-sm">{value}</span>
                  )}
                  <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Formulaire */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            {success ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <h2 className="text-xl font-semibold text-brand-navy mb-2">Message envoyé !</h2>
                <p className="text-slate-500">Jean-Pierre vous répondra sous 24h.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                    <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sujet</label>
                  <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange">
                    <option value="">Choisir…</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} placeholder="Décrivez votre projet ou votre demande…" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none" required />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="w-full bg-brand-orange text-white py-3 rounded-xl font-semibold hover:bg-brand-orange-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Envoyer le message
                </button>
                <p className="text-xs text-slate-400 text-center">Vos données sont traitées conformément à notre <a href="/confidentialite" className="underline">politique de confidentialité</a>.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
