import { PrismaClient } from '@prisma/client'
import { addDays, setHours, setMinutes } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  // Créneaux disponibles sur 30 jours (lun-sam, 8h-18h, créneaux de 2h)
  const slots = []
  for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
    const date = addDays(new Date(), dayOffset)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0) continue // pas le dimanche
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
        content: `# Entretien chaudière : obligations légales et conseils pratiques

## Qu'est-ce que la loi impose ?

En France, l'entretien annuel de toute chaudière dont la puissance est comprise entre 4 et 400 kW est **obligatoire** (décret n°2009-649). Cette obligation concerne aussi bien les propriétaires que les locataires.

## Qui est responsable : propriétaire ou locataire ?

- **Locataire** : responsable de l'entretien courant et du ramonage
- **Propriétaire** : responsable des réparations importantes et du bon état général

## Ce que comprend un entretien complet

1. Vérification de la combustion et du réglage du brûleur
2. Nettoyage du brûleur, de l'échangeur et du corps de chauffe
3. Contrôle de l'étanchéité du circuit gaz
4. Vérification des dispositifs de sécurité
5. Mesure du rendement et des émissions
6. Remise de l'attestation d'entretien

## Les risques en cas de non-entretien

- **Sécurité** : risque d'intoxication au monoxyde de carbone (CO), risque d'explosion
- **Financier** : surconsommation de gaz pouvant aller jusqu'à 15%, invalidation de garantie, refus d'assurance
- **Légal** : amende en cas de sinistre lié au défaut d'entretien

## Conseil JP Clim

Planifiez votre entretien en début d'automne (septembre-octobre) pour être prêt avant l'hiver. Notre équipe intervient en Île-de-France avec un délai rapide et remet une attestation conforme.`,
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
        content: `# Pompe à chaleur air/air vs air/eau : comment choisir ?

## Fonctionnement général

Une pompe à chaleur (PAC) capte les calories de l'air extérieur pour chauffer (ou refroidir) votre logement. Son COP (coefficient de performance) est généralement entre 3 et 5 : pour 1 kWh d'électricité consommé, elle produit 3 à 5 kWh de chaleur.

## PAC air/air

**Comment ça marche ?** La chaleur est diffusée directement dans l'air de vos pièces via des unités intérieures (splits).

**Avantages :**
- Réversible (climatisation en été)
- Installation plus simple et moins coûteuse
- Idéale pour les appartements et maisons bien isolées

**Inconvénients :**
- Ne chauffe pas l'eau sanitaire
- Moins efficace en cas de froid extrême
- Diffusion par air (moins homogène que le plancher chauffant)

## PAC air/eau

**Comment ça marche ?** La chaleur est transférée à un circuit d'eau, qui alimente radiateurs, plancher chauffant ET eau chaude sanitaire.

**Avantages :**
- Remplace complètement la chaudière
- Compatible plancher chauffant (très efficace)
- Chauffe aussi l'eau sanitaire
- Éligible MaPrimeRénov' en remplacement d'une chaudière gaz

**Inconvénients :**
- Installation plus lourde et plus coûteuse
- Nécessite un bon niveau d'isolation
- Moins adaptée aux appartements

## Notre recommandation

| Profil | Solution recommandée |
|--------|---------------------|
| Appartement, complément de chauffage | PAC air/air |
| Maison, remplacement chaudière | PAC air/eau |
| Logement mal isolé | Isolation d'abord, PAC ensuite |

JP Clim réalise un diagnostic gratuit sur site pour vous orienter vers la solution la plus adaptée à votre logement et votre budget.`,
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
        content: `# Choisir sa VMC : guide pratique

## Pourquoi la VMC est-elle obligatoire ?

Depuis 1982, toute construction neuve doit être équipée d'une VMC (Ventilation Mécanique Contrôlée). Elle assure le renouvellement de l'air, élimine l'humidité, les polluants et le CO2. Sans VMC, risques de condensation, moisissures et problèmes de santé.

## VMC Simple Flux

**Type A (autoréglable) :** débit constant, simple et économique. Convient aux logements bien isolés.
**Type B (hygroréglable) :** débit variable selon l'humidité. Économie d'énergie jusqu'à 45% vs type A.

**Coût :** 500 à 1 500 € pose comprise.

## VMC Double Flux

Récupère la chaleur de l'air extrait pour préchauffer l'air entrant. **Rendement thermique : 75 à 95%.**

**Pour qui ?** Maisons BBC, passives ou très bien isolées. Amortissement sur 5-8 ans.

**Coût :** 2 000 à 6 000 € selon la surface.

## Notre conseil par profil

- **Appartement standard** → VMC hygro B : le meilleur rapport qualité/prix
- **Maison ancienne mal isolée** → VMC simple flux A : suffisant
- **Maison neuve / rénovation globale** → VMC double flux : investissement rentable

## Entretien VMC

Nettoyage des bouches tous les 6 mois, remplacement des filtres (double flux) tous les 6 à 12 mois. JP Clim assure l'installation et l'entretien de tous types de VMC en Île-de-France.`,
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