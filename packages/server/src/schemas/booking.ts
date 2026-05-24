import { z } from 'zod';

/** Schéma de la requête de prise de rendez-vous (après une estimation). */
export const BookingRequestSchema = z.object({
  tenantId: z.string().regex(/^[a-z0-9_-]+$/),
  publicKey: z.string().optional(),

  rdvType: z.enum(['telephone', 'agency', 'home']),
  preferredDay: z.enum(['today', 'tomorrow', 'this-week', 'next-week', 'flexible']),
  preferredTime: z.enum(['morning', 'midday', 'afternoon', 'evening', 'flexible']),
  /** Obligatoire si rdvType = 'home', sinon ignoré. */
  address: z.string().min(4).max(200).optional(),

  // Lead (repris du formulaire d'estimation)
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(6).max(30),

  // Contexte du bien estimé (pour informer l'agence)
  property: z.object({
    transaction: z.enum(['sale', 'rent']),
    propertyType: z.string().min(1),
    surface: z.coerce.number().positive().max(100000),
    city: z.string().min(1).max(120),
    postalCode: z.string().min(2).max(10),
    estimation: z.coerce.number().positive(),
    currency: z.string().default('EUR'),
  }),
}).strict().superRefine((d, ctx) => {
  if (d.rdvType === 'home' && (!d.address || d.address.trim().length < 4)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address'], message: 'Adresse requise pour un RDV à domicile' });
  }
});

export type BookingRequest = z.infer<typeof BookingRequestSchema>;
