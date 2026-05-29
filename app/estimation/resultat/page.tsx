'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Mail, Loader2, AlertTriangle, CheckCircle, Phone, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface LeadData {
  estimateMin: number
  estimateMax: number
  serviceType: string
  firstName: string
  details: string[]
}

function ResultatContent() {
  const params = useSearchParams()
  const router = useRouter()
  const leadId = params.get('lid')
  const prospectId = params.get('pid')

  const [data, setData] = useState<LeadData | null>(null)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leadId) { router.push('/estimation'); return }
    fetch(`/api/leads/${leadId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => router.push('/estimation'))
  }, [leadId, router])

  const handleSendPDF = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) { setError('Email invalide'); return }
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, email, prospectId }),
      })
      if (!res.ok) throw new Error()
      setSent(true)
      // Rediriger vers la confirmation après 3s
      setTimeout(() => router.push(`/estimation/confirmation?pid=${prospectId}&email=${encodeURIComponent(email)}`), 3000)
    } catch {
      setError('Erreur lors de l\'envoi. Veuillez réessayer.')
    } finally {
      setSending(false)
    }
  }

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="container-site max-w-3xl">
        {/* Résultat */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <h1 className="font-heading font-bold text-brand-navy text-2xl">Votre estimation est prête !</h1>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 mb-4">
            <p className="text-sm text-slate-500 mb-2">{data.serviceType} — Estimation indicative</p>
            <div className="text-4xl font-bold text-brand-navy mb-1">
              {formatCurrency(data.estimateMin)} – {formatCurrency(data.estimateMax)}
            </div>
            <p className="text-xs text-slate-400">TTC, main d’œuvre + matériaux courants</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Estimation indicative et non contractuelle.</strong> Le tarif réel peut différer
                selon les particularités techniques du logement, l’accessibilité et les matériaux choisis.
                Seule une visite sur site permet d’établir un devis définitif.
              </p>
            </div>
          </div>

          {data.details?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Facteurs pris en compte :</p>
              <ul className="space-y-1">
                {data.details.map((d, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-3.5 w-3.5 text-brand-orange" /> {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Envoi PDF */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-6">
          {!sent ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <Mail className="h-6 w-6 text-brand-orange" />
                <h2 className="font-heading font-bold text-brand-navy text-xl">Recevoir mon devis + guide gratuit</h2>
              </div>
              <p className="text-slate-500 text-sm mb-5">
                Recevez ce devis en PDF avec en bonus un <strong>guide pratique</strong> : entretien courant,
                économies d’énergie, signaux d’alerte… des conseils concrets d’un pro.
              </p>
              <form onSubmit={handleSendPDF} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.fr"
                  className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-brand-orange text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-orange-dark transition-colors flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
                >
                  {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</> : <>Recevoir par email <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <p className="text-xs text-slate-400 mt-2">Pas de spam · Désinscription possible à tout moment</p>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-brand-navy">Devis envoyé à {email} !</p>
              <p className="text-sm text-slate-500">Redirection vers les options de contact…</p>
            </div>
          )}
        </div>

        {/* Options de conversion */}
        <div className="bg-brand-navy rounded-2xl p-8 text-white">
          <h2 className="font-heading font-bold text-xl mb-6 text-center">
            Prochaine étape : obtenir votre devis réel
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: `/rendez-vous?pid=${prospectId}`, icon: Calendar, label: 'Prendre RDV', desc: 'Visite gratuite à domicile', color: 'bg-brand-orange hover:bg-brand-orange-dark' },
              { href: `/rappel?pid=${prospectId}`, icon: Phone, label: 'Être rappelé(e)', desc: 'On vous rappelle à votre créneau', color: 'bg-white/10 hover:bg-white/20' },
              { href: '/contact', icon: Mail, label: 'Nous contacter', desc: 'Email, téléphone, formulaire', color: 'bg-white/10 hover:bg-white/20' },
            ].map(({ href, icon: Icon, label, desc, color }) => (
              <Link
                key={label}
                href={href}
                className={`${color} rounded-xl p-5 flex flex-col items-center text-center transition-colors`}
              >
                <Icon className="h-6 w-6 mb-2" />
                <span className="font-semibold">{label}</span>
                <span className="text-xs text-white/70 mt-1">{desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResultatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-orange" /></div>}>
      <ResultatContent />
    </Suspense>
  )
}