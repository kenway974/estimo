import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM || 'JP Clim Chauffagiste <noreply@jpclimchauffagiste.com>'
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'jpclim.chauffagiste@gmail.com'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jpclimchauffagiste.com'

export interface SendQuoteEmailParams {
  to: string
  firstName: string
  serviceType: string
  estimateMin: number
  estimateMax: number
  pdfBase64: string
  prospectId: string
}

export async function sendQuoteEmail(params: SendQuoteEmailParams) {
  const { to, firstName, serviceType, estimateMin, estimateMax, pdfBase64, prospectId } = params

  const trackingPixelUrl = `${SITE_URL}/api/crm/track?id=${prospectId}&event=QUOTE_EMAIL_OPENED`

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre devis indicatif — JP Clim Chauffagiste</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #1a2744; padding: 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; }
    .header p { color: #94a3b8; margin: 8px 0 0; }
    .body { padding: 32px; }
    .estimate-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
    .estimate-box .amount { font-size: 32px; font-weight: bold; color: #1a2744; }
    .estimate-box .disclaimer { font-size: 13px; color: #64748b; margin-top: 8px; }
    .cta-btn { display: inline-block; background: #f97316; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 8px; }
    .cta-secondary { display: inline-block; background: #1a2744; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 8px; }
    .guide-section { background: #eff6ff; border-left: 4px solid #f97316; padding: 20px; border-radius: 0 8px 8px 0; margin: 24px 0; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
    .tip { display: flex; align-items: flex-start; margin: 12px 0; }
    .tip-icon { font-size: 20px; margin-right: 12px; flex-shrink: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>JP Clim Chauffagiste</h1>
      <p>Votre devis indicatif est prêt ✓</p>
    </div>
    <div class="body">
      <p>Bonjour <strong>${firstName}</strong>,</p>
      <p>Merci pour votre demande de devis concernant : <strong>${serviceType}</strong>.</p>
      <p>Voici votre estimation indicative en pièce jointe (PDF), ainsi que quelques conseils pratiques gratuits.</p>

      <div class="estimate-box">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">Estimation indicative</div>
        <div class="amount">${estimateMin.toLocaleString('fr-FR')} € – ${estimateMax.toLocaleString('fr-FR')} €</div>
        <div class="disclaimer">⚠️ Ce montant est indicatif et non contractuel. Le tarif réel sera établi après visite sur site.</div>
      </div>

      <div class="guide-section">
        <h3 style="margin-top:0; color: #1a2744;">📋 Votre guide pratique inclus dans le PDF</h3>
        <div class="tip">
          <span class="tip-icon">🔧</span>
          <div><strong>Entretien courant :</strong> Les gestes simples que vous pouvez faire vous-même pour prolonger la durée de vie de vos équipements.</div>
        </div>
        <div class="tip">
          <span class="tip-icon">⚡</span>
          <div><strong>Économies d'énergie :</strong> 5 réglages simples pour réduire votre facture jusqu'à 20% sans changer d'équipement.</div>
        </div>
        <div class="tip">
          <span class="tip-icon">🚨</span>
          <div><strong>Signaux d'alerte :</strong> Comment reconnaître une panne imminente avant qu'elle ne coûte cher.</div>
        </div>
      </div>

      <p style="text-align: center; margin: 32px 0 16px;">
        <strong>Prochaine étape :</strong>
      </p>
      <div style="text-align: center;">
        <a href="${SITE_URL}/rendez-vous?pid=${prospectId}" class="cta-btn">📅 Prendre rendez-vous</a>
        <a href="${SITE_URL}/rappel?pid=${prospectId}" class="cta-secondary">📞 Être rappelé(e)</a>
      </div>

      <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
        Pour toute question, appelez directement : <strong><a href="tel:0652495290" style="color: #f97316;">06 52 49 52 90</a></strong><br>
        Disponible 7j/7 — Île-de-France
      </p>
    </div>
    <div class="footer">
      <p>JP Clim Chauffagiste — Île-de-France — Depuis 2008<br>
      06 52 49 52 90 | jpclim.chauffagiste@gmail.com</p>
      <p><a href="${SITE_URL}/confidentialite" style="color: #94a3b8;">Politique de confidentialité</a> | <a href="${SITE_URL}/mentions-legales" style="color: #94a3b8;">Mentions légales</a></p>
    </div>
  </div>
  <img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;" />
</body>
</html>`

  return resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to,
    subject: `Votre devis indicatif JP Clim — ${serviceType}`,
    html,
    attachments: [
      {
        filename: 'devis-indicatif-jpclim.pdf',
        content: pdfBase64,
      },
    ],
  })
}

export async function sendCallbackRequest(data: {
  firstName: string
  phone: string
  preferredTime?: string
  message?: string
}) {
  return resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: REPLY_TO,
    subject: `🔔 Demande de rappel — ${data.firstName}`,
    html: `
      <h2>Nouvelle demande de rappel</h2>
      <p><strong>Prénom :</strong> ${data.firstName}</p>
      <p><strong>Téléphone :</strong> ${data.phone}</p>
      <p><strong>Créneau préféré :</strong> ${data.preferredTime || 'Non précisé'}</p>
      <p><strong>Message :</strong> ${data.message || 'Aucun'}</p>
    `,
  })
}

export async function sendContactForm(data: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}) {
  return resend.emails.send({
    from: FROM,
    replyTo: data.email,
    to: REPLY_TO,
    subject: `📩 Contact site — ${data.subject}`,
    html: `
      <h2>Nouveau message depuis le site</h2>
      <p><strong>Nom :</strong> ${data.name}</p>
      <p><strong>Email :</strong> ${data.email}</p>
      <p><strong>Téléphone :</strong> ${data.phone || 'Non renseigné'}</p>
      <p><strong>Sujet :</strong> ${data.subject}</p>
      <p><strong>Message :</strong></p>
      <p>${data.message.replace(/\n/g, '<br>')}</p>
    `,
  })
}