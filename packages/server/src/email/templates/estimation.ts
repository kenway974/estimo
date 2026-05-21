import type { EstimationEmailData } from '../types';

const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

/** Gabarit HTML + texte de l'email d'estimation envoyé au prospect. */
export function renderEstimationEmail(d: EstimationEmailData): { subject: string; html: string; text: string } {
  const r = d.result;
  const suffix = r.transaction === 'rent' ? ' / mois' : '';
  const subject = `Votre estimation ${r.transaction === 'rent' ? 'locative' : ''} — ${d.property.city}`.trim();
  const logo = d.logoUrl ? `<img src="${d.logoUrl}" alt="${d.agencyName}" style="max-height:48px;margin-bottom:16px">` : '';

  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e7eb">
      ${logo}
      <h1 style="font-size:20px;margin:0 0 8px">Bonjour ${d.firstName},</h1>
      <p style="margin:0 0 20px;line-height:1.5">Voici l'estimation indicative de votre bien à <strong>${d.property.city}</strong>
      (${d.property.surface} m², ${d.property.propertyType}).</p>
      <div style="text-align:center;background:${d.primaryColor};color:#fff;border-radius:10px;padding:22px;margin:0 0 18px">
        <div style="font-size:13px;opacity:.85;text-transform:uppercase;letter-spacing:.04em">Estimation</div>
        <div style="font-size:30px;font-weight:700;margin:4px 0">${fmt(r.mid, r.currency)}${suffix}</div>
        <div style="font-size:14px;opacity:.9">Fourchette : ${fmt(r.low, r.currency)} – ${fmt(r.high, r.currency)}${suffix}</div>
      </div>
      <p style="font-size:13px;color:#6b7280;line-height:1.5;margin:0 0 18px">Cette estimation automatique est fournie à titre
      indicatif et ne constitue pas une expertise. ${d.agencyName} vous recontactera pour affiner avec une visite.</p>
      <p style="margin:0">À très vite,<br><strong>${d.agencyName}</strong></p>
    </div>
  </div></body></html>`;

  const text = `Bonjour ${d.firstName},
Estimation indicative pour votre bien à ${d.property.city} (${d.property.surface} m²) :
${fmt(r.mid, r.currency)}${suffix} (fourchette ${fmt(r.low, r.currency)} - ${fmt(r.high, r.currency)}${suffix}).
Estimation indicative, non contractuelle. ${d.agencyName} vous recontactera.`;

  return { subject, html, text };
}
