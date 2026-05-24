import type { BookingRequest } from '../../schemas/booking';

const RDV_TYPE_LABEL: Record<BookingRequest['rdvType'], string> = {
  telephone: 'Rendez-vous téléphonique',
  agency: 'Rendez-vous en agence',
  home: 'Rendez-vous au domicile du prospect',
};

const DAY_LABEL: Record<BookingRequest['preferredDay'], string> = {
  today: "Aujourd'hui",
  tomorrow: 'Demain',
  'this-week': 'Cette semaine',
  'next-week': 'La semaine prochaine',
  flexible: 'Flexible (à caler avec le prospect)',
};

const TIME_LABEL: Record<BookingRequest['preferredTime'], string> = {
  morning: 'Matin (9h–12h)',
  midday: 'Midi (12h–14h)',
  afternoon: 'Après-midi (14h–18h)',
  evening: 'Soir (18h–20h)',
  flexible: 'Flexible',
};

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  appartement: 'Appartement',
  maison: 'Maison',
  terrain: 'Terrain',
  local: 'Local / commerce',
};

/**
 * Gabarit du mail envoyé à l'agence quand un prospect demande un RDV
 * depuis le widget après son estimation. Contient toutes les infos pour
 * que l'agence puisse rappeler le prospect immédiatement.
 */
export function renderBookingAgencyEmail(
  agencyName: string,
  primaryColor: string,
  b: BookingRequest,
): { subject: string; html: string; text: string } {
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: b.property.currency, maximumFractionDigits: 0 }).format(n);
  const propTypeLabel = PROPERTY_TYPE_LABEL[b.property.propertyType] ?? b.property.propertyType;
  const txLabel = b.property.transaction === 'rent' ? 'Location' : 'Vente';
  const fullName = `${b.firstName} ${b.lastName}`.trim();
  const subject = `🔔 Demande de RDV — ${fullName} (${b.property.city})`;

  const addressRow = b.rdvType === 'home' && b.address
    ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px">Adresse du bien</td><td style="padding:6px 0;font-size:14px"><strong>${escape(b.address)}</strong></td></tr>`
    : '';

  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:${primaryColor};color:#fff;padding:20px 24px">
        <p style="margin:0;font-size:13px;opacity:.88;letter-spacing:.5px;text-transform:uppercase">Nouvelle demande de rendez-vous</p>
        <h1 style="margin:6px 0 0;font-size:22px">${escape(RDV_TYPE_LABEL[b.rdvType])}</h1>
      </div>

      <div style="padding:22px 24px">
        <h2 style="margin:0 0 10px;font-size:15px;color:#111827;text-transform:uppercase;letter-spacing:.6px">Prospect</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px">Nom complet</td><td style="padding:6px 0;font-size:14px"><strong>${escape(fullName)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Email</td><td style="padding:6px 0;font-size:14px"><a href="mailto:${escape(b.email)}" style="color:${primaryColor};text-decoration:none">${escape(b.email)}</a></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Téléphone</td><td style="padding:6px 0;font-size:14px"><a href="tel:${escape(b.phone)}" style="color:${primaryColor};text-decoration:none">${escape(b.phone)}</a></td></tr>
        </table>

        <h2 style="margin:22px 0 10px;font-size:15px;color:#111827;text-transform:uppercase;letter-spacing:.6px">Rendez-vous souhaité</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px">Type</td><td style="padding:6px 0;font-size:14px"><strong>${escape(RDV_TYPE_LABEL[b.rdvType])}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Jour</td><td style="padding:6px 0;font-size:14px"><strong>${escape(DAY_LABEL[b.preferredDay])}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Créneau</td><td style="padding:6px 0;font-size:14px"><strong>${escape(TIME_LABEL[b.preferredTime])}</strong></td></tr>
          ${addressRow}
        </table>

        <h2 style="margin:22px 0 10px;font-size:15px;color:#111827;text-transform:uppercase;letter-spacing:.6px">Bien estimé</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px">Type de bien</td><td style="padding:6px 0;font-size:14px">${escape(propTypeLabel)} (${escape(txLabel)})</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Surface</td><td style="padding:6px 0;font-size:14px">${b.property.surface} m²</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Localisation</td><td style="padding:6px 0;font-size:14px">${escape(b.property.city)} (${escape(b.property.postalCode)})</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Estimation envoyée</td><td style="padding:6px 0;font-size:14px"><strong>${fmt(b.property.estimation)}</strong></td></tr>
        </table>

        <div style="margin-top:22px;padding:14px 16px;background:#f9fafb;border-left:3px solid ${primaryColor};border-radius:4px;font-size:13px;color:#4b5563;line-height:1.5">
          Le prospect attend votre confirmation par téléphone, email ou SMS dans les 24h pour caler le créneau définitif.
        </div>
      </div>
    </div>

    <p style="text-align:center;font-size:11px;color:#9ca3af;margin:14px 0 0">Notification automatique — ${escape(agencyName)}</p>
  </div></body></html>`;

  const text = `Nouvelle demande de rendez-vous — ${RDV_TYPE_LABEL[b.rdvType]}

Prospect : ${fullName} · ${b.email} · ${b.phone}

Rendez-vous souhaité :
  Type    : ${RDV_TYPE_LABEL[b.rdvType]}
  Jour    : ${DAY_LABEL[b.preferredDay]}
  Créneau : ${TIME_LABEL[b.preferredTime]}${b.rdvType === 'home' && b.address ? `\n  Adresse : ${b.address}` : ''}

Bien estimé :
  ${propTypeLabel} ${b.property.surface} m² (${txLabel})
  ${b.property.city} (${b.property.postalCode})
  Estimation envoyée : ${fmt(b.property.estimation)}

Reconfirmez sous 24h par téléphone, email ou SMS.

— ${agencyName}
`;

  return { subject, html, text };
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
