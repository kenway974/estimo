import type { Metadata } from 'next'
import { EstimationWizard } from '@/components/wizard/EstimationWizard'
import { Shield, Clock, Gift } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Estimation gratuite — Devis chauffage, clim, VMC en Île-de-France',
  description: 'Obtenez une estimation du coût de vos travaux en 2 minutes. Chauffage, climatisation, VMC, plomberie, électricité. Devis indicatif gratuit + guide pratique offert.',
}

export default function EstimationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container-site py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar avantages */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
              <h2 className="font-heading font-bold text-brand-navy text-xl mb-6">
                Pourquoi utiliser notre estimateur ?
              </h2>
              <div className="space-y-5">
                {[
                  { icon: Gift, title: 'Gratuit et sans engagement', desc: 'Aucune obligation de donner suite. L\'estimation est offerte.' },
                  { icon: Clock, title: 'Résultat en 2 minutes', desc: '7 questions simples, une estimation personnalisée immédiate.' },
                  { icon: Shield, title: 'Devis PDF + guide offert', desc: 'Recevez un devis indicatif + nos conseils pratiques par email.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-brand-orange" />
                    </div>
                    <div>
                      <div className="font-semibold text-brand-navy text-sm">{title}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-3">Une urgence ? Appelez directement :</p>
                <a
                  href="tel:0652495290"
                  className="flex items-center justify-center gap-2 bg-brand-navy text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-navy-light transition-colors"
                >
                  📞 06 52 49 52 90
                </a>
              </div>
            </div>
          </div>

          {/* Wizard */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h1 className="font-heading font-bold text-brand-navy text-2xl mb-2">
                Estimation gratuite en ligne
              </h1>
              <p className="text-slate-500 mb-8">
                Répondez à 7 questions pour obtenir une fourchette de prix indicative pour vos travaux en Île-de-France.
              </p>
              <EstimationWizard />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}