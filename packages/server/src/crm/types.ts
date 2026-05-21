export interface CrmContact {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  attributes?: Record<string, string | number>;
}

/** Contrat d'un connecteur CRM / liste de diffusion. */
export interface CrmProvider {
  upsertContact(c: CrmContact): Promise<void>;
}
