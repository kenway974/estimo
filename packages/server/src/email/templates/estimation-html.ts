import type { EstimationEmailData } from '../types';
import type { MarketPostalCodeStats } from '../../config/market-stats';
import type { TransactionFees } from '../../estimation/fees';
import type { MatchedComparable } from '../../estimation/comparables';

/**
 * Template HTML d'estimation. Conçu pour être rendu par Puppeteer en PDF A4.
 * Esthétique sobre + dense en éléments visuels (cartes, barres, icônes SVG
 * inline) pour donner au prospect un vrai "dossier" valorisant.
 */
export function renderEstimationHtml(d: EstimationEmailData): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: d.result.currency, maximumFractionDigits: 0 }).format(n);
  const fmtNum = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
  const suffix = d.result.transaction === 'rent' ? '<span class="suffix"> / mois</span>' : '';
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const accent = d.primaryColor;
  const accentDark = darken(accent, 0.15);
  const accentLight = lighten(accent, 0.92);

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Estimation ${escapeHtml(d.property.city)}</title>
<style>${baseCss(accent, accentDark, accentLight)}</style>
</head>
<body>
  <main class="page">
    ${headerBlock(d, dateStr)}
    ${salutationBlock(d)}
    ${propertyBlock(d)}
    ${estimationBlock(d, fmt, suffix)}
    ${d.marketStats && d.result.pricePerM2 && d.property.transaction === 'sale'
      ? marketBlock(d.marketStats, d.result.pricePerM2, d.property.propertyType, d.property.postalCode, fmtNum)
      : ''}
    ${d.comparables && d.comparables.length > 0 ? comparablesBlock(d.comparables, fmt, fmtNum) : ''}
    ${d.fees && d.property.transaction === 'sale' ? feesBlock(d.fees, fmt) : ''}
    ${disclaimerBlock(d)}
    ${footerBlock(d, dateStr)}
  </main>
