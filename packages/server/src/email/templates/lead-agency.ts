import type { EstimationResult } from '../../estimation/types';

export interface LeadAgencyData {
  agencyName: string;
  primaryColor: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  property: {
    transaction: 'sale' | 'rent';
    propertyType: string;
    surface: number;
    rooms: number;
    condition: string;
    postalCode: string;
    city: string;
    features: string[];
  };
  result: EstimationResult;
}

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  appartement: 'Appartement',
  maison: 'Maison',
  terrain: 'Terrain',
  local: 'Local / commerce',
};

const CONDITION_LABEL: Record<string, string> = {
  neuf: 'Neuf',
  bon: 'Bon état',
  a_rafraichir: 'À rafraîchir',
  a_renover: 'À rénover',
};

/**
 * Gabarit du mail envoyé à l'agence à CHAQUE estimation.
 *
 * Sans ce mail, une agence dont le tenant a `crm.provider: "none"` ne reçoit
 * jamais le lead : seul le prospect était notifié. Le CRM reste le canal
 * principal quand il est configuré, ce mail est le filet de sécurité qui
 * garantit qu'aucun lead ne se perd.
 */
export function renderLeadAgencyEmail(d: LeadAgencyData): { subject: string; html: string; text: string } {
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: d.result.currency, maximumFractionDigits: 0 }).format(n);
  const propTypeLabel = PROPERTY_TYPE_LABEL[d.property.propertyType] ?? d.property.propertyType;
  const conditionLabel = CONDITION_LABEL[d.property.condition] ?? d.property.condition;
  const txLabel = d.property.transaction === 'rent' ? 'Location' : 'Vente';
  const fullName = `${d.firstName} ${d.lastName}`.trim();
  const subject = `🏠 Nouveau lead — ${fullName} · ${propTypeLabel} ${d.property.surface} m² à ${d.property.city}`;
  const featuresLabel = d.property.features.length ? d.property.features.join(', ') : '—';

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px">${label}</td><td style="padding:6px 0;font-size:14px">${value}</td></tr>`;

  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:${d.primaryColor};color:#fff;padding:20px 24px">
        <p style="margin:0;font-size:13px;opacity:.88;letter-spacing:.5px;text-transform:uppercase">Nouvelle estimation</p>
        <h1 style="margin:6px 0 0;font-size:22px">${escape(fullName)}</h1>
      </div>

      <div style="padding:22px 24px">
        <h2 style="margin:0 0 10px;font-size:15px;color:#111827;text-transform:uppercase;letter-spacing:.6px">Contact</h2>
        <table style="width:100%;border-collapse:collapse">
          ${row('Nom complet', `<strong>${escape(fullName)}</strong>`)}
          ${row('Email', `<a href="mailto:${escape(d.email)}" style="color:${d.primaryColor};text-decoration:none">${escape(d.email)}</a>`)}
          ${row('Téléphone', `<a href="tel:${escape(d.phone)}" style="color:${d.primaryColor};text-decoration:none">${escape(d.phone)}</a>`)}
        </table>

        <h2 style="margin:22px 0 10px;font-size:15px;color:#111827;text-transform:uppercase;letter-spacing:.6px">Bien</h2>
        <table style="width:100%;border-collapse:collapse">
          ${row('Type', `${escape(propTypeLabel)} (${escape(txLabel)})`)}
          ${row('Surface', `${d.property.surface} m²`)}
          ${row('Pièces', String(d.property.rooms))}
          ${row('État', escape(conditionLabel))}
          ${row('Localisation', `${escape(d.property.city)} (${escape(d.property.postalCode)})`)}
          ${row('Atouts', escape(featuresLabel))}
        </table>

        <div style="margin-top:22px;padding:16px 18px;background:#f9fafb;border-radius:8px;text-align:center">
          <p style="margin:0;font-size:12px;color:#6b7280;letter-spacing:.5px;text-transform:uppercase">Estimation envoyée au prospect</p>
          <p style="margin:6px 0 0;font-size:26px;font-weight:bold;color:${d.primaryColor}">${fmt(d.result.mid)}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280">${fmt(d.result.low)} – ${fmt(d.result.high)} · ${fmt(d.result.pricePerM2)} / m²</p>
        </div>

        <div style="margin-top:22px;padding:14px 16px;background:#f9fafb;border-left:3px solid ${d.primaryColor};border-radius:4px;font-size:13px;color:#4b5563;line-height:1.5">
          Le prospect vient de recevoir son dossier d'estimation en PDF. Un rappel dans les 24h maximise vos chances de décrocher le mandat.
        </div>
      </div>
    </div>

    <p style="text-align:center;font-size:11px;color:#9ca3af;margin:14px 0 0">Notification automatique — ${escape(d.agencyName)}</p>
  </div></body></html>`;

  const text = `Nouveau lead — estimation réalisée

Contact :
  ${fullName}
  ${d.email}
  ${d.phone}

Bien :
  ${propTypeLabel} ${d.property.surface} m², ${d.property.rooms} pièces (${txLabel})
  État : ${conditionLabel}
  ${d.property.city} (${d.property.postalCode})
  Atouts : ${featuresLabel}

Estimation envoyée au prospect :
  ${fmt(d.result.mid)}  (fourchette ${fmt(d.result.low)} – ${fmt(d.result.high)}, ${fmt(d.result.pricePerM2)}/m²)

Le prospect a reçu son dossier PDF. Rappelez-le sous 24h.

— ${d.agencyName}
`;

  return { subject, html, text };
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
