import { describe, it, expect } from 'vitest';
import { ConfigEstimator } from '../config-estimator';
import type { EstimationConfig, EstimationInput } from '../types';

const cfg: EstimationConfig = {
  currency: 'EUR',
  basePricePerM2: { sale: 5000, rent: 20 },
  propertyType: { appartement: 1, maison: 1.25, terrain: 0.4, local: 0.9 },
  condition: { neuf: 1.15, bon: 1, a_rafraichir: 0.9, a_renover: 0.78 },
  zones: { default: 1, '75011': 2, paris: 2 },
  rentZones: { default: 1, '75011': 1.45 },
  features: { balcon: 0.02, jardin: 0.06 },
  rooms: { reference: 3, perRoomPct: 0.02 },
  rangePct: 0.1,
  dpe: { A: 0.06, B: 0.03, C: 0, D: 0, E: -0.03, F: -0.08, G: -0.12, nc: 0 },
  floors: { rdc: -0.05, '1_3': 0, '4_6': 0.02, '7_plus': 0.03, dernier: 0.05, na: 0 },
  exposition: { S: 0.03, SO: 0.04, SE: 0.03, O: 0.02, E: 0, N: -0.02, nc: 0 },
};

const base: EstimationInput = {
  transaction: 'sale',
  propertyType: 'appartement',
  surface: 50,
  rooms: 3,
  condition: 'bon',
  postalCode: '00000',
  city: 'Nulle-Part',
  features: [],
};

const estimate = (o: Partial<EstimationInput> = {}) => new ConfigEstimator(cfg).estimate({ ...base, ...o });

describe('ConfigEstimator', () => {
  it('applique base x surface sur le cas neutre', () => {
    const r = estimate();
    expect(r.pricePerM2).toBe(5000);
    expect(r.mid).toBe(250_000);
  });

  it('encadre le prix avec rangePct', () => {
    const r = estimate();
    expect(r.low).toBe(225_000);
    expect(r.high).toBe(275_000);
  });

  it('valorise une maison au-dessus d un appartement a secteur egal', () => {
    // Garde-fou contre la regression du coefficient maison (calcule autrefois
    // sur le ratio global IDF, ce qui sous-evaluait les maisons de ~50 %).
    const appart = estimate({ propertyType: 'appartement' }).pricePerM2;
    const maison = estimate({ propertyType: 'maison' }).pricePerM2;
    expect(maison).toBeGreaterThan(appart);
  });

  it('resout la zone par code postal puis par ville', () => {
    expect(estimate({ postalCode: '75011' }).pricePerM2).toBe(10_000);
    expect(estimate({ postalCode: '99999', city: 'Paris' }).pricePerM2).toBe(10_000);
  });

  it('retombe sur la zone par defaut si rien ne correspond', () => {
    expect(estimate({ postalCode: '99999', city: 'Inconnue' }).pricePerM2).toBe(5000);
  });

  it('utilise rentZones en location, pas les zones de vente', () => {
    const r = estimate({ transaction: 'rent', postalCode: '75011' });
    expect(r.pricePerM2).toBe(29); // 20 x 1.45, et non 20 x 2
  });

  it('cumule les bonus equipements', () => {
    expect(estimate({ features: ['balcon', 'jardin'] }).mid).toBe(270_000); // +8 %
  });

  it('ignore un equipement inconnu au lieu de casser', () => {
    expect(estimate({ features: ['heliport'] }).mid).toBe(250_000);
  });

  it('ne compte les pieces qu au-dela de la reference', () => {
    expect(estimate({ rooms: 2 }).mid).toBe(250_000);
    expect(estimate({ rooms: 5 }).mid).toBe(260_000); // +2 x 2 %
  });

  it('penalise les passoires thermiques', () => {
    expect(estimate({ dpeClass: 'G' }).mid).toBeLessThan(estimate({ dpeClass: 'A' }).mid);
  });

  it('applique etage et exposition', () => {
    expect(estimate({ floor: 'rdc' }).mid).toBe(238_000); // 237 500 arrondi au millier
    expect(estimate({ exposition: 'SO' }).mid).toBe(260_000);
  });

  it('arrondit au millier en vente et a la dizaine en location', () => {
    expect(estimate({ surface: 37 }).mid % 1000).toBe(0);
    expect(estimate({ transaction: 'rent', surface: 37 }).mid % 10).toBe(0);
  });
});
