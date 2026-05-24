import type { FastifyInstance } from 'fastify';
import { BookingRequestSchema, type BookingRequest } from '../schemas/booking';
import { getTenant, type TenantConfig } from '../config/tenants';
import { getMailProvider, getCrmProvider } from '../lib/services';
import { renderBookingAgencyEmail } from '../email/templates/booking-agency';
import { env } from '../config/env';

/** Vérifie que l'Origin du navigateur fait partie des domaines de l'agence. */
function originAllowed(tenant: TenantConfig, origin?: string): boolean {
  if (env.NODE_ENV === 'development') return true;
  if (!origin) return true; // appel serveur-à-serveur : la limitation de débit protège
  const set = new Set(tenant.allowedDomains.map((d) => new URL(d).origin));
  return set.has(origin);
}

const RDV_LABEL_FR: Record<BookingRequest['rdvType'], string> = {
  telephone: 'Téléphonique',
  agency: 'En agence',
  home: 'À domicile',
};

const DAY_LABEL_FR: Record<BookingRequest['preferredDay'], string> = {
  today: "Aujourd'hui",
  tomorrow: 'Demain',
  'this-week': 'Cette semaine',
  'next-week': 'Semaine prochaine',
  flexible: 'Flexible',
};

const TIME_LABEL_FR: Record<BookingRequest['preferredTime'], string> = {
  morning: 'Matin (9h-12h)',
  midday: 'Midi (12h-14h)',
  afternoon: 'Après-midi (14h-18h)',
  evening: 'Soir (18h-20h)',
  flexible: 'Flexible',
};

export default async function bookingRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/booking', async (req, reply) => {
    const parsed = BookingRequestSchema.safeParse(req.body);
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

    // 1) Envoi du mail récap à l'agence — best effort.
    //    Destinataire : tenant.agencyEmail si défini, sinon tenant.mail.fromEmail.
    const recipient = tenant.agencyEmail ?? tenant.mail.fromEmail;
    try {
      const tpl = renderBookingAgencyEmail(tenant.branding.displayName, tenant.branding.primaryColor, data);
      await getMailProvider(tenant).send({
        to: recipient,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
    } catch (err) {
      req.log.error({ err, tenant: tenant.id }, 'echec envoi mail demande RDV agence');
    }

    // 2) Enrichissement du contact dans le CRM — best effort. On reprend
    //    l'email du prospect (qui a déjà été créé lors de l'estimation) et
    //    on lui ajoute les attributs RDV.
    try {
      await getCrmProvider(tenant).upsertContact({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        attributes: {
          RDV_TYPE: RDV_LABEL_FR[data.rdvType],
          RDV_JOUR: DAY_LABEL_FR[data.preferredDay],
          RDV_CRENEAU: TIME_LABEL_FR[data.preferredTime],
          RDV_DEMANDE_LE: new Date().toISOString().slice(0, 10),
          ...(data.address ? { RDV_ADRESSE: data.address } : {}),
        },
      });
    } catch (err) {
      req.log.error({ err, tenant: tenant.id }, 'echec enrichissement contact CRM (RDV)');
    }

    req.log.info(
      { tenant: tenant.id, rdvType: data.rdvType, day: data.preferredDay, time: data.preferredTime, recipient },
      'demande de rendez-vous enregistrée',
    );
    return reply.send({ ok: true });
  });
}
