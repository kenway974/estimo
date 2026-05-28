import type { Estimator, EstimationConfig, EstimationInput, EstimationResult } from './types';

/** Arrondit à la dizaine (loyer) ou au millier (vente) le plus proche. */
function roundNice(value: number, transaction: 'sale' | 'rent'): number {
  const step = transaction === 'rent' ? 10 : 1000;
  return Math.round(value / step) * step;
}

/**
 * Estimateur par coefficients. Formule :
 *   prix_m2 = base[transaction] x type x etat x zone
 *   total   = prix_m2 x surface x (1 + bonus_equipements + bonus_pieces)
 * Tous les facteurs viennent de la config de l'agence -> aucun "magic number".
 */
export class ConfigEstimator implements Estimator {
  constructor(private readonly cfg: EstimationConfig) {}

  estimate(input: EstimationInput): EstimationResult {
    const { cfg } = this;
    const base = cfg.basePricePerM2[input.transaction];

    const typeMult = cfg.propertyType[input.propertyType] ?? 1;
    const condMult = cfg.condition[input.condition] ?? 1;
    const zoneTable = (input.transaction === 'rent' && cfg.rentZones) ? cfg.rentZones : cfg.zones;
    const zoneMult =
      zoneTable[input.postalCode] ?? zoneTable[input.city.toLowerCase()] ?? zoneTable.default ?? 1;

    const pricePerM2 = base * typeMult * condMult * zoneMult;

    const featureBonus = input.features.reduce((sum, f) => sum + (cfg.features[f] ?? 0), 0);
    const roomBonus = Math.max(0, input.rooms - cfg.rooms.reference) * cfg.rooms.perRoomPct;
    const dpeBonus = input.dpeClass ? (cfg.dpe?.[input.dpeClass] ?? 0) : 0;
    const floorBonus = input.floor ? (cfg.floors?.[input.floor] ?? 0) : 0;
    const expositionBonus = input.exposition ? (cfg.exposition?.[input.exposition] ?? 0) : 0;
    const multiplier = 1 + featureBonus + roomBonus + dpeBonus + floorBonus + expositionBonus;

    const mid = pricePerM2 * input.surface * multiplier;
    return {
      low: roundNice(mid * (1 - cfg.rangePct), input.transaction),
      mid: roundNice(mid, input.transaction),
      high: roundNice(mid * (1 + cfg.rangePct), input.transaction),
      pricePerM2: Math.round(pricePerM2),
      currency: cfg.currency,
      transaction: input.transaction,
    };
  }
}
