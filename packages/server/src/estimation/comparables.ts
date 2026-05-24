import { loadComparables, type ComparableSale } from '../config/comparables';

/** Une comparable enrichie pour l'affichage PDF (prix au m² calculé, code postal). */
export interface MatchedComparable {
  type: 'Appartement' | 'Maison';
  surface: number;
  rooms?: number;
  price: number;
  pricePerM2: number;
  /** YYYY-MM */
  date: string;
  postalCode: string;
}

/**
 * Trouve N ventes comparables au bien du prospect dans l'index DVF du tenant.
 * Critères : même code postal, même type (Appartement/Maison), surface ±20%.
 * Tri par date décroissante (plus récent d'abord).
 *
 * Renvoie un tableau vide si le tenant n'a pas d'index, ou si aucun match.
 */
export function findComparables(
  tenantId: string,
  query: { postalCode: string; propertyType: string; surface: number },
  limit = 3,
): MatchedComparable[] {
  const idx = loadComparables(tenantId);
  if (!idx) return [];

  const candidates = idx.byPostalCode[query.postalCode];
  if (!candidates || candidates.length === 0) return [];

  // Le widget renvoie "appartement" / "maison" en minuscules ; l'index utilise A/M.
  const wantedType: 'A' | 'M' = query.propertyType.toLowerCase() === 'maison' ? 'M' : 'A';
  const minSurface = query.surface * 0.8;
  const maxSurface = query.surface * 1.2;

  const matching = candidates.filter(
    (c) => c.t === wantedType && c.s >= minSurface && c.s <= maxSurface,
  );
  if (matching.length === 0) return [];

  // Tri par date desc puis par proximité de surface
  matching.sort((a, b) => {
    const dateCmp = b.d.localeCompare(a.d);
    if (dateCmp !== 0) return dateCmp;
    return Math.abs(a.s - query.surface) - Math.abs(b.s - query.surface);
  });

  return matching.slice(0, limit).map((c) => toMatched(c, query.postalCode));
}

function toMatched(c: ComparableSale, postalCode: string): MatchedComparable {
  return {
    type: c.t === 'M' ? 'Maison' : 'Appartement',
    surface: c.s,
    rooms: c.r,
    price: c.p,
    pricePerM2: Math.round(c.p / c.s),
    date: c.d,
    postalCode,
  };
}
