/** Options du formulaire. Les "value" doivent matcher les clés de coefficients
 *  dans tenants/<id>.json (propertyType, condition, features). */
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
