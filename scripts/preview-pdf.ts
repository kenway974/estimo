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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'dvf-output');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Surcharge env.TENANTS_DIR pour pointer vers le bon dossier depuis la racine
// (le script tourne depuis le repo root, pas depuis packages/server).
process.env.TENANTS_DIR = path.join(REPO_ROOT, 'tenants');
process.env.NODE_ENV ??= 'development';
process.env.PORT ??= '8080';

async function main(): Promise<void> {
  // Imports dynamiques APRÈS l'override d'env pour que la config soit lue OK.
  const { renderEstimationPdf, closePdfRenderer } = await import(
    '../packages/server/src/email/templates/estimation-pdf'
  );
  const { computeTransactionFees } = await import('../packages/server/src/estimation/fees');
  const { findComparables } = await import('../packages/server/src/estimation/comparables');
  type EstimationEmailData = import('../packages/server/src/email/types').EstimationEmailData;

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
    marketStats: {
      medianAppart: 10009,
      medianMaison: 13416,
      txCount: 9095,
      commune: 'Paris 15e Arrondissement',
    },
    fees: computeTransactionFees(500000, 'bon'),
    // 3 ventes récentes réelles matchées dans demo-idf.comparables.json
    comparables: findComparables('demo-idf', {
      postalCode: '75015',
      propertyType: 'appartement',
      surface: 75,
    }),
  };

  console.log('⏳  Lancement de Chromium...');
  const t0 = Date.now();
  const pdf = await renderEstimationPdf(sampleData);
  const out = path.join(OUT, 'preview.pdf');
  writeFileSync(out, pdf);
  console.log(`✅  PDF généré en ${Date.now() - t0}ms : ${out}  (${(pdf.length / 1024).toFixed(1)} KB)`);
  console.log(`   ${sampleData.comparables?.length ?? 0} comparables trouvés pour la démo.`);
  console.log(`   Ouvre-le pour vérifier le design avant commit.`);

  await closePdfRenderer();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
