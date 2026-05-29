import type { ServiceType, HousingType, BuildingAge, Urgency } from '@/lib/estimation'

export interface WizardStep {
  id: string
  question: string
  subtitle?: string
  type: 'choice' | 'number' | 'text' | 'multiselect' | 'contact'
  options?: { value: string; label: string; icon?: string; description?: string }[]
  field: string
  required?: boolean
  min?: number
  max?: number
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'service',
    question: 'Quelle prestation souhaitez-vous ?',
    subtitle: 'Choisissez le type de travaux qui correspond à votre besoin.',
    type: 'choice',
    field: 'serviceType',
    required: true,
    options: [
      { value: 'CHAUFFAGE', label: 'Chauffage', icon: '🔥', description: 'Chaudière, PAC, radiateurs, plancher chauffant' },
      { value: 'CLIMATISATION', label: 'Climatisation', icon: '❄️', description: 'Split, multi-split, climatiseur réversible' },
      { value: 'VMC', label: 'Ventilation (VMC)', icon: '💨', description: 'VMC simple/double flux, extracteur' },
      { value: 'PLOMBERIE', label: 'Plomberie', icon: '🚿', description: 'Canalisations, sanitaires, ballon ECS' },
      { value: 'ELECTRICITE', label: 'Électricité', icon: '⚡', description: 'Tableau électrique, câblage, prises' },
      { value: 'ENTRETIEN', label: 'Entretien / Maintenance', icon: '🔧', description: 'Contrat entretien, révision annuelle' },
      { value: 'RENOVATION', label: 'Rénovation complète', icon: '🏗️', description: 'Plusieurs corps de métier, rénovation globale' },
    ],
  },
  {
    id: 'housing',
    question: 'Quel est votre type de logement ?',
    type: 'choice',
    field: 'housingType',
    required: true,
    options: [
      { value: 'APPARTEMENT', label: 'Appartement', icon: '🏢', description: 'En copropriété ou résidence' },
      { value: 'MAISON', label: 'Maison individuelle', icon: '🏠', description: 'Maison avec jardin ou en lotissement' },
      { value: 'LOCAL_COMMERCIAL', label: 'Local commercial', icon: '🏪', description: 'Bureau, commerce, entrepôt' },
    ],
  },
  {
    id: 'surface',
    question: 'Quelle est la surface concernée (en m²) ?',
    subtitle: 'Surface totale du logement ou de la zone à traiter.',
    type: 'number',
    field: 'surface',
    required: true,
    min: 10,
    max: 1000,
  },
  {
    id: 'age',
    question: 'Quel est l\'age de votre bâtiment ?',
    subtitle: 'Cela permet d\'anticiper les adaptations éventuelles.',
    type: 'choice',
    field: 'buildingAge',
    required: true,
    options: [
      { value: 'NEUF', label: 'Neuf (< 2 ans)', icon: '✨' },
      { value: 'MOINS_10_ANS', label: 'Moins de 10 ans', icon: '🏗️' },
      { value: 'DIX_VINGT_ANS', label: '10 à 20 ans', icon: '🏠' },
      { value: 'PLUS_20_ANS', label: 'Plus de 20 ans', icon: '🏙️' },
    ],
  },
  {
    id: 'urgency',
    question: 'Quelle est l\'urgence de votre demande ?',
    type: 'choice',
    field: 'urgency',
    required: true,
    options: [
      { value: 'URGENT', label: 'Urgence', icon: '🚨', description: 'Panne, dépannage immédiat nécessaire' },
      { value: 'PLANIFIE', label: 'Projet planifié', icon: '📅', description: 'Dans les prochaines semaines/mois' },
    ],
  },
  {
    id: 'specificities',
    question: 'Y a-t-il des particularités à signaler ?',
    subtitle: 'Sélectionnez tout ce qui s\'applique (facultatif).',
    type: 'multiselect',
    field: 'specificities',
    options: [
      { value: 'ACCESS_DIFFICILE', label: 'Accès difficile', icon: '🚧' },
      { value: 'COPROPRIETE', label: 'Copropriété / Syndic', icon: '🏢' },
      { value: 'MULTI_PIECES', label: 'Plusieurs pièces', icon: '🚪' },
      { value: 'TRAVAUX_SOUS_TENSION', label: 'Travaux sous tension', icon: '⚡' },
      { value: 'EXISTANT_A_REMPLACER', label: 'Équipement existant à remplacer', icon: '🔄' },
    ],
  },
  {
    id: 'contact',
    question: 'Où envoyer votre estimation ?',
    subtitle: 'Pour recevoir votre devis indicatif et nos conseils pratiques.',
    type: 'contact',
    field: 'contact',
    required: true,
  },
]