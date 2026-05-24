import type { EstimationResult } from '../estimation/types';
import type { TransactionFees } from '../estimation/fees';
import type { MarketPostalCodeStats } from '../config/market-stats';
import type { MatchedComparable } from '../estimation/comparables';

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
  /** Statistiques marché DVF pour le code postal (optionnel — section PDF "Repères du marché"). */
  marketStats?: MarketPostalCodeStats | null;
  /** Frais transactionnels estimés (optionnel — section PDF "Frais à prévoir"). */
  fees?: TransactionFees | null;
  /** Ventes récentes comparables (optionnel — section PDF "Ventes récentes dans le quartier"). */
  comparables?: MatchedComparable[];
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
