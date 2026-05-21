import { z } from 'zod';

/**
 * Coefficients d'estimation. ENTIEREMENT pilotés par la config de chaque agence
 * (tenants/<id>.json -> "estimation"). Modifiable sans toucher au code.
 */
export const EstimationConfigSchema = z.object({
  currency: z.string().default('EUR'),
  // Prix de base au m2 : vente (prix total) et location (loyer mensuel).
  basePricePerM2: z.object({ sale: z.number().positive(), rent: z.number().positive() }),
  // Multiplicateur par type de bien.
  propertyType: z.record(z.string(), z.number().positive()),
  // Multiplicateur par état du bien.
  condition: z.record(z.string(), z.number().positive()),
  // Multiplicateur par zone : clé = code postal OU ville (minuscules). "default" = 1.
  zones: z.record(z.string(), z.number().positive()).default({ default: 1 }),
  // Bonus additif (en %) par équipement coché. Ex: { "parking": 0.03, "piscine": 0.07 }
  features: z.record(z.string(), z.number()).default({}),
  // Ajustement additif (%) selon le nombre de pièces au-delà de la référence.
  rooms: z.object({ reference: z.number().int().default(3), perRoomPct: z.number().default(0) }).default({ reference: 3, perRoomPct: 0 }),
  // Demi-fourchette renvoyée autour de l'estimation centrale (0.07 = +/-7%).
  rangePct: z.number().min(0).max(0.5).default(0.07),
});
export type EstimationConfig = z.infer<typeof EstimationConfigSchema>;

export interface EstimationInput {
  transaction: 'sale' | 'rent';
  propertyType: string;
  surface: number;
  rooms: number;
  condition: string;
  postalCode: string;
  city: string;
  features: string[];
}

export interface EstimationResult {
  low: number;
  mid: number;
  high: number;
  currency: string;
  pricePerM2: number;
  transaction: 'sale' | 'rent';
}

/** Contrat d'un estimateur. Permet de brancher une autre logique (ex: API externe). */
export interface Estimator {
  estimate(input: EstimationInput): EstimationResult;
}
