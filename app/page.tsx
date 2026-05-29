import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Phone, Star, CheckCircle, Flame, Snowflake, Wind, Droplets, Zap, Wrench } from 'lucide-react'
import { TrustBadges } from '@/components/trust/TrustBadges'
import { FAQSchema } from '@/components/seo/SchemaOrg'
import { prisma } from '@/lib/prisma'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { BlogCard } from '@/components/blog/BlogCard'

export const metadata: Metadata = {
  title: 'Chauffagiste Île-de-France — Installation, Entretien, Dépannage | JP Clim',
  description: 'JP Clim Chauffagiste intervient en Île-de-France pour l\'installation, l\'entretien et le dépannage de chaudières, pompes à chaleur, climatisation et VMC. Devis gratuit en ligne — réponse sous 24h.',
}

const SERVICES = [
  { icon: Flame, title: 'Chauffage', items: ['Installation chaudière gaz / fioul', 'Pompe à chaleur (PAC)', 'Plancher chauffant', 'Radiateurs'], color: 'text-red-500', bg: 'bg-red-50' },
  { icon: Snowflake, title: 'Climatisation', items: ['Split mural & multi-split', 'Climatiseur réversible', 'Systèmes VRV/VRF', 'Entretien clim'], color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: Wind, title: 'Ventilation (VMC)', items: ['VMC simple flux', 'VMC double flux', 'Extracteurs', 'Puits climatique'], color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { icon: Droplets, title: 'Plomberie', items: ['Canalisations & fuites', 'Sanitaires & salle de bain', 'Chauffe-eau & ECS', 'Adoucisseur d\'eau'], color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Zap, title: 'Électricité', items: ['Tableau électrique', 'Mise aux normes', 'Câblage & prises', 'Éclairage LED'], color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { icon: Wrench, title: 'Entretien & Rénovation', items: ['Contrats d\'entretien', 'Dépannage urgence 24h', 'Rénovation globale', 'Diagnostic énergie'], color: 'text-orange-500', bg: 'bg-orange-50' },
]

const FAQS = [
  { question: 'JP Clim intervient dans quelle zone géographique ?', answer: 'JP Clim Chauffagiste intervient dans toute l\'Île-de-France : Paris et ses 7 départements (Seine-et-Marne, Yvelines, Essonne, Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne, Val-d\'Oise).' },
  { question: 'Comment obtenir un devis pour mes travaux ?', answer: 'Utilisez notre formulaire d\'estimation en ligne (gratuit, sans engagement) pour obtenir une fourchette de prix en quelques minutes. Un devis définitif et contractuel est établi lors d\'une visite sur site gratuite.' },
  { question: 'Intervenez-vous en urgence le week-end ou la nuit ?', answer: 'Oui, JP Clim est disponible 24h/24, 7j/7 pour les urgences (panne de chauffage, fuite, dépannage). Appelez le 06 52 49 52 90.' },
  { question: 'Êtes-vous certifié RGE pour les aides à la rénovation ?', answer: 'Oui, JP Clim est certifié RGE (Reconnu Garant de l\'Environnement), ce qui vous permet de bénéficier des aides de l\'État : MaPrimeRénov\', CEE, éco-PTZ pour vos travaux de rénovation énergétique.' },
  { question: 'Quel est le coût d\'un entretien chaudière ?', answer: 'L\'entretien annuel d\'une chaudière gaz est obligatoire (décret 2009-649). Notre tarif indicatif est de 100 à 180€ TTC selon le modèle. Obtenez votre estimation précise via notre formulaire en ligne.' },
  { question: 'Quelle est la différence entre une PAC air/air et air/eau ?', answer: 'La PAC air/air chauffe et refroidit directement l\'air des pièces (idéale pour appartements), tandis que la PAC air/eau transfère la chaleur à un circuit d\'eau pour alimenter radiateurs et eau chaude sanitaire (parfaite pour remplacer une chaudière en maison).' },
]

async function getReviews() {
  try {
    return await prisma.review.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })
  } catch {
    return []
  }
}

