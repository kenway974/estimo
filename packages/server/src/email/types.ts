import type { EstimationResult } from '../estimation/types';

export interface EstimationEmailData {
  to: string;
  firstName: string;
  lastName: string;
  agencyName: string;
  primaryColor: string;
  logoUrl?: string;
  property: { transaction: 'sale' | 'rent'; propertyType: string; surface: number; city: string };
  result: EstimationResult;
}

/** Contrat d'un fournisseur d'envoi d'email transactionnel. */
export interface MailProvider {
  send(opts: { to: string; subject: string; html: string; text: string }): Promise<void>;
}
