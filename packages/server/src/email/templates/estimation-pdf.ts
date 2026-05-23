import PDFDocument from 'pdfkit';
import type { EstimationEmailData } from '../types';
import type { MarketPostalCodeStats } from '../../config/market-stats';
import type { TransactionFees } from '../../estimation/fees';

/**
 * Génère un PDF d'estimation brandé en buffer, joint au mail prospect.
 * Utilise les fonts Helvetica intégrées à PDFKit (zéro asset externe).
 *
 * Le PDF est conçu pour donner au prospect un "vrai dossier" qui justifie
 * qu'il ait laissé son email :
 *   1. Récap du bien
 *   2. Estimation chiffrée
 *   3. Repères du marché local (DVF, optionnel)
 *   4. Frais à prévoir si vente (notaire, diagnostics)
 *   5. Disclaimer + footer
 */
export async function renderEstimationPdf(d: EstimationEmailData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 60, left: 50, right: 50 } });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: d.result.currency, maximumFractionDigits: 0 }).format(n);
  const fmtNum = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
  const suffix = d.result.transaction === 'rent' ? ' / mois' : '';
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const pageW = doc.page.width;
  const contentW = pageW - 100;

  // ─── Bandeau coloré (couleur primaire de l'agence) ───
  const headerH = 90;
  doc.rect(0, 0, pageW, headerH).fill(d.primaryColor);
  doc
    .fill('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(22)
    .text(d.agencyName, 50, 30, { width: contentW });
  doc.font('Helvetica').fontSize(11).text(`Estimation immobilière indicative — ${dateStr}`, 50, 60);
  doc.fillColor('#1f2937');
  doc.y = headerH + 30;

  // ─── Salutation ───
  doc.font('Helvetica').fontSize(11).fillColor('#1f2937')
    .text(`Bonjour ${d.firstName} ${d.lastName},`, 50);
  doc.moveDown(0.5);
  doc.text(
    `Voici votre dossier d'estimation. En complément du prix estimé, vous trouverez ci-dessous les repères du marché local et les principaux frais à prévoir.`,
    { width: contentW, lineGap: 2 },
  );
  doc.moveDown(1.2);

  // ─── 1. Votre bien ───
  drawSectionTitle(doc, 'Votre bien');
  const propRows: Array<[string, string]> = [
    ['Type de bien', capitalize(d.property.propertyType)],
    ['Transaction', d.property.transaction === 'rent' ? 'Location' : 'Vente'],
    ['Surface', `${d.property.surface} m²`],
  ];
  if (d.property.rooms !== undefined) propRows.push(['Nombre de pièces', String(d.property.rooms)]);
  if (d.property.condition) propRows.push(['État', capitalize(d.property.condition.replace(/_/g, ' '))]);
  propRows.push(['Localisation', `${d.property.city}${d.property.postalCode ? ' (' + d.property.postalCode + ')' : ''}`]);
  if (d.property.features && d.property.features.length > 0) {
    propRows.push(['Atouts', d.property.features.map(capitalize).join(', ')]);
  }
  drawKeyValueTable(doc, propRows);
  doc.moveDown(1.2);

  // ─── 2. Estimation (carte primaire) ───
  drawSectionTitle(doc, 'Notre estimation');
  const cardY = doc.y;
  const cardH = 110;
  doc.roundedRect(50, cardY, contentW, cardH, 10).fill(d.primaryColor);
  doc.fillColor('#ffffff').font('Helvetica').fontSize(10)
    .text('PRIX ESTIMÉ', 50, cardY + 18, { width: contentW, align: 'center', characterSpacing: 1 });
  doc.font('Helvetica-Bold').fontSize(30)
    .text(`${fmt(d.result.mid)}${suffix}`, 50, cardY + 38, { width: contentW, align: 'center' });
  doc.font('Helvetica').fontSize(11)
    .text(`Fourchette : ${fmt(d.result.low)} – ${fmt(d.result.high)}${suffix}`, 50, cardY + 78, {
      width: contentW, align: 'center',
    });
  doc.fillColor('#1f2937');
  doc.y = cardY + cardH + 12;

  if (d.result.pricePerM2) {
    doc.font('Helvetica').fontSize(10).fillColor('#6b7280')
      .text(`Soit ${fmt(d.result.pricePerM2)} / m².`, 50, doc.y, { width: contentW, align: 'center' });
    doc.moveDown(1.2);
  }

  // ─── 3. Repères du marché local (uniquement si on a des stats DVF) ───
  if (d.marketStats && d.result.pricePerM2 && d.property.transaction === 'sale') {
    drawSectionTitle(doc, 'Repères du marché local');
    drawMarketSection(doc, d.marketStats, d.result.pricePerM2, d.property.propertyType, d.property.postalCode, d.primaryColor, contentW);
    doc.moveDown(1.2);
  }

  // ─── 4. Frais à prévoir (uniquement pour une vente) ───
  if (d.fees && d.property.transaction === 'sale') {
    drawSectionTitle(doc, 'Frais à prévoir si vente');
    drawFeesSection(doc, d.fees, d.result.currency, contentW);
    doc.moveDown(1.0);
  }

  // ─── 5. Disclaimer ───
  doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(10).text('À propos de cette estimation', 50);
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(9.5).fillColor('#4b5563')
    .text(
      `Cette estimation est calculée automatiquement à partir des informations déclaratives que vous nous avez transmises et de références de prix locales (base DVF — Demandes de Valeurs Foncières, source publique). Elle est fournie à titre indicatif et ne constitue ni une expertise immobilière, ni une offre d'achat. Les frais et fourchettes indiqués sont des ordres de grandeur ; ils doivent être confirmés par un notaire, un diagnostiqueur certifié et votre conseiller fiscal. ${d.agencyName} se tient à votre disposition pour organiser une visite et affiner l'estimation.`,
      { width: contentW, lineGap: 2, align: 'justify' },
    );

  // ─── Footer (sur chaque page) ───
  drawFooter(doc, d.agencyName, dateStr);
  doc.on('pageAdded', () => drawFooter(doc, d.agencyName, dateStr));

  doc.end();
  return done;
}

