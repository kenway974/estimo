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

/** Appel POST /api/estimate. Lève une Error lisible en cas d'échec. */
export async function postEstimate(api: string, payload: EstimatePayload): Promise<EstimateResponse> {
  const res = await fetch(`${api.replace(/\/$/, '')}/api/estimate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as EstimateResponse;
}