</body></html>`;
}

// ─── Blocs ───────────────────────────────────────────────────────

function headerBlock(d: EstimationEmailData, dateStr: string): string {
  const logo = d.logoUrl
    ? `<img class="logo" src="${escapeHtml(d.logoUrl)}" alt="${escapeHtml(d.agencyName)}">`
    : '';
  return `<header class="header">
    ${logo}
    <div class="header-text">
      <h1 class="agency-name">${escapeHtml(d.agencyName)}</h1>
      <p class="header-meta">Dossier d'estimation immobilière · ${dateStr}</p>
    </div>
  </header>`;
}

function salutationBlock(d: EstimationEmailData): string {
  return `<section class="salutation">
    <p class="hi">Bonjour ${escapeHtml(d.firstName)} ${escapeHtml(d.lastName)},</p>
    <p class="intro">Voici votre dossier d'estimation. En complément du prix calculé, vous trouverez les <strong>repères du marché local</strong> et les <strong>principaux frais à anticiper</strong>.</p>
  </section>`;
}

function propertyBlock(d: EstimationEmailData): string {
  const items: Array<{ icon: string; label: string; value: string }> = [
    { icon: iconHome(), label: 'Type', value: capitalize(d.property.propertyType) },
    { icon: iconTransaction(), label: 'Transaction', value: d.property.transaction === 'rent' ? 'Location' : 'Vente' },
    { icon: iconRuler(), label: 'Surface', value: `${d.property.surface} m²` },
  ];
  if (d.property.rooms !== undefined)
    items.push({ icon: iconRooms(), label: 'Pièces', value: String(d.property.rooms) });
  if (d.property.condition)
    items.push({ icon: iconSparkle(), label: 'État', value: capitalize(d.property.condition.replace(/_/g, ' ')) });
  items.push({
    icon: iconPin(),
    label: 'Localisation',
    value: `${escapeHtml(d.property.city)}${d.property.postalCode ? ' · ' + escapeHtml(d.property.postalCode) : ''}`,
  });

  const features = d.property.features && d.property.features.length > 0
    ? `<div class="features-row">
        <span class="features-label">Atouts</span>
        <div class="features-chips">
          ${d.property.features.map((f) => `<span class="chip">${escapeHtml(capitalize(f))}</span>`).join('')}
        </div>
      </div>`
    : '';

  return `<section class="block">
    <h2 class="section-title">Votre bien</h2>
    <div class="property-grid">
      ${items.map((it) => `
        <div class="property-card">
          <div class="property-icon">${it.icon}</div>
          <div class="property-content">
            <div class="property-label">${it.label}</div>
            <div class="property-value">${it.value}</div>
          </div>
        </div>`).join('')}
    </div>
    ${features}
  </section>`;
}

function estimationBlock(d: EstimationEmailData, fmt: (n: number) => string, suffix: string): string {
  const perM2 = d.result.pricePerM2
    ? `<p class="per-m2">Soit <strong>${fmt(d.result.pricePerM2)}</strong> / m²</p>`
    : '';
  return `<section class="estimation-card">
    <p class="estim-label">Prix estimé</p>
    <p class="estim-amount">${fmt(d.result.mid)}${suffix}</p>
    <div class="estim-range-row">
      <div class="range-tick"></div>
      <div class="range-text">
        <span class="range-low">${fmt(d.result.low)}</span>
        <span class="range-sep">–</span>
        <span class="range-high">${fmt(d.result.high)}${suffix}</span>
      </div>
      <div class="range-tick"></div>
    </div>
    ${perM2}
  </section>`;
}

function marketBlock(
  stats: MarketPostalCodeStats,
  yourPerM2: number,
  propertyType: string,
  postalCode: string | undefined,
  fmtNum: (n: number) => string,
): string {
  const isAppart = propertyType.toLowerCase() === 'appartement';
  const median = isAppart ? stats.medianAppart : stats.medianMaison ?? stats.medianAppart;
  if (!median) return '';

  const deltaPct = ((yourPerM2 - median) / median) * 100;
  const deltaAbsRounded = Math.round(Math.abs(deltaPct));
  const deltaSign = deltaPct >= 0 ? '+' : '−';
  const deltaClass = Math.abs(deltaPct) < 5 ? 'neutral' : deltaPct > 0 ? 'positive' : 'negative';
  const positionLabel =
    Math.abs(deltaPct) < 5 ? 'dans la médiane' : deltaPct > 0 ? 'au-dessus de la médiane' : 'en dessous de la médiane';

  // Position sur la barre (clamp dans [60% ; 140%] de la médiane)
  const minRef = median * 0.6;
  const maxRef = median * 1.4;
  const clamped = Math.max(minRef, Math.min(maxRef, yourPerM2));
  const markerPct = ((clamped - minRef) / (maxRef - minRef)) * 100;

  return `<section class="block">
    <h2 class="section-title">Repères du marché local</h2>
    <div class="market-block">
      <div class="market-headline">
        <div class="market-stat-block">
          <div class="market-stat-label">Médiane ${isAppart ? 'appartement' : 'maison'} · ${escapeHtml(stats.commune ?? postalCode ?? 'secteur')}</div>
          <div class="market-stat-value">${fmtNum(median)} <span class="unit">€/m²</span></div>
        </div>
        <div class="market-delta delta-${deltaClass}">
          <div class="delta-sign">${deltaSign}${deltaAbsRounded}%</div>
          <div class="delta-label">${positionLabel}</div>
        </div>
      </div>
      <div class="market-bar-wrapper">
        <div class="market-bar">
          <div class="bar-median"></div>
          <div class="bar-marker" style="left:${markerPct.toFixed(1)}%"></div>
        </div>
        <div class="bar-labels">
          <span>Moins cher</span>
          <span class="bar-label-median">Médiane ${fmtNum(median)} €/m²</span>
          <span>Plus cher</span>
        </div>
      </div>
      <p class="market-conclusion">
        Votre estimation à <strong>${fmtNum(Math.round(yourPerM2))} €/m²</strong> se situe <strong>${positionLabel}</strong> des ventes ${isAppart ? "d'appartements" : 'de maisons'} récentes du ${escapeHtml(postalCode ?? 'secteur')}.
      </p>
      <p class="market-source">
        ${iconDatabase()} <span><strong>${stats.txCount.toLocaleString('fr-FR')} transactions</strong> analysées sur les 3 dernières années · source <strong>DVF</strong> (Demandes de Valeurs Foncières, Etalab — data.gouv.fr)</span>
      </p>
    </div>
  </section>`;
}

function comparablesBlock(comps: MatchedComparable[], fmt: (n: number) => string, fmtNum: (n: number) => string): string {
  const rows = comps.map((c) => {
    const roomsLabel = c.rooms ? ` · ${c.rooms} pièce${c.rooms > 1 ? 's' : ''}` : '';
    const date = formatMonthYear(c.date);
    return `<div class="comp-row">
      <div class="comp-main">
        <div class="comp-title">${c.type} ${c.surface} m²${roomsLabel}</div>
        <div class="comp-sub">Vendu en ${date} · secteur ${c.postalCode}</div>
      </div>
      <div class="comp-prices">
        <div class="comp-price">${fmt(c.price)}</div>
        <div class="comp-perm2">${fmtNum(c.pricePerM2)} €/m²</div>
      </div>
    </div>`;
  }).join('');

  return `<section class="block">
    <h2 class="section-title">Ventes récentes dans le quartier</h2>
    <p class="comp-intro">Voici ${comps.length === 1 ? 'une vente récente' : `les ${comps.length} ventes les plus récentes`} d'un bien similaire au vôtre dans le même secteur (source DVF, données publiques anonymisées).</p>
    <div class="comp-list">
      ${rows}
    </div>
  </section>`;
}

function formatMonthYear(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  if (!y || !m) return yyyymm;
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const idx = Number(m) - 1;
  return `${months[idx] ?? m} ${y}`;
}

function feesBlock(fees: TransactionFees, fmt: (n: number) => string): string {
  return `<section class="block">
    <h2 class="section-title">Frais à prévoir si vente</h2>
    <div class="fees-grid">
      <div class="fee-card">
        <div class="fee-icon">${iconDocument()}</div>
        <div class="fee-title">Frais de notaire</div>
        <div class="fee-amount">${fmt(fees.notary.lowAmount)}<span class="fee-amount-sep"> – </span>${fmt(fees.notary.highAmount)}</div>
        <div class="fee-detail">${(fees.notary.lowPct * 100).toFixed(0)}–${(fees.notary.highPct * 100).toFixed(0)} % du prix · barème ${fees.notary.basis === 'neuf' ? 'logement neuf' : 'logement ancien'}</div>
        <div class="fee-note">À la charge de l'acheteur — info utile pour calibrer votre prix net vendeur.</div>
      </div>
      <div class="fee-card">
        <div class="fee-icon">${iconCheckList()}</div>
        <div class="fee-title">Diagnostics obligatoires</div>
        <div class="fee-amount">${fmt(fees.diagnostics.lowAmount)}<span class="fee-amount-sep"> – </span>${fmt(fees.diagnostics.highAmount)}</div>
        <div class="fee-detail">${fees.diagnostics.items.length} diagnostics requis</div>
        <div class="fee-note">${fees.diagnostics.items.join(' · ')}</div>
      </div>
      <div class="fee-card">
        <div class="fee-icon">${iconScale()}</div>
        <div class="fee-title">Plus-value éventuelle</div>
        <div class="fee-amount fee-amount-text">Selon usage</div>
        <div class="fee-detail">Exonérée pour la résidence principale</div>
        <div class="fee-note">Sinon imposable (19 % IR + 17,2 % prélèvements sociaux), avec abattements selon la durée de détention.</div>
      </div>
    </div>
  </section>`;
}

function disclaimerBlock(d: EstimationEmailData): string {
  return `<section class="disclaimer">
    <div class="disclaimer-icon">${iconInfo()}</div>
    <div class="disclaimer-text">
      <p class="disclaimer-title">À propos de cette estimation</p>
      <p>Estimation calculée automatiquement à partir de vos informations déclaratives et de références de prix locales (base DVF — source publique). Elle est <strong>indicative</strong>, ne constitue ni une expertise immobilière, ni une offre d'achat. Les frais sont des ordres de grandeur, à confirmer par un notaire et un diagnostiqueur certifié. ${escapeHtml(d.agencyName)} se tient à votre disposition pour organiser une visite et affiner l'estimation.</p>
    </div>
  </section>`;
}

function footerBlock(d: EstimationEmailData, dateStr: string): string {
  return `<footer class="footer">
    <span>${escapeHtml(d.agencyName)}</span>
    <span class="footer-sep">·</span>
    <span>Estimation générée le ${dateStr}</span>
    <span class="footer-sep">·</span>
    <span>Document confidentiel</span>
  </footer>`;
}

// ─── CSS ──────────────────────────────────────────────────────────

function baseCss(accent: string, accentDark: string, accentLight: string): string {
  return `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1f2937; font-size: 11pt; line-height: 1.5; background: #ffffff; }
