import { z } from 'zod';

/**
 * Schéma de la requête d'estimation. Toute donnée entrante est validée ici,
 * côté serveur (le navigateur n'est jamais une source de confiance).
 */
export const EstimateRequestSchema = z.object({
  tenantId: z.string().regex(/^[a-z0-9_-]+$/),
  publicKey: z.string().optional(),

  // --- Bien ---
  transaction: z.enum(['sale', 'rent']),
  propertyType: z.string().min(1),
  surface: z.coerce.number().positive().max(100000),
  rooms: z.coerce.number().int().min(0).max(50),
  condition: z.string().min(1),
  postalCode: z.string().min(2).max(10),
  city: z.string().min(1).max(120),
  features: z.array(z.string()).max(50).default([]),

  // --- Prospect ---
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(6).max(30),

  // --- RGPD ---
  consent: z.literal(true, { errorMap: () => ({ message: 'Consentement requis' }) }),
}).strict();

export type EstimateRequest = z.infer<typeof EstimateRequestSchema>;
