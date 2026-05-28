/** Options du formulaire. Les "value" doivent matcher les clés de coefficients
 *  dans tenants/<id>.json (propertyType, condition, features, dpe, floors, exposition). */
export interface Option { value: string; label: string; }

export const TRANSACTIONS: Option[] = [
  { value: 'sale', label: 'Vente' },
  { value: 'rent', label: 'Location' },
];

export const PROPERTY_TYPES: Option[] = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'local', label: 'Local / commerce' },
];

export const CONDITIONS: Option[] = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'bon', label: 'Bon état' },
  { value: 'a_rafraichir', label: 'À rafraîchir' },
  { value: 'a_renover', label: 'À rénover' },
];

export const FEATURES: Option[] = [
  { value: 'parking', label: 'Parking' },
  { value: 'garage', label: 'Garage' },
  { value: 'balcon', label: 'Balcon' },
  { value: 'terrasse', label: 'Terrasse' },
  { value: 'jardin', label: 'Jardin' },
  { value: 'piscine', label: 'Piscine' },
  { value: 'ascenseur', label: 'Ascenseur' },
  { value: 'cave', label: 'Cave' },
];

/** Classe DPE (Diagnostic de Performance Énergétique). Obligatoire depuis 2011.
 *  Les biens F/G sont soumis aux restrictions de location depuis 2025. */
export const DPE_CLASSES: Option[] = [
  { value: 'nc', label: 'Non communiqué' },
  { value: 'A', label: 'A — Excellent (< 70 kWh/m²/an)' },
  { value: 'B', label: 'B — Très bon (70–110)' },
  { value: 'C', label: 'C — Bon (110–180)' },
  { value: 'D', label: 'D — Moyen (180–250)' },
  { value: 'E', label: 'E — Médiocre (250–330)' },
  { value: 'F', label: 'F — Mauvais (330–420)' },
  { value: 'G', label: 'G — Très mauvais (> 420)' },
];

/** Étage du bien (appartement / local). "na" = sans objet (maison / terrain). */
export const FLOOR_OPTIONS: Option[] = [
  { value: 'na', label: 'Sans objet (maison / terrain)' },
  { value: 'rdc', label: 'Rez-de-chaussée' },
  { value: '1_3', label: '1er – 3e étage' },
  { value: '4_6', label: '4e – 6e étage' },
  { value: '7_plus', label: '7e étage et +' },
  { value: 'dernier', label: 'Dernier étage' },
];

/** Exposition principale du bien. */
export const EXPOSITION_OPTIONS: Option[] = [
  { value: 'nc', label: 'Non renseignée' },
  { value: 'S', label: 'Sud' },
  { value: 'SO', label: 'Sud-Ouest' },
  { value: 'SE', label: 'Sud-Est' },
  { value: 'O', label: 'Ouest' },
  { value: 'E', label: 'Est' },
  { value: 'N', label: 'Nord' },
];
