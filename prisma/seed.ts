import { PrismaClient } from '@prisma/client'
import { addDays, setHours, setMinutes } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  // Créneaux disponibles sur 30 jours (lun-sam, 8h-18h, créneaux de 2h)
  const slots = []
  for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
    const date = addDays(new Date(), dayOffset)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0) continue
    for (const hour of [8, 10, 14, 16]) {
      slots.push({
        date: setMinutes(setHours(date, hour), 0),
        duration: 120,
        available: true,
      })
    }
  }
  await prisma.availableSlot.createMany({ data: slots, skipDuplicates: true })

  // Avis clients de démonstration
  await prisma.review.createMany({
    data: [
      { authorName: 'Marie L.', authorCity: 'Paris 15e', rating: 5, content: 'Intervention rapide et soignée pour l\'installation de ma pompe à chaleur. Jean-Pierre est très professionnel, ponctuel et explique bien chaque étape. Je recommande vivement !', service: 'Installation PAC', verified: true, published: true, source: 'SITE' },
      { authorName: 'Thomas B.', authorCity: 'Versailles', rating: 5, content: 'Dépannage chaudière en urgence un samedi soir. Arrivé en 1h, problème résolu en 2h. Tarif honnête, travail impeccable. Merci !', service: 'Dépannage chaudière', verified: true, published: true, source: 'SITE' },
      { authorName: 'Sophie M.', authorCity: 'Boulogne-Billancourt', rating: 5, content: 'Installation climatisation réversible dans 3 pièces. Travail très propre, respect du logement, finitions parfaites. Excellent rapport qualité/prix.', service: 'Installation clim', verified: true, published: true, source: 'SITE' },
      { authorName: 'Éric D.', authorCity: 'Saint-Denis', rating: 4, content: 'Entretien chaudière annuel + remplacement vanne. Travail sérieux, bon conseil pour optimiser ma consommation. Un peu d\'attente pour le rendez-vous mais ça vaut le coup.', service: 'Entretien chaudière', verified: true, published: true, source: 'SITE' },
      { authorName: 'Isabelle R.', authorCity: 'Vincennes', rating: 5, content: 'Installation VMC double flux dans notre appartement. Conseils excellents pour choisir le bon modèle. Installation soignée, aucune poussière, bravo !', service: 'Installation VMC', verified: true, published: true, source: 'SITE' },
    ],
    skipDuplicates: true,
  })

  // Articles de blog
  await prisma.blogPost.createMany({
    data: [
      {
        slug: 'entretien-chaudiere-obligatoire-loi',
        title: "Entretien chaudière : ce que dit la loi (et pourquoi c'est important)",
        excerpt: "L'entretien annuel de votre chaudière est une obligation légale. Découvrez ce que la réglementation impose, les risques en cas de non-respect et comment bien préparer l'intervention.",
        content: `# Entretien chaudière : obligations légales et conseils pratiques\n\n## Qu'est-ce que la loi impose ?\n\nEn France, l'entretien annuel de toute chaudière dont la puissance est comprise entre 4 et 400 kW est **obligatoire** (décret n°2009-649). Cette obligation concerne aussi bien les propriétaires que les locataires.\n\n## Qui est responsable : propriétaire ou locataire ?\n\n- **Locataire** : responsable de l'entretien courant et du ramonage\n- **Propriétaire** : responsable des réparations importantes et du bon état général\n\n## Ce que comprend un entretien complet\n\n1. Vérification de la combustion et du réglage du brûleur\n2. Nettoyage du brûleur, de l'échangeur et du corps de chauffe\n3. Contrôle de l'étanchéité du circuit gaz\n4. Vérification des dispositifs de sécurité\n5. Mesure du rendement et des émissions\n6. Remise de l'attestation d'entretien\n\n## Les risques en cas de non-entretien\n\n- **Sécurité** : risque d'intoxication au monoxyde de carbone (CO), risque d'explosion\n- **Financier** : surconsommation de gaz pouvant aller jusqu'à 15%, invalidation de garantie, refus d'assurance\n- **Légal** : amende en cas de sinistre lié au défaut d'entretien\n\n## Conseil JP Clim\n\nPlanifiez votre entretien en début d'automne (septembre-octobre) pour être prêt avant l'hiver. Notre équipe intervient en Île-de-France avec un délai rapide et remet une attestation conforme.`,
        category: 'Entretien',
        tags: ['chaudière', 'entretien', 'obligation légale', 'gaz'],
        readingTime: 5,
        published: true,
        publishedAt: new Date('2025-09-15'),
      },
      {
        slug: 'pompe-a-chaleur-air-air-vs-air-eau',
        title: 'Pompe à chaleur : air/air ou air/eau ? Le guide complet',
        excerpt: "Vous hésitez entre une PAC air/air et air/eau ? Découvrez les différences, les avantages et inconvénients de chaque solution, et comment choisir en fonction de votre logement.",
        content: `# Pompe à chaleur air/air vs air/eau : comment choisir ?\n\n## Fonctionnement général\n\nUne pompe à chaleur (PAC) capte les calories de l'air extérieur pour chauffer (ou refroidir) votre logement. Son COP (coefficient de performance) est généralement entre 3 et 5 : pour 1 kWh d'électricité consommé, elle produit 3 à 5 kWh de chaleur.\n\n## PAC air/air\n\n**Comment ça marche ?** La chaleur est diffusée directement dans l'air de vos pièces via des unités intérieures (splits).\n\n**Avantages :**\n- Réversible (climatisation en été)\n- Installation plus simple et moins coûteuse\n- Idéale pour les appartements et maisons bien isolées\n\n**Inconvénients :**\n- Ne chauffe pas l'eau sanitaire\n- Moins efficace en cas de froid extrême\n- Diffusion par air (moins homogène que le plancher chauffant)\n\n## PAC air/eau\n\n**Comment ça marche ?** La chaleur est transférée à un circuit d'eau, qui alimente radiateurs, plancher chauffant ET eau chaude sanitaire.\n\n**Avantages :**\n- Remplace complètement la chaudière\n- Compatible plancher chauffant (très efficace)\n- Chauffe aussi l'eau sanitaire\n- Éligible MaPrimeRénov' en remplacement d'une chaudière gaz\n\n**Inconvénients :**\n- Installation plus lourde et plus coûteuse\n- Nécessite un bon niveau d'isolation\n- Moins adaptée aux appartements\n\n## Notre recommandation\n\n| Profil | Solution recommandée |\n|--------|---------------------|\n| Appartement, complément de chauffage | PAC air/air |\n| Maison, remplacement chaudière | PAC air/eau |\n| Logement mal isolé | Isolation d'abord, PAC ensuite |\n\nJP Clim réalise un diagnostic gratuit sur site pour vous orienter vers la solution la plus adaptée à votre logement et votre budget.`,
        category: 'Installation',
        tags: ['pompe à chaleur', 'PAC', 'climatisation', 'chauffage'],
        readingTime: 7,
        published: true,
        publishedAt: new Date('2025-10-01'),
      },
      {
        slug: 'vmc-quel-modele-choisir',
        title: 'VMC : simple flux, double flux ou hygro ? Comment choisir pour votre logement',
        excerpt: "La VMC est obligatoire dans tout logement depuis 1982. Mais quel modèle choisir ? Simple flux, double flux, hygro B... on vous explique tout pour faire le bon choix.",
        content: `# Choisir sa VMC : guide pratique\n\n## Pourquoi la VMC est-elle obligatoire ?\n\nDepuis 1982, toute construction neuve doit être équipée d'une VMC (Ventilation Mécanique Contrôlée). Elle assure le renouvellement de l'air, élimine l'humidité, les polluants et le CO2. Sans VMC, risques de condensation, moisissures et problèmes de santé.\n\n## VMC Simple Flux\n\n**Type A (autoréglable) :** débit constant, simple et économique. Convient aux logements bien isolés.\n**Type B (hygroréglable) :** débit variable selon l'humidité. Économie d'énergie jusqu'à 45% vs type A.\n\n**Coût :** 500 à 1 500 € pose comprise.\n\n## VMC Double Flux\n\nRécupère la chaleur de l'air extrait pour préchauffer l'air entrant. **Rendement thermique : 75 à 95%.**\n\n**Pour qui ?** Maisons BBC, passives ou très bien isolées. Amortissement sur 5-8 ans.\n\n**Coût :** 2 000 à 6 000 € selon la surface.\n\n## Notre conseil par profil\n\n- **Appartement standard** → VMC hygro B : le meilleur rapport qualité/prix\n- **Maison ancienne mal isolée** → VMC simple flux A : suffisant\n- **Maison neuve / rénovation globale** → VMC double flux : investissement rentable\n\n## Entretien VMC\n\nNettoyage des bouches tous les 6 mois, remplacement des filtres (double flux) tous les 6 à 12 mois. JP Clim assure l'installation et l'entretien de tous types de VMC en Île-de-France.`,
        category: 'Ventilation',
        tags: ['VMC', 'ventilation', 'qualité air', 'logement'],
        readingTime: 6,
        published: true,
        publishedAt: new Date('2025-10-20'),
      },
    ],
    skipDuplicates: true,
  })

  console.log('Seed terminé ✓')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