// ─── Sections complexes ───

function drawMarketSection(
  doc: PDFKit.PDFDocument,
  stats: MarketPostalCodeStats,
  yourPricePerM2: number,
  propertyType: string,
  postalCode: string | undefined,
  primaryColor: string,
  contentW: number,
): void {
  const isAppart = propertyType.toLowerCase() === 'appartement';
  const median = isAppart ? stats.medianAppart : stats.medianMaison ?? stats.medianAppart;
  if (!median) return;

  const deltaPct = ((yourPricePerM2 - median) / median) * 100;
  const deltaStr = deltaPct >= 0 ? `+${deltaPct.toFixed(0)}%` : `${deltaPct.toFixed(0)}%`;
  const position =
    Math.abs(deltaPct) < 5 ? 'dans la médiane' : deltaPct > 0 ? 'au-dessus de la médiane' : 'en dessous de la médiane';

  // Phrase d'analyse
  doc.font('Helvetica').fontSize(10).fillColor('#1f2937').text(
    `Sur le secteur ${stats.commune ?? postalCode ?? ''}, la médiane de prix au m² constatée sur les transactions ${isAppart ? 'd\'appartements' : 'de maisons'} (${stats.txCount.toLocaleString('fr')} ventes analysées) est de :`,
    50,
    doc.y,
    { width: contentW, lineGap: 2 },
  );
  doc.moveDown(0.6);

  // Mini-barre visuelle de positionnement
  const barY = doc.y;
  const barH = 8;
  const barW = contentW;
  const barX = 50;
  // Plage [60%, 140%] de la médiane pour visualiser
  const minRef = median * 0.6;
  const maxRef = median * 1.4;
  // Position relative de la médiane (toujours au centre par construction)
  const medianX = barX + barW / 2;
  // Position du prix client (clampée dans la plage)
  const clamped = Math.max(minRef, Math.min(maxRef, yourPricePerM2));
  const yourX = barX + ((clamped - minRef) / (maxRef - minRef)) * barW;

  doc.roundedRect(barX, barY, barW, barH, 4).fill('#e5e7eb');
  // Repère médiane (petite ligne verticale grise)
  doc.rect(medianX - 0.75, barY - 3, 1.5, barH + 6).fill('#6b7280');
  // Marqueur du prix client (cercle couleur agence)
  doc.circle(yourX, barY + barH / 2, 6).fill(primaryColor);
  doc.fillColor('#1f2937');

  // Légendes (sous la barre)
  const labelY = barY + barH + 6;
  doc.font('Helvetica').fontSize(8).fillColor('#9ca3af');
  doc.text('moins cher', barX, labelY, { width: barW / 3, align: 'left' });
  doc.text(`médiane ${fmtCurrency(median)}/m²`, barX + barW / 3, labelY, { width: barW / 3, align: 'center' });
  doc.text('plus cher', barX + (2 * barW) / 3, labelY, { width: barW / 3, align: 'right' });
  doc.fillColor('#1f2937');
  doc.y = labelY + 20;

  // Phrase de positionnement
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1f2937').text(
    `Votre estimation à ${fmtCurrency(Math.round(yourPricePerM2))}/m² se situe ${deltaStr} (${position}).`,
    50,
    doc.y,
    { width: contentW, lineGap: 2 },
  );
  doc.moveDown(0.3);
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#9ca3af').text(
    `Source : DVF (Demandes de Valeurs Foncières), Etalab — data.gouv.fr. Calcul sur l'ensemble des transactions ${isAppart ? 'd\'appartements' : 'de maisons'} enregistrées dans le ${postalCode ?? 'secteur'} sur les 3 dernières années.`,
    50,
    doc.y,
    { width: contentW, lineGap: 1.5 },
  );
  doc.fillColor('#1f2937');
}

