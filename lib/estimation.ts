export type ServiceType = 'CHAUFFAGE' | 'CLIMATISATION' | 'VMC' | 'PLOMBERIE' | 'ELECTRICITE' | 'ENTRETIEN' | 'RENOVATION'
export type HousingType = 'APPARTEMENT' | 'MAISON' | 'LOCAL_COMMERCIAL'
export type BuildingAge = 'NEUF' | 'MOINS_10_ANS' | 'DIX_VINGT_ANS' | 'PLUS_20_ANS'
export type Urgency = 'URGENT' | 'PLANIFIE'

export interface EstimationInput {
  serviceType: ServiceType
  housingType: HousingType
  surface: number
  buildingAge: BuildingAge
  urgency: Urgency
  specificities: string[]
}

export interface EstimationResult {
  min: number
  max: number
  label: string
  details: string[]
}

const BASE_PRICES: Record<ServiceType, { min: number; max: number; label: string }> = {
  CHAUFFAGE:      { min: 800,  max: 3500,  label: 'Installation / remplacement chauffage' },
  CLIMATISATION:  { min: 900,  max: 3200,  label: 'Installation climatisation réversible' },
  VMC:            { min: 500,  max: 2500,  label: 'Installation VMC' },
  PLOMBERIE:      { min: 200,  max: 1500,  label: 'Travaux de plomberie' },
  ELECTRICITE:    { min: 300,  max: 2000,  label: 'Travaux électriques' },
  ENTRETIEN:      { min: 100,  max: 350,   label: 'Entretien / maintenance' },
  RENOVATION:     { min: 2000, max: 15000, label: 'Rénovation complète' },
}

export function calculateEstimation(input: EstimationInput): EstimationResult {
  const base = BASE_PRICES[input.serviceType]
  let minFactor = 1
  let maxFactor = 1
  const details: string[] = []

  // Facteur surface
  if (input.surface <= 30) {
    minFactor *= 0.8; maxFactor *= 0.85
    details.push('Petit logement (≤ 30 m²) : tarif réduit')
  } else if (input.surface <= 60) {
    details.push(`Surface standard (${input.surface} m²)`)
  } else if (input.surface <= 100) {
    minFactor *= 1.2; maxFactor *= 1.3
    details.push(`Surface importante (${input.surface} m²) : supplément`)
  } else {
    minFactor *= 1.4; maxFactor *= 1.6
    details.push(`Grande surface (${input.surface} m²) : supplément`)
  }

  // Facteur type de logement
  if (input.housingType === 'MAISON') {
    minFactor *= 1.15; maxFactor *= 1.25
    details.push('Maison individuelle : accès toiture/combles')
  } else if (input.housingType === 'LOCAL_COMMERCIAL') {
    minFactor *= 1.2; maxFactor *= 1.4
    details.push('Local commercial : contraintes spécifiques')
  }

  // Facteur âge du bâtiment
  if (input.buildingAge === 'PLUS_20_ANS') {
    minFactor *= 1.1; maxFactor *= 1.3
    details.push('Bâtiment ancien : adaptations possibles nécessaires')
  } else if (input.buildingAge === 'NEUF') {
    minFactor *= 0.9; maxFactor *= 0.95
    details.push('Bâtiment neuf : installation facilitée')
  }

  // Urgence
  if (input.urgency === 'URGENT') {
    minFactor *= 1.15; maxFactor *= 1.2
    details.push('Intervention urgente : majoration horaires')
  }

  // Spécificités
  if (input.specificities.includes('ACCESS_DIFFICILE')) {
    minFactor *= 1.1; maxFactor *= 1.2
    details.push('Accès difficile : majoration déplacement')
  }
  if (input.specificities.includes('COPROPRIETE')) {
    details.push('Copropriété : coordination avec syndic incluse')
  }
  if (input.specificities.includes('MULTI_PIECES')) {
    minFactor *= 1.2; maxFactor *= 1.3
    details.push('Multi-pièces : installation multi-splits')
  }

  return {
    min: Math.round(base.min * minFactor),
    max: Math.round(base.max * maxFactor),
    label: base.label,
    details,
  }
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  CHAUFFAGE: 'Chauffage (chaudière, PAC…)',
  CLIMATISATION: 'Climatisation',
  VMC: 'Ventilation (VMC)',
  PLOMBERIE: 'Plomberie',
  ELECTRICITE: 'Électricité',
  ENTRETIEN: 'Entretien / Maintenance',
  RENOVATION: 'Rénovation complète',
}

export const HOUSING_LABELS: Record<HousingType, string> = {
  APPARTEMENT: 'Appartement',
  MAISON: 'Maison individuelle',
  LOCAL_COMMERCIAL: 'Local commercial / Bureau',
}

export const BUILDING_AGE_LABELS: Record<BuildingAge, string> = {
  NEUF: 'Neuf (< 2 ans)',
  MOINS_10_ANS: 'Moins de 10 ans',
  DIX_VINGT_ANS: '10 à 20 ans',
  PLUS_20_ANS: 'Plus de 20 ans',
}