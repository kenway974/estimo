import PDFDocument from 'pdfkit';
import type { EstimationEmailData } from '../types';

/**
 * Génère un PDF d'estimation brandé en buffer, joint au mail prospect.
 * Utilise les fonts Helvetica intégrées à PDFKit (zéro asset externe).
 */
export async function renderEstimationPdf(d: EstimationEmailData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: d.result.currency, maximumFractionDigits: 0 }).format(n);
  const suffix = d.result.transaction === 'rent' ? ' / mois' : '';
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  // ─── Bandeau coloré (couleur primaire de l'agence) ───
  const headerH = 90;
  doc.rect(0, 0, doc.page.width, headerH).fill(d.primaryColor);
  doc
    .fill('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(22)
    .text(d.agencyName, 50, 30, { width: doc.page.width - 100 });
  doc.font('Helvetica').fontSize(11).text(`Estimation immobilière indicative — ${dateStr}`, 50, 60);
  doc.fillColor('#1f2937');
  doc.y = headerH + 30;

  // ─── Salutation ───
  doc.font('Helvetica').fontSize(11).fillColor('#1f2937')
    .text(`Bonjour ${d.firstName} ${d.lastName},`, 50);
  doc.moveDown(0.5);
  doc.text(`Voici l'estimation indicative de votre bien à partir des informations que vous nous avez transmises.`, {
    width: doc.page.width - 100,
    lineGap: 2,
  });
  doc.moveDown(1.2);

  // ─── Bloc Votre bien ───
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

  // ─── Bloc Estimation (carte primaire) ───
  drawSectionTitle(doc, 'Notre estimation');
  const cardY = doc.y;
  const cardH = 110;
  doc
    .roundedRect(50, cardY, doc.page.width - 100, cardH, 10)
    .fill(d.primaryColor);
  doc.fillColor('#ffffff').font('Helvetica').fontSize(10)
    .text('PRIX ESTIMÉ', 50, cardY + 18, { width: doc.page.width - 100, align: 'center', characterSpacing: 1 });
  doc.font('Helvetica-Bold').fontSize(30)
    .text(`${fmt(d.result.mid)}${suffix}`, 50, cardY + 38, { width: doc.page.width - 100, align: 'center' });
  doc.font('Helvetica').fontSize(11)
    .text(`Fourchette : ${fmt(d.result.low)} – ${fmt(d.result.high)}${suffix}`, 50, cardY + 78, {
      width: doc.page.width - 100,
      align: 'center',
    });
  doc.fillColor('#1f2937');
  doc.y = cardY + cardH + 16;

  if (d.result.pricePerM2) {
    doc.font('Helvetica').fontSize(10).fillColor('#6b7280')
      .text(`Soit environ ${fmt(d.result.pricePerM2)} / m².`, 50, doc.y, {
        width: doc.page.width - 100,
        align: 'center',
      });
    doc.moveDown(1.2);
  }

  // ─── Disclaimer ───
  doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(10).text('À propos de cette estimation', 50);
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(9.5).fillColor('#4b5563')
    .text(
      `Cette estimation est calculée automatiquement à partir des informations déclaratives que vous nous avez transmises et de références de prix locales. Elle est fournie à titre purement indicatif et ne constitue ni une expertise immobilière, ni une offre d'achat. Pour une estimation précise tenant compte de l'état réel du bien, des spécificités du marché local et de la conjoncture, ${d.agencyName} se tient à votre disposition pour organiser une visite.`,
      { width: doc.page.width - 100, lineGap: 2, align: 'justify' },
    );

  // ─── Footer ───
  const footerY = doc.page.height - 60;
  doc
    .moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).strokeColor('#e5e7eb').lineWidth(1).stroke();
  doc.fontSize(9).fillColor('#9ca3af').font('Helvetica')
    .text(`${d.agencyName} · estimation générée le ${dateStr} · document confidentiel`, 50, footerY + 12, {
      width: doc.page.width - 100,
      align: 'center',
    });

  doc.end();
  return done;
}

// ─── Helpers visuels ───
function drawSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor('#111827')
    .text(title.toUpperCase(), 50, doc.y, { characterSpacing: 0.5 });
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

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}