function drawFeesSection(doc: PDFKit.PDFDocument, fees: TransactionFees, currency: string, contentW: number): void {
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

  // Intro
  doc.font('Helvetica').fontSize(10).fillColor('#4b5563').text(
    'Au-delà du prix de vente, voici les principaux frais à anticiper. Les fourchettes sont indicatives.',
    50,
    doc.y,
    { width: contentW, lineGap: 2 },
  );
  doc.moveDown(0.6);

  // 1. Notaire
  drawFeeItem(
    doc,
    'Frais de notaire (à la charge de l\'acheteur)',
    `${fmt(fees.notary.lowAmount)} – ${fmt(fees.notary.highAmount)}`,
    `Soit ${(fees.notary.lowPct * 100).toFixed(0)}–${(fees.notary.highPct * 100).toFixed(0)} % du prix (barème ${fees.notary.basis === 'neuf' ? 'logement neuf, plus avantageux' : 'logement ancien'}). Information utile pour calibrer votre prix net vendeur attendu.`,
    contentW,
  );
  doc.moveDown(0.5);

  // 2. Diagnostics
  drawFeeItem(
    doc,
    'Diagnostics obligatoires (à votre charge)',
    `${fmt(fees.diagnostics.lowAmount)} – ${fmt(fees.diagnostics.highAmount)}`,
    `À réaliser par un diagnostiqueur certifié avant la signature du compromis. Diagnostics requis ici : ${fees.diagnostics.items.join(', ')}.`,
    contentW,
  );
  doc.moveDown(0.5);

  // 3. Plus-value (note conditionnelle, pas de chiffre)
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1f2937').text('Plus-value éventuelle', 50);
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(9.5).fillColor('#4b5563').text(fees.capitalGainsNote, 50, doc.y, {
    width: contentW,
    lineGap: 2,
  });
}

function drawFeeItem(doc: PDFKit.PDFDocument, title: string, amount: string, detail: string, contentW: number): void {
  // Ligne titre + montant à droite
  const startY = doc.y;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1f2937').text(title, 50, startY, { width: contentW * 0.62 });
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1f2937').text(amount, 50 + contentW * 0.62, startY, {
    width: contentW * 0.38,
    align: 'right',
  });
  // Détail en gris dessous
  doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text(detail, 50, doc.y + 2, { width: contentW, lineGap: 1.5 });
}

// ─── Helpers visuels ───

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#111827')
    .text(title.toUpperCase(), 50, doc.y, { characterSpacing: 0.6 });
  doc.moveTo(50, doc.y + 2).lineTo(doc.page.width - 50, doc.y + 2).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
  doc.moveDown(0.6);
}

function drawKeyValueTable(doc: PDFKit.PDFDocument, rows: Array<[string, string]>): void {
  const labelW = 160;
  const startX = 50;
  for (const [k, v] of rows) {
    const y = doc.y;
    doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text(k, startX, y, { width: labelW });
    doc.font('Helvetica').fontSize(10).fillColor('#1f2937').text(v, startX + labelW, y, {
      width: doc.page.width - 100 - labelW,
    });
    doc.moveDown(0.4);
  }
}

function drawFooter(doc: PDFKit.PDFDocument, agencyName: string, dateStr: string): void {
  const footerY = doc.page.height - 50;
  doc.save();
  doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).strokeColor('#e5e7eb').lineWidth(1).stroke();
  doc.fontSize(9).fillColor('#9ca3af').font('Helvetica').text(
    `${agencyName} · estimation générée le ${dateStr} · document confidentiel`,
    50,
    footerY + 10,
    { width: doc.page.width - 100, align: 'center' },
  );
  doc.restore();
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
