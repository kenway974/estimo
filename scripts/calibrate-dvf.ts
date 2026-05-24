/**
 * Calibration des coefficients d'estimation à partir des données DVF
 * (Demandes de Valeurs Foncières, base publique de toutes les transactions
 * immobilières françaises depuis 2014).
 *
 * - Télécharge les CSV gzippés pour les 8 départements d'Île-de-France
 *   (75, 77, 78, 91, 92, 93, 94, 95) sur les 3 dernières années.
 * - Filtre les ventes Appartement/Maison avec surfaces réalistes.
 * - Calcule médianes prix/m² par code postal × type de bien.
 * - Génère un tenant "demo-idf" calibré + un rapport markdown lisible.
 *
 * Usage : npm run calibrate:dvf
 */
import { createWriteStream, existsSync, mkdirSync, createReadStream, writeFileSync, readFileSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { parse } from 'csv-parse';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'dvf-data');
const OUT_DIR = path.join(__dirname, 'dvf-output');
const REPO_ROOT = path.resolve(__dirname, '..');

const DEPARTMENTS = ['75', '77', '78', '91', '92', '93', '94', '95'];
const YEARS = [2022, 2023, 2024];

// Filtres pour ne garder que les transactions "saines"
const MIN_SURFACE = 10;
const MIN_PRICE_PER_M2 = 1000;
const MAX_PRICE_PER_M2 = 30000;
// Seuil de transactions pour qu'un code postal soit gardé (sinon trop bruité)
const MIN_TX_PER_ZONE = 30;
// On limite la sortie aux N codes postaux les mieux représentés
const TOP_N_ZONES = 200;

type DvfRow = {
  id_mutation: string;
  nature_mutation: string;
  valeur_fonciere: string;
  code_postal: string;
  nom_commune: string;
  type_local: string;
  surface_reelle_bati: string;
  nombre_pieces_principales: string;
  date_mutation: string;
};

/** Une transaction anonymisée, prête pour l'index "comparables" du PDF. */
type ComparableSale = {
  /** "A" = Appartement, "M" = Maison (compact pour limiter la taille de l'index) */
  t: 'A' | 'M';
  /** Surface en m² */
  s: number;
  /** Prix de vente en € */
  p: number;
  /** Date (YYYY-MM, jour omis pour anonymisation) */
  d: string;
  /** Nombre de pièces (optionnel) */
  r?: number;
};

