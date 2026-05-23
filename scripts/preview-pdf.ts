/**
 * Génère un PDF d'estimation de démonstration dans scripts/dvf-output/preview.pdf
 * pour itérer rapidement sur le design sans avoir à passer par l'API + envoi mail.
 *
 * Usage : npm run preview:pdf
 *         puis ouvrir scripts/dvf-output/preview.pdf
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderEstimationPdf } from '../packages/server/src/email/templates/estimation-pdf';
import type { EstimationEmailData } from '../packages/server/src/email/types';
import { computeTransactionFees } from '../packages/server/src/estimation/fees';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'dvf-output');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Données de démo : Paris 15e, appartement 75m² 3 pièces bon état
const sampleData: EstimationEmailData = {
  to: 'prospect@example.com',
  firstName: 'Camille',
  lastName: 'Durand',
  agencyName: 'Agence Demo IDF',
  primaryColor: '#2563eb',
  property: {
    transaction: 'sale',
    propertyType: 'appartement',
    surface: 75,
    rooms: 3,
    condition: 'bon',
    postalCode: '75015',
    city: 'Paris',
    features: ['balcon', 'parking', 'ascenseur'],
  },
  result: {
    low: 460000,
    mid: 500000,
    high: 540000,
    currency: 'EUR',
    pricePerM2: 6667,
    transaction: 'sale',
  },
  // Stats DVF Paris 15e (extraites de tenants/demo-idf.market-stats.json)
  marketStats: {
    medianAppart: 10009,
    medianMaison: 13416,
    txCount: 9095,
    commune: 'Paris 15e Arrondissement',
  },
  fees: computeTransactionFees(500000, 'bon'),
};

async function main(): Promise<void> {
  const pdf = await renderEstimationPdf(sampleData);
  const out = path.join(OUT, 'preview.pdf');
  writeFileSync(out, pdf);
  console.log(`✅  PDF généré : ${out}  (${(pdf.length / 1024).toFixed(1)} KB)`);
  console.log(`   Ouvre-le pour vérifier le design avant commit.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
