import type { FastifyInstance } from 'fastify';
import { EstimateRequestSchema } from '../schemas/estimate';
import { getTenant, type TenantConfig } from '../config/tenants';
import { getEstimator, getMailProvider, getCrmProvider } from '../lib/services';
import { renderEstimationEmail, renderEstimationPdf } from '../email';
import { env } from '../config/env';
import { getPostalCodeStats } from '../config/market-stats';
import { computeTransactionFees } from '../estimation/fees';

/** Vérifie que l'Origin du navigateur fait partie des domaines de l'agence. */
function originAllowed(tenant: TenantConfig, origin?: string): boolean {
  if (env.NODE_ENV === 'development') return true;
  if (!origin) return true; // appel serveur-à-serveur : la limitation de débit protège
  const set = new Set(tenant.allowedDomains.map((d) => new URL(d).origin));
  return set.has(origin);
}

export default async function estimateRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/estimate', async (req, reply) => {
    const parsed = EstimateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
    }
    const data = parsed.data;

    const tenant = getTenant(data.tenantId);
    if (!tenant) return reply.code(404).send({ error: 'tenant_introuvable' });
    if (!originAllowed(tenant, req.headers.origin)) {
      return reply.code(403).send({ error: 'origine_non_autorisee' });
    }
    if (tenant.secrets.publicKey && data.publicKey !== tenant.secrets.publicKey) {
      return reply.code(401).send({ error: 'cle_invalide' });
    }

    const result = getEstimator(tenant).estimate({
      transaction: data.transaction,
      propertyType: data.propertyType,
      surface: data.surface,
      rooms: data.rooms,
      condition: data.condition,
      postalCode: data.postalCode,
      city: data.city,
      features: data.features,
    });

    // 1) Email d'estimation au prospect (avec PDF joint) — best effort.
    let emailSent = false;
    try {
      const mail = getMailProvider(tenant);
      // Enrichissement : positionnement marché (DVF) + estimation des frais
      // pour donner au prospect un dossier exploitable plutôt qu'un simple chiffre.
      const marketStats = data.postalCode ? getPostalCodeStats(tenant.id, data.postalCode) : null;
      const fees = data.transaction === 'sale' ? computeTransactionFees(result.mid, data.condition) : null;
      const emailData = {
        to: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        agencyName: tenant.branding.displayName,
        primaryColor: tenant.branding.primaryColor,
        logoUrl: tenant.branding.logoUrl,
        property: {
          transaction: data.transaction,
          propertyType: data.propertyType,
          surface: data.surface,
          rooms: data.rooms,
          condition: data.condition,
          postalCode: data.postalCode,
          city: data.city,
          features: data.features,
        },
        result,
        marketStats,
        fees,
      };
      const tpl = renderEstimationEmail(emailData);
      const pdfBuffer = await renderEstimationPdf(emailData);
      await mail.send({
        to: data.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        attachments: [{ filename: 'estimation.pdf', content: pdfBuffer, contentType: 'application/pdf' }],
      });
      emailSent = true;
    } catch (err) {
      req.log.error({ err, tenant: tenant.id }, 'echec envoi email estimation');
    }

    // 2) Push du lead vers le mailing de l'agence — best effort.
    try {
      await getCrmProvider(tenant).upsertContact({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        attributes: { VILLE: data.city, SURFACE: data.surface, TYPE_BIEN: data.propertyType, ESTIMATION: result.mid },
      });
    } catch (err) {
      req.log.error({ err, tenant: tenant.id }, 'echec push CRM');
    }

    req.log.info({ tenant: tenant.id, city: data.city, mid: result.mid, emailSent }, 'estimation generee');
    return reply.send({ estimate: result, emailSent });
  });
}
