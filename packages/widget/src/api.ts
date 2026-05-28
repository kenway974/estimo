/** Champs envoyés au backend pour une estimation. */
export interface EstimatePayload {
  tenantId: string;
  publicKey?: string;
  transaction: 'sale' | 'rent';
  propertyType: string;
  surface: number;
  rooms: number;
  condition: string;
  postalCode: string;
  city: string;
  features: string[];
  dpeClass?: string;
  floor?: string;
  exposition?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  consent: true;
}

export interface EstimateResponse {
  estimate: { low: number; mid: number; high: number; currency: string; pricePerM2: number; transaction: 'sale' | 'rent' };
  emailSent: boolean;
}

/** Champs envoyés au backend pour réserver un rendez-vous après l'estimation. */
export interface BookingPayload {
  tenantId: string;
  publicKey?: string;
  /** Type de rendez-vous demandé par le prospect. */
  rdvType: 'telephone' | 'agency' | 'home';
  /** Jour souhaité (valeurs canoniques utilisées par le mail à l'agence). */
  preferredDay: 'today' | 'tomorrow' | 'this-week' | 'next-week' | 'flexible';
  /** Créneau horaire souhaité. */
  preferredTime: 'morning' | 'midday' | 'afternoon' | 'evening' | 'flexible';
  /** Adresse du bien (obligatoire si rdvType=home, sinon ignoré). */
  address?: string;
  /** Lead — repris du formulaire d'estimation. */
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Contexte du bien estimé, pour le mail à l'agence. */
  property: {
    transaction: 'sale' | 'rent';
    propertyType: string;
    surface: number;
    city: string;
    postalCode: string;
    estimation: number;
    currency: string;
  };
}

/** Appel POST /api/estimate. Lève une Error lisible en cas d'échec. */
export async function postEstimate(api: string, payload: EstimatePayload): Promise<EstimateResponse> {
  return postJson(`${api.replace(/\/$/, '')}/api/estimate`, payload) as Promise<EstimateResponse>;
}

/** Appel POST /api/booking. Lève une Error lisible en cas d'échec. */
export async function postBooking(api: string, payload: BookingPayload): Promise<{ ok: true }> {
  return postJson(`${api.replace(/\/$/, '')}/api/booking`, payload) as Promise<{ ok: true }>;
}

async function postJson(url: string, payload: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}
