import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité | JP Clim Chauffagiste',
  description: 'Politique de confidentialité et gestion des données personnelles — JP Clim Chauffagiste',
  robots: { index: false },
}

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container-site max-w-3xl">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <h1 className="font-heading font-bold text-3xl text-brand-navy mb-2">Politique de confidentialité</h1>
          <p className="text-slate-400 text-sm mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}</p>

          {[
            {
              title: '1. Responsable du traitement',
              content: 'JP Clim Chauffagiste, entreprise individuelle — jpclim.chauffagiste@gmail.com — Île-de-France.',
            },
            {
              title: '2. Données collectées',
              content: 'Nous collectons les données que vous nous communiquez volontairement via nos formulaires : prénom, téléphone, email, ville, type de travaux souhaités. Ces données sont strictement nécessaires au traitement de votre demande.',
            },
            {
              title: '3. Finalités du traitement',
              content: "Vos données sont utilisées pour : (1) vous fournir une estimation tarifaire indicative, (2) vous envoyer votre devis PDF par email, (3) vous rappeler ou vous contacter suite à votre demande, (4) améliorer nos services. Nous n'utilisons pas vos données à des fins de prospection commerciale sans votre consentement.",
            },
            {
              title: '4. Durée de conservation',
              content: 'Vos données sont conservées 3 ans à compter de votre dernière interaction avec nous, puis supprimées ou anonymisées. Vous pouvez demander leur suppression à tout moment.',
            },
            {
              title: '5. Partage des données',
              content: "Nous ne vendons jamais vos données. Elles peuvent être transmises à nos prestataires techniques (hébergement, email) dans le strict cadre de l'exécution de nos services. En cas d'intégration CRM, vos données sont transmises uniquement pour la gestion de votre demande.",
            },
            {
              title: '6. Cookies et traceurs',
              content: "Ce site utilise des cookies analytics (Google Analytics) pour mesurer l'audience, uniquement avec votre consentement explicite. Vous pouvez refuser via la bannière de consentement. Des cookies techniques strictement nécessaires au fonctionnement du site ne sont pas soumis à consentement.",
            },
            {
              title: '7. Vos droits (RGPD)',
              content: "Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition. Pour exercer ces droits, contactez-nous à jpclim.chauffagiste@gmail.com. Vous pouvez également adresser une réclamation à la CNIL (cnil.fr).",
            },
            {
              title: '8. Sécurité',
              content: 'Nous mettons en œuvre les mesures techniques appropriées pour protéger vos données contre tout accès non autorisé, perte ou divulgation. Les communications sont chiffrées via HTTPS/TLS.',
            },
          ].map(({ title, content }) => (
            <section key={title} className="mb-6">
              <h2 className="font-heading font-semibold text-xl text-brand-navy mb-2">{title}</h2>
              <p className="text-slate-600 leading-relaxed">{content}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