/** Télécharge un fichier DVF si pas déjà présent localement. */
async function ensureDownloaded(dept: string, year: number): Promise<string> {
  const filename = `${dept}-${year}.csv.gz`;
  const dest = path.join(DATA_DIR, filename);
  if (existsSync(dest)) return dest;

  const url = `https://files.data.gouv.fr/geo-dvf/latest/csv/${year}/departements/${dept}.csv.gz`;
  process.stdout.write(`  ⬇  ${filename} ... `);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status} pour ${url}`);
  }
  await pipeline(res.body as unknown as NodeJS.ReadableStream, createWriteStream(dest));
  process.stdout.write('ok\n');
  return dest;
}

/** Stream parse un CSV.gz, applique le filtre et appelle onRow pour chaque ligne valide. */
async function streamCsv(file: string, onRow: (row: DvfRow) => void): Promise<void> {
  const parser = parse({ columns: true, skip_empty_lines: true, relax_quotes: true });
  await pipeline(
    createReadStream(file),
    createGunzip(),
    parser,
    async function* (source) {
      for await (const row of source) {
        onRow(row as DvfRow);
        yield; // garde le pipeline drainant
      }
    },
  );
}

/** Calcule la médiane d'un tableau de nombres (modifie l'ordre). */
function median(arr: number[]): number {
  if (arr.length === 0) return NaN;
  arr.sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}

type Sample = { pricePerM2: number; type: 'Appartement' | 'Maison' };

async function main(): Promise<void> {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  // 1) Téléchargement des fichiers manquants
  console.log(`\n📥  Téléchargement des données DVF (${DEPARTMENTS.length} dept × ${YEARS.length} ans)`);
  const files: string[] = [];
  for (const year of YEARS) {
    for (const dept of DEPARTMENTS) {
      files.push(await ensureDownloaded(dept, year));
    }
  }

  // 2) Parse + filtre + agrégation
  //    Une mutation peut avoir plusieurs lignes (appart + cave + parking…). On
  //    déduplique par id_mutation en gardant uniquement les mutations qui ont
  //    EXACTEMENT 1 ligne Appartement OU Maison (les ventes "propres").
  console.log(`\n🔎  Lecture des CSV et filtrage`);
  const mutations = new Map<string, { rows: DvfRow[]; valeur: number }>();
  let totalRows = 0;

  for (const file of files) {
    process.stdout.write(`  • ${path.basename(file)} `);
    let kept = 0;
    await streamCsv(file, (row) => {
      totalRows++;
      if (row.nature_mutation !== 'Vente') return;
      if (row.type_local !== 'Appartement' && row.type_local !== 'Maison') return;
      const surface = Number(row.surface_reelle_bati);
      if (!surface || surface < MIN_SURFACE) return;
      const valeur = Number(row.valeur_fonciere);
      if (!valeur || valeur < 10000) return;

      const m = mutations.get(row.id_mutation) ?? { rows: [], valeur };
      m.rows.push(row);
      mutations.set(row.id_mutation, m);
      kept++;
    });
    process.stdout.write(`(${kept.toLocaleString('fr')} lignes appart/maison)\n`);
  }

  // Garder uniquement les mutations mono-lot (1 seule ligne appart/maison)
  const samplesByPostal = new Map<string, Sample[]>();
  // En parallèle, on construit l'index "comparables" (transactions anonymisées
  // par code postal, pour la section "Ventes récentes" du PDF). On garde toutes
  // les ventes mono-lot triées par date desc, puis on tronquera à N par CP.
  const comparablesByPostal = new Map<string, ComparableSale[]>();
  let cleanCount = 0;
  for (const { rows } of mutations.values()) {
    if (rows.length !== 1) continue; // ventes multi-lots écartées
    const r = rows[0];
    const surface = Number(r.surface_reelle_bati);
    const valeur = Number(r.valeur_fonciere);
    const ppm2 = valeur / surface;
    if (ppm2 < MIN_PRICE_PER_M2 || ppm2 > MAX_PRICE_PER_M2) continue;
    const cp = r.code_postal?.trim();
    if (!cp || cp.length !== 5) continue;
    cleanCount++;
    const arr = samplesByPostal.get(cp) ?? [];
    arr.push({ pricePerM2: ppm2, type: r.type_local as 'Appartement' | 'Maison' });
    samplesByPostal.set(cp, arr);

    // Ajout au pool des comparables (anonymisé, format compact)
    const rooms = Number(r.nombre_pieces_principales);
    const dateYM = (r.date_mutation || '').slice(0, 7); // YYYY-MM
    if (dateYM) {
      const cmp: ComparableSale = {
        t: r.type_local === 'Maison' ? 'M' : 'A',
        s: Math.round(surface),
        p: Math.round(valeur),
        d: dateYM,
      };
      if (Number.isFinite(rooms) && rooms > 0) cmp.r = rooms;
      const list = comparablesByPostal.get(cp) ?? [];
      list.push(cmp);
      comparablesByPostal.set(cp, list);
    }
  }

  console.log(
    `\n📊  ${totalRows.toLocaleString('fr')} lignes lues → ${mutations.size.toLocaleString('fr')} mutations → ${cleanCount.toLocaleString('fr')} transactions mono-lot retenues`,
  );

  // 3) Statistiques globales (base de référence = appart IDF)
  const allAppart: number[] = [];
  const allMaison: number[] = [];
  for (const arr of samplesByPostal.values()) {
    for (const s of arr) {
      if (s.type === 'Appartement') allAppart.push(s.pricePerM2);
      else allMaison.push(s.pricePerM2);
    }
  }
  const medianAppartIdf = median([...allAppart]);
  const medianMaisonIdf = median([...allMaison]);
  const propertyTypeMaisonMult = +(medianMaisonIdf / medianAppartIdf).toFixed(3);

  console.log(`\n🎯  Médiane IDF appartement : ${Math.round(medianAppartIdf)} €/m²`);
  console.log(`    Médiane IDF maison       : ${Math.round(medianMaisonIdf)} €/m²`);
  console.log(`    → multiplicateur maison  : ${propertyTypeMaisonMult}`);

  // 4) Calibration par code postal (uniquement ceux avec assez de données)
  type ZoneStat = { cp: string; count: number; medianAppart: number; medianMaison: number; mult: number; commune?: string };
  // On récupère un nom de commune représentatif par CP via la première mutation
  const communeByPostal = new Map<string, string>();
  for (const { rows } of mutations.values()) {
    if (rows.length !== 1) continue;
    const r = rows[0];
    if (r.code_postal && r.nom_commune && !communeByPostal.has(r.code_postal)) {
      communeByPostal.set(r.code_postal, r.nom_commune);
    }
  }

  const zoneStats: ZoneStat[] = [];
  for (const [cp, samples] of samplesByPostal.entries()) {
    if (samples.length < MIN_TX_PER_ZONE) continue;
    const appart = samples.filter((s) => s.type === 'Appartement').map((s) => s.pricePerM2);
    const maison = samples.filter((s) => s.type === 'Maison').map((s) => s.pricePerM2);
    const medA = median([...appart]);
    const medM = median([...maison]);
    // Multiplicateur de zone = médiane appart locale / médiane appart IDF
    // (on prend l'appart comme référence, type le plus représenté)
    if (!isFinite(medA)) continue;
    zoneStats.push({
      cp,
      count: samples.length,
      medianAppart: Math.round(medA),
      medianMaison: isFinite(medM) ? Math.round(medM) : 0,
      mult: +(medA / medianAppartIdf).toFixed(3),
      commune: communeByPostal.get(cp),
    });
  }
  zoneStats.sort((a, b) => b.count - a.count);
  const topZones = zoneStats.slice(0, TOP_N_ZONES);

  console.log(`\n🗺️   ${zoneStats.length} codes postaux ≥${MIN_TX_PER_ZONE} ventes — top ${topZones.length} conservés`);

  // 5) Construction de la config tenant calibrée
  const zonesConfig: Record<string, number> = { default: 1.0 };
  for (const z of topZones) zonesConfig[z.cp] = z.mult;

  const calibratedEstimation = {
    currency: 'EUR',
    basePricePerM2: {
      // basePrice = médiane appart IDF (arrondi à la dizaine la plus proche)
      sale: Math.round(medianAppartIdf / 10) * 10,
      rent: 24, // loyer IDF approximatif ; non calibré (DVF = ventes uniquement)
    },
    propertyType: {
      appartement: 1.0,
      maison: propertyTypeMaisonMult,
      terrain: 0.4,
      local: 0.9,
    },
    // Coefficients d'état conservés (DVF n'expose pas l'état du bien)
    condition: { neuf: 1.15, bon: 1.0, a_rafraichir: 0.9, a_renover: 0.78 },
    zones: zonesConfig,
    features: { parking: 0.03, garage: 0.05, balcon: 0.02, terrasse: 0.04, jardin: 0.06, piscine: 0.08, ascenseur: 0.02, cave: 0.015 },
    rooms: { reference: 3, perRoomPct: 0.0 },
    rangePct: 0.08,
  };

  // Valeurs par défaut utilisées seulement si le tenant n'existe pas encore.
  // Si le tenant existe déjà, on PRESERVE ses customisations (allowedDomains,
  // mail, crm, branding…) et on n'écrase QUE les champs estimation + _meta.
  const newMeta = {
    calibratedAt: new Date().toISOString(),
    source: 'DVF Etalab — files.data.gouv.fr',
    years: YEARS,
    departments: DEPARTMENTS,
    sampleSize: cleanCount,
    method: 'médiane prix/m² par code postal, filtrée mutations mono-lot, prix ∈ [1k, 30k] €/m²',
  };
  const defaultTenant = {
    id: 'demo-idf',
    name: 'Agence Demo Île-de-France',
    allowedDomains: ['http://localhost:5173', 'http://localhost:8080'],
    branding: { displayName: 'Agence Demo IDF', primaryColor: '#2563eb', accentColor: '#1e40af' },
    mail: { provider: 'smtp', fromEmail: 'tikenspam2@gmail.com', fromName: 'Agence Demo IDF' },
    crm: { provider: 'none' },
    estimation: calibratedEstimation,
    _meta: newMeta,
  };

  // 6) Écriture des fichiers de sortie (merge avec l'existant si présent)
  const tenantPath = path.join(REPO_ROOT, 'tenants', 'demo-idf.json');
  let tenantConfig: Record<string, unknown>;
  if (existsSync(tenantPath)) {
    const existing = JSON.parse(readFileSync(tenantPath, 'utf8')) as Record<string, unknown>;
    tenantConfig = { ...existing, estimation: calibratedEstimation, _meta: newMeta };
    console.log(`\n♻️   Tenant existant trouvé : seules les sections estimation + _meta sont mises à jour`);
  } else {
    tenantConfig = defaultTenant;
    console.log(`\n✨  Nouveau tenant créé avec les valeurs par défaut`);
  }
  writeFileSync(tenantPath, JSON.stringify(tenantConfig, null, 2) + '\n');
  console.log(`✅  Tenant calibré écrit : tenants/demo-idf.json`);

  // Rapport markdown
  const reportLines = [
    `# Calibration DVF Île-de-France`,
    ``,
    `_Généré le ${new Date().toISOString().slice(0, 10)} par \`scripts/calibrate-dvf.ts\`_`,
    ``,
    `## Source`,
    `- Base : DVF (Demandes de Valeurs Foncières), Etalab / files.data.gouv.fr`,
    `- Départements : ${DEPARTMENTS.join(', ')}`,
    `- Années : ${YEARS.join(', ')}`,
    `- Lignes brutes lues : **${totalRows.toLocaleString('fr')}**`,
    `- Mutations Vente Appart/Maison : **${mutations.size.toLocaleString('fr')}**`,
    `- Transactions mono-lot retenues : **${cleanCount.toLocaleString('fr')}**`,
    ``,
    `## Filtres`,
    `- \`nature_mutation = "Vente"\``,
    `- \`type_local ∈ {Appartement, Maison}\``,
    `- \`surface_reelle_bati ≥ ${MIN_SURFACE} m²\``,
    `- \`prix_m² ∈ [${MIN_PRICE_PER_M2}, ${MAX_PRICE_PER_M2}] €/m²\``,
    `- Mutation conservée seulement si **1 seule ligne** appart/maison (élimine les ventes multi-lots qui faussent le ratio prix/surface)`,
    ``,
    `## Résultats globaux`,
    `| Indicateur | Valeur |`,
    `|---|---|`,
    `| Médiane appartement IDF | **${Math.round(medianAppartIdf).toLocaleString('fr')} €/m²** |`,
    `| Médiane maison IDF | **${Math.round(medianMaisonIdf).toLocaleString('fr')} €/m²** |`,
    `| Multiplicateur maison/appart | **${propertyTypeMaisonMult}** |`,
    `| Base price retenue (sale) | **${calibratedEstimation.basePricePerM2.sale.toLocaleString('fr')} €/m²** |`,
    ``,
    `## Top 30 codes postaux (par volume)`,
    `| Code postal | Commune | Ventes | Médiane appart | Médiane maison | Multiplicateur |`,
    `|---|---|---:|---:|---:|---:|`,
    ...topZones.slice(0, 30).map((z) =>
      `| ${z.cp} | ${z.commune ?? '—'} | ${z.count} | ${z.medianAppart.toLocaleString('fr')} | ${z.medianMaison ? z.medianMaison.toLocaleString('fr') : '—'} | ${z.mult.toFixed(2)} |`,
    ),
    ``,
    `## Top 10 zones les plus chères (parmi celles ≥${MIN_TX_PER_ZONE} ventes)`,
    `| Code postal | Commune | Médiane appart | Multiplicateur |`,
    `|---|---|---:|---:|`,
    ...[...topZones].sort((a, b) => b.medianAppart - a.medianAppart).slice(0, 10).map((z) =>
      `| ${z.cp} | ${z.commune ?? '—'} | ${z.medianAppart.toLocaleString('fr')} | ${z.mult.toFixed(2)} |`,
    ),
    ``,
    `## Top 10 zones les moins chères (parmi celles ≥${MIN_TX_PER_ZONE} ventes)`,
    `| Code postal | Commune | Médiane appart | Multiplicateur |`,
    `|---|---|---:|---:|`,
    ...[...topZones].sort((a, b) => a.medianAppart - b.medianAppart).slice(0, 10).map((z) =>
      `| ${z.cp} | ${z.commune ?? '—'} | ${z.medianAppart.toLocaleString('fr')} | ${z.mult.toFixed(2)} |`,
    ),
    ``,
    `## Limites`,
    `- L'état du bien (neuf/bon/à rafraîchir/à rénover) **n'est pas dans DVF** → multiplicateurs conservés tels quels.`,
    `- Les features (parking, balcon, etc.) ne sont pas dans DVF → conservés tels quels.`,
    `- Les loyers (\`basePricePerM2.rent\`) ne sont pas calibrés (DVF = transactions de vente uniquement).`,
    `- Les ventes multi-lots (appart + parking + cave par exemple) sont exclues pour ne pas biaiser le prix/m².`,
    `- Le coefficient maison/appart calculé sur IDF (${propertyTypeMaisonMult}) peut être plus faible que la valeur initiale (1.1) car en IDF les maisons sont souvent en périphérie moins chère.`,
    ``,
  ];
  const reportPath = path.join(OUT_DIR, 'report.md');
  writeFileSync(reportPath, reportLines.join('\n'));
  console.log(`📄  Rapport écrit : scripts/dvf-output/report.md`);

  // Snapshot JSON brut des stats par zone (pour debug)
  const statsPath = path.join(OUT_DIR, 'zones-full.json');
  writeFileSync(statsPath, JSON.stringify({ medianAppartIdf, medianMaisonIdf, zones: zoneStats }, null, 2));
  console.log(`📦  Stats détaillées : scripts/dvf-output/zones-full.json`);

  // Stats marché par code postal — chargées au runtime par le serveur pour
  // enrichir le PDF d'estimation envoyé au prospect (positionnement marché).
  const marketStats = {
    _meta: {
      source: 'DVF Etalab — files.data.gouv.fr',
      years: YEARS,
      departments: DEPARTMENTS,
      calibratedAt: new Date().toISOString(),
      sampleSize: cleanCount,
    },
    global: {
      medianAppart: Math.round(medianAppartIdf),
      medianMaison: Math.round(medianMaisonIdf),
    },
    byPostalCode: Object.fromEntries(
      topZones.map((z) => [
        z.cp,
        {
          medianAppart: z.medianAppart,
          medianMaison: z.medianMaison || null,
          txCount: z.count,
          commune: z.commune ?? null,
        },
      ]),
    ),
  };
  const marketStatsPath = path.join(REPO_ROOT, 'tenants', 'demo-idf.market-stats.json');
  writeFileSync(marketStatsPath, JSON.stringify(marketStats, null, 2) + '\n');
  console.log(`📊  Stats marché tenant : tenants/demo-idf.market-stats.json`);

  // Index "comparables" pour la section "Ventes récentes" du PDF.
  // Pour chaque code postal du top calibré, on garde les COMP_MAX_PER_CP
  // transactions les plus récentes (suffisant pour trouver 3 matches sur
  // surface ±20%). Format compact pour limiter la taille (~3-6 MB pour IDF).
  const COMP_MAX_PER_CP = 200;
  const topCpSet = new Set(topZones.map((z) => z.cp));
  const comparablesIndex: Record<string, ComparableSale[]> = {};
  let totalComps = 0;
  for (const [cp, sales] of comparablesByPostal.entries()) {
    if (!topCpSet.has(cp)) continue; // on ne garde que les CP du top calibré
    sales.sort((a, b) => b.d.localeCompare(a.d)); // date desc (YYYY-MM)
    const kept = sales.slice(0, COMP_MAX_PER_CP);
    comparablesIndex[cp] = kept;
    totalComps += kept.length;
  }
  const comparables = {
    _meta: {
      source: 'DVF Etalab — files.data.gouv.fr',
      years: YEARS,
      departments: DEPARTMENTS,
      calibratedAt: new Date().toISOString(),
      sampleSize: totalComps,
      maxPerPostalCode: COMP_MAX_PER_CP,
    },
    byPostalCode: comparablesIndex,
  };
  const comparablesPath = path.join(REPO_ROOT, 'tenants', 'demo-idf.comparables.json');
  writeFileSync(comparablesPath, JSON.stringify(comparables) + '\n'); // pas d'indent : économise ~50% de taille
  const sizeKb = Math.round(JSON.stringify(comparables).length / 1024);
  console.log(`🔍  Comparables index : tenants/demo-idf.comparables.json (${totalComps.toLocaleString('fr-FR')} ventes, ${sizeKb} KB)`);

  console.log(`\n🎉  Terminé.`);
}

main().catch((err) => {
  console.error('\n❌  Erreur :', err);
  process.exit(1);
});
