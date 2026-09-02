/**
 * Calibration des coefficients de LOCATION à partir de la « Carte des loyers »
 * (ANIL + Ministère de la Transition écologique, publiée sur data.gouv.fr).
 *
 * DVF ne contient aucune donnée locative : c'est la seule source publique
 * nationale pour les loyers. Elle fournit, par commune, un loyer médian au m²
 * décliné en quatre typologies — appartements toutes tailles, T1-T2, T3 et
 * plus, maisons.
 *
 * Le script :
 *  - résout les fichiers via l'API data.gouv (pas d'URL en dur : le millésime
 *    change tous les ans) ;
 *  - agrège les communes par code postal, via la base officielle La Poste ;
 *  - écrit `rentZones`, `basePricePerM2.rent` et `rentTypology` dans le tenant ;
 *  - produit un rapport lisible dans scripts/loyers-output/report.md.
 *
 * ⚠️ Les indicateurs sont des LOYERS D'ANNONCE, CHARGES COMPRISES, sur du non
 * meublé. Ce ne sont pas des loyers signés. Le rapport le rappelle pour que ce
 * soit affiché au prospect.
 *
 * Usage : npm run calibrate:loyers
 *         npm run calibrate:loyers -- --tenant=demo --departments=974
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'loyers-output');
const REPO_ROOT = path.resolve(__dirname, '..');

/** Millésime visé. Le slug suit toujours la même forme d'une année sur l'autre. */
const DATASET_SLUG = 'carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025';
/** Base officielle des codes postaux (La Poste), pour passer du code INSEE au CP. */
const CODES_POSTAUX_SLUG = 'base-officielle-des-codes-postaux';

const API = 'https://www.data.gouv.fr/api/1/datasets';

// ── Arguments ────────────────────────────────────────────────────────────────
const args = new Map(
  process.argv.slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v = ''] = a.slice(2).split('=');
      return [k, v] as [string, string];
    }),
);
const TENANT_ID = args.get('tenant') || 'demo-idf';
const DEPARTMENTS = (args.get('departments') || '75,77,78,91,92,93,94,95')
  .split(',')
  .map((d) => d.trim())
  .filter(Boolean);
/** Communes minimum rattachées à un CP pour qu'on lui fasse confiance. */
const MIN_COMMUNES_PER_CP = 1;
/** Nombre de codes postaux conservés dans la config finale. */
const TOP_N_ZONES = 300;

/** Les quatre typologies publiées, et comment les reconnaître dans les titres. */
type Typologie = 'appartement' | 't1_t2' | 't3_plus' | 'maison';
const TYPOLOGIES: { key: Typologie; label: string; match: RegExp }[] = [
  // L'ordre compte : les libellés T1-T2 / T3+ contiennent aussi "appartement",
  // donc on les teste AVANT le fichier "appartements toutes tailles".
  { key: 't1_t2', label: 'Appartements T1-T2', match: /appart.*(1\s*et\s*2|t1|1-2)/i },
  { key: 't3_plus', label: 'Appartements T3+', match: /appart.*(3\s*pi|t3|3\+|3 et plus)/i },
  { key: 'maison', label: 'Maisons', match: /maison/i },
  { key: 'appartement', label: 'Appartements (toutes tailles)', match: /appart/i },
];

interface Resource { title: string; url: string; format?: string }