.page { padding: 0; }

/* ── Header ── */
.header { background: linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%); color: #ffffff; padding: 28pt 36pt 24pt; display: flex; align-items: center; gap: 16pt; }
.header .logo { max-height: 44pt; max-width: 140pt; background: #ffffff; padding: 6pt 10pt; border-radius: 6pt; }
.header .agency-name { margin: 0; font-size: 22pt; font-weight: 700; letter-spacing: -0.5pt; }
.header .header-meta { margin: 4pt 0 0; font-size: 10pt; opacity: 0.92; font-weight: 400; }

/* ── Salutation ── */
.salutation { padding: 18pt 36pt 4pt; }
.salutation .hi { margin: 0 0 6pt; font-size: 12pt; color: #111827; font-weight: 500; }
.salutation .intro { margin: 0; color: #4b5563; font-size: 10.5pt; }

/* ── Section title ── */
.block { padding: 18pt 36pt 6pt; }
.section-title { margin: 0 0 12pt; font-size: 9pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; color: #6b7280; padding-bottom: 6pt; border-bottom: 1pt solid #e5e7eb; }

/* ── Property grid ── */
.property-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10pt; }
.property-card { display: flex; align-items: center; gap: 10pt; background: #f9fafb; border: 1pt solid #e5e7eb; border-radius: 8pt; padding: 10pt 12pt; }
.property-icon { flex-shrink: 0; width: 28pt; height: 28pt; background: ${accentLight}; color: ${accent}; border-radius: 6pt; display: flex; align-items: center; justify-content: center; }
.property-icon svg { width: 16pt; height: 16pt; }
.property-content { flex: 1; min-width: 0; }
.property-label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.4pt; color: #6b7280; font-weight: 600; }
.property-value { font-size: 11pt; color: #111827; font-weight: 600; margin-top: 1pt; line-height: 1.25; }

.features-row { margin-top: 12pt; display: flex; align-items: flex-start; gap: 14pt; }
.features-label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.4pt; color: #6b7280; font-weight: 600; padding-top: 5pt; min-width: 50pt; }
.features-chips { display: flex; flex-wrap: wrap; gap: 6pt; }
.chip { background: ${accentLight}; color: ${accentDark}; padding: 4pt 10pt; border-radius: 999pt; font-size: 9pt; font-weight: 600; }

/* ── Estimation card ── */
.estimation-card { margin: 18pt 36pt 4pt; padding: 26pt 30pt; border-radius: 14pt; background: linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%); color: #ffffff; text-align: center; }
.estim-label { margin: 0; font-size: 9pt; text-transform: uppercase; letter-spacing: 2pt; opacity: 0.85; font-weight: 600; }
.estim-amount { margin: 8pt 0 14pt; font-size: 36pt; font-weight: 700; letter-spacing: -1pt; line-height: 1.1; }
.estim-amount .suffix { font-size: 18pt; font-weight: 500; opacity: 0.9; }
.estim-range-row { display: flex; align-items: center; justify-content: center; gap: 12pt; opacity: 0.94; }
.estim-range-row .range-tick { flex: 1; height: 1pt; background: rgba(255,255,255,0.35); max-width: 50pt; }
.estim-range-row .range-text { font-size: 10.5pt; font-weight: 500; white-space: nowrap; }
.range-sep { margin: 0 5pt; opacity: 0.7; }
.per-m2 { margin: 14pt 0 0; font-size: 10pt; opacity: 0.9; }
.per-m2 strong { font-weight: 700; }

/* ── Market block ── */
.market-block { background: #f9fafb; border: 1pt solid #e5e7eb; border-radius: 10pt; padding: 16pt 18pt; }
.market-headline { display: flex; justify-content: space-between; align-items: flex-end; gap: 16pt; margin-bottom: 16pt; }
.market-stat-block { flex: 1; }
.market-stat-label { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.4pt; color: #6b7280; font-weight: 600; }
.market-stat-value { font-size: 24pt; font-weight: 700; color: #111827; line-height: 1.1; margin-top: 4pt; }
.market-stat-value .unit { font-size: 12pt; font-weight: 500; color: #6b7280; margin-left: 2pt; }
.market-delta { text-align: right; padding: 8pt 14pt; border-radius: 8pt; min-width: 100pt; }
.market-delta.delta-positive { background: #fef3c7; color: #92400e; }
.market-delta.delta-negative { background: #dcfce7; color: #166534; }
.market-delta.delta-neutral { background: #e0e7ff; color: #3730a3; }
.delta-sign { font-size: 18pt; font-weight: 700; line-height: 1.1; }
.delta-label { font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3pt; margin-top: 2pt; }

.market-bar-wrapper { margin: 18pt 0 14pt; }
.market-bar { position: relative; height: 10pt; background: linear-gradient(90deg, #86efac 0%, #fde047 50%, #fda4af 100%); border-radius: 999pt; }
.bar-median { position: absolute; left: 50%; top: -4pt; bottom: -4pt; width: 2pt; background: #374151; transform: translateX(-50%); border-radius: 1pt; }
.bar-marker { position: absolute; top: 50%; transform: translate(-50%, -50%); width: 16pt; height: 16pt; background: ${accent}; border: 3pt solid #ffffff; border-radius: 50%; box-shadow: 0 0 0 1pt ${accentDark}; }
.bar-labels { margin-top: 8pt; display: flex; justify-content: space-between; font-size: 8.5pt; color: #6b7280; }
.bar-label-median { color: #374151; font-weight: 600; }

.market-conclusion { margin: 14pt 0 8pt; font-size: 10.5pt; color: #1f2937; line-height: 1.55; }
.market-source { margin: 0; padding-top: 10pt; border-top: 1pt solid #e5e7eb; font-size: 8.5pt; color: #6b7280; display: flex; align-items: center; gap: 8pt; }
.market-source svg { width: 12pt; height: 12pt; flex-shrink: 0; color: #9ca3af; }

/* ── Comparables ── */
.comp-intro { margin: 0 0 12pt; font-size: 10pt; color: #4b5563; line-height: 1.5; }
.comp-list { display: flex; flex-direction: column; gap: 8pt; }
.comp-row { display: flex; justify-content: space-between; align-items: center; gap: 14pt; background: #ffffff; border: 1pt solid #e5e7eb; border-radius: 8pt; padding: 12pt 14pt; }
.comp-row::before { content: ''; display: block; width: 4pt; align-self: stretch; background: ${accent}; border-radius: 2pt; margin-right: 4pt; }
.comp-main { flex: 1; min-width: 0; }
.comp-title { font-size: 11pt; font-weight: 700; color: #111827; line-height: 1.25; }
.comp-sub { font-size: 9pt; color: #6b7280; margin-top: 3pt; font-weight: 500; }
.comp-prices { text-align: right; flex-shrink: 0; }
.comp-price { font-size: 13pt; font-weight: 700; color: #111827; line-height: 1.2; }
.comp-perm2 { font-size: 9pt; color: #6b7280; margin-top: 2pt; font-weight: 500; }

/* ── Fees ── */
.fees-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10pt; }
.fee-card { background: #ffffff; border: 1pt solid #e5e7eb; border-radius: 10pt; padding: 14pt; display: flex; flex-direction: column; }
.fee-icon { width: 30pt; height: 30pt; background: ${accentLight}; color: ${accent}; border-radius: 7pt; display: flex; align-items: center; justify-content: center; margin-bottom: 10pt; }
.fee-icon svg { width: 18pt; height: 18pt; }
.fee-title { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5pt; color: #6b7280; font-weight: 700; margin-bottom: 6pt; }
.fee-amount { font-size: 14pt; font-weight: 700; color: #111827; line-height: 1.2; margin-bottom: 4pt; }
.fee-amount-sep { font-weight: 400; color: #9ca3af; }
.fee-amount-text { font-size: 12pt; }
.fee-detail { font-size: 9pt; color: #4b5563; font-weight: 500; margin-bottom: 8pt; }
.fee-note { font-size: 8.5pt; color: #6b7280; line-height: 1.5; margin-top: auto; padding-top: 8pt; border-top: 1pt solid #f3f4f6; }

/* ── Disclaimer ── */
.disclaimer { margin: 18pt 36pt 8pt; padding: 14pt 16pt; background: #f9fafb; border-left: 3pt solid ${accent}; border-radius: 4pt; display: flex; gap: 12pt; align-items: flex-start; }
.disclaimer-icon { flex-shrink: 0; color: ${accent}; }
.disclaimer-icon svg { width: 18pt; height: 18pt; }
.disclaimer-text { flex: 1; }
.disclaimer-title { margin: 0 0 4pt; font-size: 10pt; font-weight: 700; color: #111827; }
.disclaimer-text p:not(.disclaimer-title) { margin: 0; font-size: 9pt; color: #4b5563; line-height: 1.55; }

/* ── Footer ── */
.footer { margin-top: 16pt; padding: 14pt 36pt 18pt; border-top: 1pt solid #e5e7eb; font-size: 8.5pt; color: #9ca3af; text-align: center; }
.footer-sep { margin: 0 6pt; opacity: 0.6; }
`;
}

// ─── Icônes SVG (Heroicons MIT) ───────────────────────────────────

function iconHome(): string {
  return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />`);
}
function iconTransaction(): string {
  return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />`);
}
function iconRuler(): string {
  return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75 17.25 11.25M12 12l9.75-9.75M3 21l18-18M6.75 17.25l4.5-4.5M2.25 12l9.75-9.75" />`);
}
function iconRooms(): string {
  return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />`);
}
function iconSparkle(): string {
  return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 0 0-3.09 3.091ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />`);
}
function iconPin(): string {
  return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />`);
}
function iconDocument(): string {
  return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />`);
}
function iconCheckList(): string {
  return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />`);
}
function iconScale(): string {
  return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />`);
}
function iconInfo(): string {
  return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />`);
}
function iconDatabase(): string {
  return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />`);
}

function svg(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">${inner}</svg>`;
}

// ─── Helpers ──────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

/** Assombrit une couleur hex (#rrggbb) d'un facteur [0, 1]. */
function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: Math.max(0, Math.round(r * (1 - amount))), g: Math.max(0, Math.round(g * (1 - amount))), b: Math.max(0, Math.round(b * (1 - amount))) });
}

/** Éclaircit une couleur hex vers le blanc d'un facteur [0, 1]. */
function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({
    r: Math.round(r + (255 - r) * amount),
    g: Math.round(g + (255 - g) * amount),
    b: Math.round(b + (255 - b) * amount),
  });
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace('#', '').match(/.{1,2}/g);
  const fallback = { r: 37, g: 99, b: 235 };
  if (!m || m.length < 3) return fallback;
  const [rs, gs, bs] = m;
  if (!rs || !gs || !bs) return fallback;
  return { r: parseInt(rs, 16), g: parseInt(gs, 16), b: parseInt(bs, 16) };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}
