import type { EstimationResult } from '../estimation/types';

export interface EstimationEmailData {
  to: string;
  firstName: string;
  lastName: string;
  agencyName: string;
  primaryColor: string;
  logoUrl?: string;
  property: {
    transaction: 'sale' | 'rent';
    propertyType: string;
    surface: number;
    rooms?: number;
    condition?: string;
    postalCode?: string;
    city: string;
    features?: string[];
  };
  result: EstimationResult;
}

/** Une pièce jointe à un email (PDF, image, etc.). */
export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

/** Contrat d'un fournisseur d'envoi d'email transactionnel. */
export interface MailProvider {
  send(opts: {
    to: string;
    subject: string;
    html: string;
    text: string;
    attachments?: MailAttachment[];
  }): Promise<void>;
}