// ── Utilitaires ──────────────────────────────────────────────────────────────
function median(arr: number[]): number {
  if (!arr.length) return NaN;
  const a = [...arr].sort((x, y) => x - y);
  const m = a.length >> 1;
  return a.length % 2 ? a[m]! : (a[m - 1]! + a[m]!) / 2;
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

async function getText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

/**
 * Parse un CSV en tolérant les variantes rencontrées sur data.gouv :
 * séparateur `;` ou `,`, virgule décimale, BOM en tête de fichier.
 */
function parseCsv(raw: string): Record<string, string>[] {
  const text = raw.replace(/^﻿/, '');
  const firstLine = text.slice(0, text.indexOf('\n'));
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  return parse(text, { columns: true, delimiter, skip_empty_lines: true, relax_column_count: true });
}

/** Retrouve une colonne quel que soit son habillage (casse, points, accents). */
function pickColumn(row: Record<string, string>, candidates: RegExp[]): string | null {
  for (const re of candidates) {
    const found = Object.keys(row).find((k) => re.test(k.trim()));
    if (found) return found;
  }
  return null;
}

function toNumber(v: string | undefined): number {
  if (!v) return NaN;
  return Number(String(v).replace(',', '.').replace(/\s/g, ''));
}

// ── Étape 1 : résoudre les fichiers via l'API ────────────────────────────────
async function resolveResources(slug: string): Promise<Resource[]> {
  const data = await getJson(`${API}/${slug}/`);
  const resources: Resource[] = (data.resources ?? []).map((r: any) => ({
    title: String(r.title ?? ''),
    url: String(r.url ?? ''),
    format: r.format ? String(r.format) : undefined,
  }));
  if (!resources.length) throw new Error(`Aucune ressource dans le jeu de données "${slug}"`);
  return resources;
}

function matchTypologies(resources: Resource[]): Map<Typologie, Resource> {
  const csv = resources.filter((r) => /csv/i.test(r.format ?? '') || /\.csv(\?|$)/i.test(r.url));
  const out = new Map<Typologie, Resource>();
  const used = new Set<string>();
  for (const t of TYPOLOGIES) {
    const hit = csv.find((r) => !used.has(r.url) && t.match.test(r.title));
    if (hit) {
      out.set(t.key, hit);
      used.add(hit.url);
    }
  }
  return out;
}

// ── Étape 2 : code INSEE -> codes postaux ────────────────────────────────────
async function loadInseeToPostal(): Promise<Map<string, string[]>> {
  const resources = await resolveResources(CODES_POSTAUX_SLUG);
  const csv = resources.find(
    (r) => (/csv/i.test(r.format ?? '') || /\.csv(\?|$)/i.test(r.url)) && /commune|postal/i.test(r.title),
  ) ?? resources.find((r) => /csv/i.test(r.format ?? ''));
  if (!csv) throw new Error('Base des codes postaux : aucun CSV trouvé');

  process.stdout.write(`   ↳ codes postaux : ${csv.title}\n`);
  const rows = parseCsv(await getText(csv.url));
  const first = rows[0];
  if (!first) throw new Error('Base des codes postaux : fichier vide');

  const colInsee = pickColumn(first, [/^#?code_?commune_?insee$/i, /insee/i]);
  const colCp = pickColumn(first, [/^code_?postal$/i, /postal/i]);
  if (!colInsee || !colCp) {
    throw new Error(
      `Base des codes postaux : colonnes introuvables. Colonnes vues : ${Object.keys(first).join(', ')}`,
    );
  }

  const map = new Map<string, string[]>();
  for (const r of rows) {
    const insee = String(r[colInsee] ?? '').trim();
    const cp = String(r[colCp] ?? '').trim().padStart(5, '0');
    if (!insee || !/^\d{5}$/.test(cp)) continue;
    const list = map.get(insee) ?? [];
    if (!list.includes(cp)) list.push(cp);
    map.set(insee, list);
  }
  return map;
}

// ── Étape 3 : charger une typologie ──────────────────────────────────────────
/** loyer médian €/m² par code INSEE, pour une typologie. */
async function loadTypologie(res: Resource): Promise<Map<string, number>> {
  const rows = parseCsv(await getText(res.url));
  const first = rows[0];
  if (!first) throw new Error(`${res.title} : fichier vide`);

  const colInsee = pickColumn(first, [/^insee_?c$/i, /^code_?insee$/i, /insee/i]);
  const colLoyer = pickColumn(first, [/^loypredm2$/i, /loy.*m2/i, /loyer/i]);
  if (!colInsee || !colLoyer) {
    throw new Error(
      `${res.title} : colonnes introuvables (attendu INSEE_C et loypredm2). Colonnes vues : ${Object.keys(first).join(', ')}`,
    );
  }

  const out = new Map<string, number>();
  for (const r of rows) {
    const insee = String(r[colInsee] ?? '').trim();
    const loyer = toNumber(r[colLoyer]);
    if (!insee || !isFinite(loyer) || loyer <= 0) continue;
    out.set(insee, loyer);
  }
  return out;
}

// ── Programme ────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\n📍  Tenant ciblé : ${TENANT_ID}`);
  console.log(`    Départements  : ${DEPARTMENTS.join(', ')}\n`);

  console.log('⏳  Résolution des fichiers sur data.gouv...');
  const resources = await resolveResources(DATASET_SLUG);
  const files = matchTypologies(resources);

  for (const t of TYPOLOGIES) {
    const r = files.get(t.key);
    console.log(`   ${r ? '✅' : '❌'} ${t.label.padEnd(32)} ${r ? r.title : 'introuvable'}`);
  }
  if (!files.has('appartement')) {
    throw new Error(
      'Le fichier « appartements toutes tailles » est introuvable : impossible de calibrer la base.\n' +
        `Ressources disponibles :\n  - ${resources.map((r) => r.title).join('\n  - ')}`,
    );
  }

  console.log('\n⏳  Téléchargement de la base des codes postaux...');
  const inseeToCp = await loadInseeToPostal();
  console.log(`   ${inseeToCp.size.toLocaleString('fr')} communes indexées`);

  console.log('\n⏳  Téléchargement des loyers...');
  const data = new Map<Typologie, Map<string, number>>();
  for (const [key, res] of files) {
    const m = await loadTypologie(res);
    data.set(key, m);
    console.log(`   ${key.padEnd(12)} ${m.size.toLocaleString('fr')} communes`);
  }

  const appart = data.get('appartement')!;

  // Agrégation par code postal, restreinte aux départements demandés.
  const byCp = new Map<string, { communes: string[]; values: number[] }>();
  for (const [insee, loyer] of appart) {
    const cps = inseeToCp.get(insee);
    if (!cps) continue;
    for (const cp of cps) {
      if (!DEPARTMENTS.some((d) => cp.startsWith(d))) continue;
      const e = byCp.get(cp) ?? { communes: [], values: [] };
      e.values.push(loyer);
      e.communes.push(insee);
      byCp.set(cp, e);
    }
  }
  if (!byCp.size) {
    throw new Error(`Aucun code postal trouvé pour les départements ${DEPARTMENTS.join(', ')}`);
  }

  type Zone = { cp: string; loyer: number; communes: number };
  const zones: Zone[] = [...byCp.entries()]
    .filter(([, e]) => e.communes.length >= MIN_COMMUNES_PER_CP)
    .map(([cp, e]) => ({ cp, loyer: median(e.values), communes: e.communes.length }))
    .filter((z) => isFinite(z.loyer))
    .sort((a, b) => b.communes - a.communes || a.cp.localeCompare(b.cp));

  const baseRent = median(zones.map((z) => z.loyer));
  const top = zones.slice(0, TOP_N_ZONES);

  console.log(`\n🗺️   ${zones.length} codes postaux — base retenue : ${baseRent.toFixed(1)} €/m²`);

  // Coefficients de typologie : médiane des ratios COMMUNE PAR COMMUNE.
  // Jamais le ratio des médianes nationales — c'est le piège qui avait
  // sous-évalué les maisons de moitié dans la calibration DVF.
  function ratioVs(cible: Typologie): number | null {
    const m = data.get(cible);
    if (!m) return null;
    const ratios: number[] = [];
    for (const [insee, valeur] of m) {
      const ref = appart.get(insee);
      if (!ref || ref <= 0) continue;
      const cps = inseeToCp.get(insee);
      if (!cps?.some((cp) => DEPARTMENTS.some((d) => cp.startsWith(d)))) continue;
      ratios.push(valeur / ref);
    }
    if (ratios.length < 20) return null;
    return +median(ratios).toFixed(3);
  }

  const r1 = ratioVs('t1_t2');
  const r3 = ratioVs('t3_plus');
  const rMaison = ratioVs('maison');

  console.log(`    T1-T2   : ${r1 ?? '— (données insuffisantes)'}`);
  console.log(`    T3+     : ${r3 ?? '— (données insuffisantes)'}`);
  console.log(`    maison  : ${rMaison ?? '— (données insuffisantes)'}`);

  // ── Écriture du tenant ────────────────────────────────────────────────────
  const tenantPath = path.join(REPO_ROOT, 'tenants', `${TENANT_ID}.json`);
  if (!existsSync(tenantPath)) throw new Error(`Tenant introuvable : ${tenantPath}`);
  const tenant = JSON.parse(readFileSync(tenantPath, 'utf8'));

  const rentZones: Record<string, number> = { default: 1 };
  for (const z of top) rentZones[z.cp] = +(z.loyer / baseRent).toFixed(3);

  tenant.estimation.basePricePerM2.rent = Math.round(baseRent * 10) / 10;
  tenant.estimation.rentZones = rentZones;
  if (r1 && r3) tenant.estimation.rentTypology = { t1_t2: r1, t3_plus: r3 };

  writeFileSync(tenantPath, JSON.stringify(tenant, null, 2) + '\n');
  console.log(`\n✅  ${path.relative(REPO_ROOT, tenantPath)} mis à jour`);

  // Index annexe, pour d'éventuels repères marché dans le PDF.
  const statsPath = path.join(REPO_ROOT, 'tenants', `${TENANT_ID}.rent-stats.json`);
  writeFileSync(
    statsPath,
    JSON.stringify(
      {
        _meta: {
          source: 'Carte des loyers (ANIL / Ministère de la Transition écologique) — data.gouv.fr',
          dataset: DATASET_SLUG,
          nature: "loyers d'annonce, charges comprises, non meublé",
          calibratedAt: new Date().toISOString(),
          departments: DEPARTMENTS,
        },
        baseRent: Math.round(baseRent * 10) / 10,
        typology: r1 && r3 ? { t1_t2: r1, t3_plus: r3 } : null,
        byPostalCode: Object.fromEntries(top.map((z) => [z.cp, { loyerM2: +z.loyer.toFixed(1), communes: z.communes }])),
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`✅  ${path.relative(REPO_ROOT, statsPath)} écrit`);

  // ── Rapport ───────────────────────────────────────────────────────────────
  const cheres = [...top].sort((a, b) => b.loyer - a.loyer).slice(0, 10);
  const basses = [...top].sort((a, b) => a.loyer - b.loyer).slice(0, 10);
  const report = [
    `# Calibration des loyers — tenant \`${TENANT_ID}\``,
    '',
    `Généré le ${new Date().toLocaleString('fr-FR')}.`,
    '',
    '## Source',
    '',
    '- **Carte des loyers** (ANIL + Ministère de la Transition écologique), via data.gouv.fr',
    `- Jeu de données : \`${DATASET_SLUG}\``,
    '- Correspondance commune → code postal : base officielle La Poste',
    '',
    '> ⚠️ Ce sont des **loyers d’annonce, charges comprises**, sur du logement',
    '> **non meublé** — pas des loyers réellement signés. Les indicateurs sont',
    '> qualifiés d’expérimentaux par leurs auteurs, et extrapolés depuis une',
    '> maille voisine pour les communes sans annonces. À mentionner au prospect.',
    '',
    '## Résultats',
    '',
    '| Paramètre | Valeur |',
    '|---|---|',
    `| Départements | ${DEPARTMENTS.join(', ')} |`,
    `| Codes postaux retenus | ${top.length} (sur ${zones.length}) |`,
    `| Loyer de base | **${baseRent.toFixed(1)} €/m²** |`,
    `| Coefficient T1-T2 | ${r1 ?? '— non calibré'} |`,
    `| Coefficient T3 et plus | ${r3 ?? '— non calibré'} |`,
    `| Ratio maison / appartement | ${rMaison ?? '— non calibré'} |`,
    '',
    '## Top 10 des loyers les plus élevés',
    '',
    '| Code postal | Loyer €/m² | Coefficient |',
    '|---|---|---|',
    ...cheres.map((z) => `| ${z.cp} | ${z.loyer.toFixed(1)} | ${(z.loyer / baseRent).toFixed(2)} |`),
    '',
    '## Top 10 des loyers les plus bas',
    '',
    '| Code postal | Loyer €/m² | Coefficient |',
    '|---|---|---|',
    ...basses.map((z) => `| ${z.cp} | ${z.loyer.toFixed(1)} | ${(z.loyer / baseRent).toFixed(2)} |`),
    '',
    '## Limites connues',
    '',
    "- Le découpage T1-T2 / T3+ est le plus fin que la source permette. À l'intérieur",
    "  d'une tranche, un 15 m² et un 45 m² reçoivent le même coefficient alors que",
    '  leurs loyers au m² diffèrent encore sensiblement.',
    '- Les charges sont incluses : compter 10 à 15 % d’écart avec un loyer hors charges.',
    '- Le meublé n’est pas couvert et se loue plus cher.',
    '',
  ].join('\n');
  writeFileSync(path.join(OUT_DIR, 'report.md'), report);
  console.log(`✅  ${path.relative(REPO_ROOT, path.join(OUT_DIR, 'report.md'))} écrit\n`);
}

main().catch((e) => {
  console.error(`\n❌  ${e instanceof Error ? e.message : e}\n`);
  process.exitCode = 1;
});
