'use client'
import { useState } from 'react'
import { StarRating } from './StarRating'
import { Loader2, CheckCircle } from 'lucide-react'

export function ReviewForm() {
  const [rating, setRating] = useState(0)
  const [form, setForm] = useState({ authorName: '', authorCity: '', service: '', content: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { setError('Veuillez attribuer une note'); return }
    if (!form.authorName || !form.content) { setError('Veuillez remplir les champs obligatoires'); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rating }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-brand-navy mb-2">Merci pour votre avis !</h3>
        <p className="text-slate-500">Il sera publié après modération sous 24h.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Votre note <span className="text-red-500">*</span>
        </label>
        <StarRating rating={rating} interactive onRate={setRating} size="lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Prénom / Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.authorName}
            onChange={(e) => setForm({ ...form, authorName: e.target.value })}
            placeholder="Marie L."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
          <input
            type="text"
            value={form.authorCity}
            onChange={(e) => setForm({ ...form, authorCity: e.target.value })}
            placeholder="Paris"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Service concerné</label>
        <select
          value={form.service}
          onChange={(e) => setForm({ ...form, service: e.target.value })}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
        >
          <option value="">Choisir…</option>
          {['Installation chaudière', 'Pompe à chaleur', 'Climatisation', 'VMC', 'Plomberie', 'Électricité', 'Entretien', 'Dépannage'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Votre avis <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={4}
          placeholder="Partagez votre expérience avec JP Clim…"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none"
          required
          minLength={20}
          maxLength={500}
        />
        <p className="text-xs text-slate-400 mt-1">{form.content.length}/500 caractères</p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-orange text-white py-3 rounded-xl font-semibold hover:bg-brand-orange-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</> : 'Publier mon avis'}
      </button>
    </form>
  )
}