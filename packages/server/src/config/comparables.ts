import fs from 'node:fs';
import path from 'node:path';
import { env } from './env';

/**
 * Index "comparables" chargé au runtime à partir de
 * `tenants/<id>.comparables.json` (généré par `npm run calibrate:dvf`).
 *
 * Utilisé pour enrichir le PDF d'estimation avec une section
 * "Ventes récentes dans le quartier" — 3 transactions DVF anonymisées
 * qui matchent le bien du prospect (même CP, même type, surface ±20%).
 */
export interface ComparableSale {
  /** "A" = Appartement, "M" = Maison */
  t: 'A' | 'M';
  /** Surface en m² */
  s: number;
  /** Prix de vente en € */
  p: number;
  /** Date au format YYYY-MM (jour omis pour anonymisation) */
  d: string;
  /** Nombre de pièces principales (optionnel) */
  r?: number;
}

export interface ComparablesIndex {
  _meta: {
    source: string;
    years: number[];
    departments: string[];
    calibratedAt: string;
    sampleSize: number;
    maxPerPostalCode: number;
  };
  byPostalCode: Record<string, ComparableSale[]>;
}

const cache = new Map<string, ComparablesIndex | null>();

/** Charge l'index comparables d'un tenant (avec cache). Renvoie null si absent. */
export function loadComparables(tenantId: string): ComparablesIndex | null {
  if (cache.has(tenantId)) return cache.get(tenantId) ?? null;
  const file = path.join(env.TENANTS_DIR, `${tenantId}.comparables.json`);
  if (!fs.existsSync(file)) {
    cache.set(tenantId, null);
    return null;
  }
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const idx = JSON.parse(raw) as ComparablesIndex;
    cache.set(tenantId, idx);
    return idx;
  } catch {
    cache.set(tenantId, null);
    return null;
  }
}
