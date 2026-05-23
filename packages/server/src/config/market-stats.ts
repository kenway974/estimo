import fs from 'node:fs';
import path from 'node:path';
import { env } from './env';

/**
 * Statistiques marché chargées au démarrage à partir de
 * `tenants/<id>.market-stats.json` (généré par `npm run calibrate:dvf`).
 *
 * Ces stats sont utilisées pour enrichir le PDF d'estimation envoyé au prospect
 * (section "Repères du marché local"). Optionnel : si aucun fichier n'est trouvé
 * pour un tenant, on renvoie null et le PDF se passe simplement de cette section.
 */
export interface MarketPostalCodeStats {
  medianAppart: number;
  medianMaison: number | null;
  txCount: number;
  commune: string | null;
}

export interface MarketStats {
  _meta: {
    source: string;
    years: number[];
    departments: string[];
    calibratedAt: string;
    sampleSize: number;
  };
  global: {
    medianAppart: number;
    medianMaison: number;
  };
  byPostalCode: Record<string, MarketPostalCodeStats>;
}

const cache = new Map<string, MarketStats | null>();

/** Charge les stats marché d'un tenant (mise en cache). Renvoie null si absent. */
export function loadMarketStats(tenantId: string): MarketStats | null {
  if (cache.has(tenantId)) return cache.get(tenantId) ?? null;
  const file = path.join(env.TENANTS_DIR, `${tenantId}.market-stats.json`);
  if (!fs.existsSync(file)) {
    cache.set(tenantId, null);
    return null;
  }
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const stats = JSON.parse(raw) as MarketStats;
    cache.set(tenantId, stats);
    return stats;
  } catch {
    cache.set(tenantId, null);
    return null;
  }
}

/** Renvoie les stats du code postal donné pour un tenant (null si non couvert). */
export function getPostalCodeStats(tenantId: string, postalCode: string): MarketPostalCodeStats | null {
  const stats = loadMarketStats(tenantId);
  if (!stats) return null;
  return stats.byPostalCode[postalCode] ?? null;
}