async function getBlogPosts() {
  try {
    return await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    })
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [reviews, posts] = await Promise.all([getReviews(), getBlogPosts()])

  return (
    <>
      <FAQSchema faqs={FAQS} />

      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-hero-gradient text-white py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-[200px] leading-none">🔥</div>
          <div className="absolute bottom-10 right-10 text-[200px] leading-none">❄️</div>
        </div>
        <div className="container-site relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-brand-orange/20 text-brand-orange text-sm px-3 py-1 rounded-full font-medium">
                ✓ Expérience depuis 2008 · Île-de-France
              </span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Votre chauffagiste de confiance en{' '}
              <span className="text-brand-orange">Île-de-France</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Installation, entretien et dépannage en chauffage, climatisation, VMC, plomberie et électricité.
              Devis gratuit en ligne — intervention sous 24h — disponible 7j/7.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/estimation"
                className="btn-primary text-lg px-8 py-4 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-shadow"
              >
                Estimation gratuite <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="tel:0652495290"
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg"
              >
                <Phone className="h-5 w-5 text-brand-orange" />
                06 52 49 52 90
              </a>
            </div>
            <div className="flex flex-wrap gap-6 mt-10">
              {[
                { icon: '⭐', text: '4.9/5 · +50 avis' },
                { icon: '🚀', text: 'Devis en 24h' },
                { icon: '🔒', text: 'Sans engagement' },
                { icon: '🏆', text: 'Certifié RGE' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-slate-300 text-sm">
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Badges de confiance ───────────────────────────────────────── */}
      <section className="py-12 bg-slate-50">
        <div className="container-site">
          <TrustBadges />
        </div>
      </section>

      {/* ─── Services ──────────────────────────────────────────────────── */}
      <section className="section-padding" id="services">
        <div className="container-site">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-brand-navy mb-4">
              Nos domaines d'expertise
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Une seule entreprise pour tous vos besoins en génie climatique, plomberie et électricité en Île-de-France.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(({ icon: Icon, title, items, color, bg }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <h3 className="font-heading font-bold text-brand-navy text-xl mb-3">{title}</h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-slate-600 text-sm">
                      <CheckCircle className="h-4 w-4 text-brand-orange flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/estimation"
                  className="mt-5 inline-flex items-center gap-2 text-brand-orange font-medium text-sm hover:gap-3 transition-all"
                >
                  Obtenir un devis <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA tunnel ────────────────────────────────────────────────── */}
      <section className="bg-cta-gradient py-16 md:py-20">
        <div className="container-site text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Obtenez votre estimation en 2 minutes
          </h2>
          <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
            Remplissez notre formulaire en ligne. Recevez une fourchette de prix indicative + un guide pratique gratuit par email.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/estimation"
              className="bg-white text-brand-orange font-bold px-8 py-4 rounded-xl hover:bg-orange-50 transition-colors text-lg shadow-lg inline-flex items-center gap-2"
            >
              Estimer mes travaux gratuitement <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="tel:0652495290"
              className="bg-white/20 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/30 transition-colors text-lg inline-flex items-center gap-2"
            >
              <Phone className="h-5 w-5" /> Appeler directement
            </a>
          </div>
        </div>
      </section>

      {/* ─── À propos / E-E-A-T ────────────────────────────────────────── */}
      <section className="section-padding bg-slate-50" id="expertise">
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-brand-navy mb-6">
                15+ ans d'expérience au service des Franciliens
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                Jean-Pierre, gérant de JP Clim Chauffagiste, exerce le métier de chauffagiste depuis 2008.
                Fort de cette expérience sur le terrain, il a fondé son entreprise en mars 2024 pour proposer
                un service de qualité, personnalisé et transparent, sans intermédiaire.
              </p>
              <p className="text-slate-600 leading-relaxed mb-8">
                Nous intervenons aussi bien chez les particuliers que pour de grands groupes, avec le même
                soin du détail et le même engagement : un travail bien fait, expliqué et garanti.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '15+', label: 'Années d\'expérience' },
                  { value: '500+', label: 'Clients satisfaits' },
                  { value: '24h/7j', label: 'Disponibilité' },
                  { value: '100%', label: 'Île-de-France' },
                ].map(({ value, label }) => (
                  <div key={label} className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-brand-orange">{value}</div>
                    <div className="text-sm text-slate-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[
                { emoji: '🎯', title: 'Devis gratuit et transparent', desc: 'Pas de mauvaise surprise : chaque devis est détaillé et expliqué avant le démarrage des travaux.' },
                { emoji: '⚡', title: 'Réactivité garantie', desc: 'Intervention sous 24h pour les projets planifiés, immédiate pour les urgences.' },
                { emoji: '🔧', title: 'Travail soigné et garanti', desc: 'Respect des normes en vigueur, finitions impeccables, garantie sur toutes nos interventions.' },
                { emoji: '📱', title: 'Suivi personnalisé', desc: 'Un seul interlocuteur du devis à la réception des travaux. Toujours joignable.' },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="flex items-start gap-4 bg-white p-5 rounded-xl shadow-sm">
                  <span className="text-3xl">{emoji}</span>
                  <div>
                    <h3 className="font-semibold text-brand-navy mb-1">{title}</h3>
                    <p className="text-slate-500 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Avis clients ──────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="section-padding" id="avis">
          <div className="container-site">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />)}
                <span className="font-bold text-brand-navy text-xl ml-2">4.9/5</span>
              </div>
              <h2 className="text-3xl font-heading font-bold text-brand-navy mb-3">Ce que disent nos clients</h2>
              <p className="text-slate-500">Avis vérifiés de clients ayant fait appel à JP Clim en Île-de-France.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {reviews.map((r) => (
                <ReviewCard key={r.id} {...r} createdAt={r.createdAt} />
              ))}
            </div>
            <div className="text-center">
              <Link href="/avis" className="btn-outline">
                Voir tous les avis <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── FAQ ───────────────────────────────────────────────────────── */}
      <section className="section-padding bg-slate-50" id="faq">
        <div className="container-site">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-heading font-bold text-brand-navy mb-2 text-center">Questions fréquentes</h2>
            <p className="text-slate-500 text-center mb-10">Tout ce que vous devez savoir avant de faire appel à un chauffagiste.</p>
            <div className="space-y-4">
              {FAQS.map(({ question, answer }) => (
                <details key={question} className="group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-brand-navy select-none">
                    {question}
                    <span className="text-brand-orange group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
                  </summary>
                  <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed">{answer}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Blog ──────────────────────────────────────────────────────── */}
      {posts.length > 0 && (
        <section className="section-padding" id="blog">
          <div className="container-site">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-heading font-bold text-brand-navy mb-3">Conseils & guides pratiques</h2>
              <p className="text-slate-500">Des articles rédigés par des professionnels pour vous aider à bien entretenir vos équipements.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {posts.map((p) => <BlogCard key={p.id} {...p} publishedAt={p.publishedAt} />)}
            </div>
            <div className="text-center">
              <Link href="/blog" className="btn-outline">
                Voir tous les articles <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA final ─────────────────────────────────────────────────── */}
      <section className="bg-brand-navy py-16 text-center">
        <div className="container-site">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à démarrer votre projet ?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Estimation gratuite en ligne · Réponse sous 24h · Sans engagement
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/estimation" className="btn-primary text-lg px-8 py-4">
              Estimation gratuite <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/rendez-vous" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg inline-flex items-center gap-2">
              Prendre rendez-vous
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
