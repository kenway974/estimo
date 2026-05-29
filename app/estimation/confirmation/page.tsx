import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Calendar, Phone, Mail, ArrowRight, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Devis envoyé — Prochaines étapes | JP Clim',
  description: 'Votre devis indicatif et votre guide pratique ont été envoyés par email. Découvrez les prochaines étapes pour votre projet.',
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ pid?: string; email?: string }>
}) {
  const { pid, email } = await searchParams

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="container-site max-w-2xl">
        {/* Confirmation */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="font-heading font-bold text-brand-navy text-2xl mb-3">
            Votre devis a été envoyé !
          </h1>
          {email && (
            <p className="text-slate-500 mb-2">
              Consultez votre boîte mail à l’adresse <strong>{email}</strong>.
            </p>
          )}
          <p className="text-slate-500 text-sm">
            Vérifiez vos spams si vous ne le recevez pas sous 5 minutes.
          </p>
        </div>

        {/* Ce que vous recevez */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
          <h2 className="font-semibold text-brand-navy mb-4">Dans votre email :</h2>
          <ul className="space-y-3">
            {[
              { icon: '📋', text: 'Votre devis indicatif personnalisé en PDF' },
              { icon: '🔧', text: 'Guide : entretien courant que vous pouvez faire vous-même' },
              { icon: '⚡', text: '5 réglages pour économiser jusqu\'à 20% d\'énergie' },
              { icon: '🚨', text: 'Signaux d\'alerte : quand appeler un pro d\'urgence' },
              { icon: '📞', text: 'Liens pour prendre RDV ou être rappelé directement' },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-700">
                <span>{icon}</span> {text}
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs conversion */}
        <div className="bg-brand-navy rounded-2xl p-8 text-white mb-8">
          <h2 className="font-heading font-bold text-xl text-center mb-2">
            Obtenez votre devis réel et définitif
          </h2>
          <p className="text-slate-400 text-sm text-center mb-6">
            Notre visite sur site est gratuite et sans engagement.
          </p>
          <div className="space-y-3">
            <Link
              href={`/rendez-vous${pid ? `?pid=${pid}` : ''}`}
              className="flex items-center justify-between bg-brand-orange hover:bg-brand-orange-dark text-white p-4 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Prendre rendez-vous pour une visite</div>
                  <div className="text-xs text-orange-200">Choisissez votre créneau — gratuit, sans engagement</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href={`/rappel${pid ? `?pid=${pid}` : ''}`}
              className="flex items-center justify-between bg-white/10 hover:bg-white/20 text-white p-4 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Être rappelé(e) par Jean-Pierre</div>
                  <div className="text-xs text-slate-400">Choisissez votre créneau préféré</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="tel:0652495290"
              className="flex items-center justify-between bg-white/10 hover:bg-white/20 text-white p-4 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-brand-orange" />
                <div>
                  <div className="font-semibold">Appeler directement : 06 52 49 52 90</div>
                  <div className="text-xs text-slate-400">Disponible 7j/7 — Réponse immédiate</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Social proof */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1,2,3,4,5].map((i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
          </div>
          <p className="text-slate-600 text-sm italic">
            &ldquo;Très réactif, travail soigné et prix honnête. Je recommande vivement JP Clim pour tout projet de chauffage en Île-de-France.&rdquo;
          </p>
          <p className="text-xs text-slate-400 mt-2">— Thomas B., Versailles</p>
        </div>
      </div>
    </div>
  )
}