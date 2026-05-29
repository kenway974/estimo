import { Shield, Clock, Award, Users, Zap, ThumbsUp } from 'lucide-react'

const BADGES = [
  { icon: Clock, label: 'Disponible 24h/7j', sub: 'Urgences prises en charge' },
  { icon: Award, label: 'Depuis 2008', sub: '15+ ans d\'expérience' },
  { icon: Shield, label: 'Certifié & assuré', sub: 'Garantie décennale' },
  { icon: Users, label: 'Particuliers & pros', sub: 'Grands groupes également' },
  { icon: Zap, label: 'Intervention rapide', sub: 'Île-de-France entière' },
  { icon: ThumbsUp, label: 'Suivi personnalisé', sub: 'Un seul interlocuteur' },
]

export function TrustBadges() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {BADGES.map(({ icon: Icon, label, sub }) => (
        <div key={label} className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-2">
            <Icon className="h-5 w-5 text-brand-orange" />
          </div>
          <span className="text-sm font-semibold text-brand-navy">{label}</span>
          <span className="text-xs text-slate-500 mt-0.5">{sub}</span>
        </div>
      ))}
    </div>
  )
}