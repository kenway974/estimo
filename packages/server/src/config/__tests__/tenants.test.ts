import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../paths';
import { loadTenants } from '../tenants';
import { getPostalCodeStats } from '../market-stats';
import { ConfigEstimator } from '../../estimation/config-estimator';
import type { TenantConfig } from '../tenants';

let tenants: TenantConfig[];
beforeAll(() => {
  tenants = loadTenants();
});

describe('configs des agences livrees', () => {
  it('charge et valide tous les tenants du depot', () => {
    expect(tenants.length).toBeGreaterThan(0);
  });

  it('resout tenants/ depuis la racine, pas depuis le cwd', () => {
    // Garde-fou : `npm start` a la racine demarre avec cwd = packages/server.
    expect(fs.existsSync(path.join(repoRoot(), 'tenants'))).toBe(true);
  });

  it('definit agencyEmail pour que les leads aient une destination', () => {
    for (const t of tenants) expect(t.agencyEmail).toBeTruthy();
  });

  it('valorise les maisons au-dessus des appartements', () => {
    // Le coefficient venait du ratio global IDF (0.656) : un paradoxe de
    // Simpson qui sous-evaluait toute maison d'environ 50 %.
    for (const t of tenants) {
      const { appartement, maison } = t.estimation.propertyType;
      if (appartement === undefined || maison === undefined) continue;
      expect(maison).toBeGreaterThan(appartement);
    }
  });
});

describe('coherence avec les medianes DVF', () => {
  it('estime a moins de 25 % des medianes du secteur', () => {
    // Le PDF affiche l'estimation ET les reperes DVF sur la meme page : un
    // ecart trop large discredite l'outil devant le prospect.
    const t = tenants.find((x) => x.id === 'demo-idf');
    if (!t) return;
    const estimator = new ConfigEstimator(t.estimation);
    const cases: Array<[string, string, 'appartement' | 'maison']> = [
      ['75015', 'Paris', 'appartement'],
      ['93200', 'Saint-Denis', 'appartement'],
      ['78000', 'Versailles', 'maison'],
      ['95100', 'Argenteuil', 'maison'],
    ];
    for (const [postalCode, city, propertyType] of cases) {
      const stats = getPostalCodeStats(t.id, postalCode);
      if (!stats) continue;
      const median = propertyType === 'maison' ? stats.medianMaison : stats.medianAppart;
      if (!median) continue;
      const { pricePerM2 } = estimator.estimate({
        transaction: 'sale',
        propertyType,
        surface: 80,
        rooms: 3,
        condition: 'bon',
        postalCode,
        city,
        features: [],
      });
      const ecart = Math.abs(pricePerM2 / median - 1);
      expect(ecart, `${postalCode} ${propertyType}: ${pricePerM2} vs mediane ${median}`).toBeLessThan(0.25);
    }
  });
});
