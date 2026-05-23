/**
 * Estimation des frais d'une transaction immobilière (informatif, fourchettes).
 *
 * Ce module ne remplace ni un notaire ni un comptable : il donne au prospect
 * un ordre de grandeur des coûts associés à une vente, pour rendre l'estimation
 * exploitable. Les valeurs sont des fourchettes courantes constatées en France
 * en 2024-2026 ; à actualiser si la réglementation évolue.
 */

export interface TransactionFees {
  /** Frais de notaire payés par l'acheteur (info pour le vendeur qui calibre son prix net). */
  notary: { lowPct: number; highPct: number; lowAmount: number; highAmount: number; basis: 'ancien' | 'neuf' };
  /** Diagnostics obligatoires payés par le vendeur (forfait selon ancienneté du bien). */
  diagnostics: { lowAmount: number; highAmount: number; items: string[] };
  /** Note conditionnelle sur la plus-value (impossible à calculer sans connaître l'usage). */
  capitalGainsNote: string;
}

/**
 * Renvoie une estimation des frais à prévoir pour la transaction.
 * - notaire : ~7-8% pour l'ancien, ~2-3% pour le neuf
 * - diagnostics : forfait 300-600 € (DPE seul) jusqu'à 600-900 € (logement ancien complet)
 */
export function computeTransactionFees(price: number, condition: string | undefined): TransactionFees {
  const isNeuf = condition === 'neuf';
  const notaryLow = isNeuf ? 0.02 : 0.07;
  const notaryHigh = isNeuf ? 0.03 : 0.08;

  // Diagnostics obligatoires : DPE toujours + plomb (avant 1949) / amiante
  // (avant 1997) / élec & gaz (>15 ans) / ERP / audit énergétique (passoires).
  // On utilise la condition comme proxy d'ancienneté.
  const diagItems = ['DPE (Diagnostic de Performance Énergétique)', 'ERP (état des risques)'];
  let diagLow = 200;
  let diagHigh = 350;
  if (condition === 'a_renover' || condition === 'a_rafraichir') {
    diagItems.push('Plomb (CREP)', 'Amiante', 'Électricité', 'Gaz');
    diagLow = 500;
    diagHigh = 800;
  } else if (condition === 'bon') {
    diagItems.push('Électricité', 'Gaz', 'Amiante (si avant 1997)');
    diagLow = 350;
    diagHigh = 600;
  }

  return {
    notary: {
      lowPct: notaryLow,
      highPct: notaryHigh,
      lowAmount: Math.round(price * notaryLow),
      highAmount: Math.round(price * notaryHigh),
      basis: isNeuf ? 'neuf' : 'ancien',
    },
    diagnostics: {
      lowAmount: diagLow,
      highAmount: diagHigh,
      items: diagItems,
    },
    capitalGainsNote:
      'Plus-value : exonérée pour une résidence principale. Pour une résidence secondaire ou un investissement locatif, la plus-value est imposable (19 % IR + 17,2 % prélèvements sociaux), avec abattements progressifs selon la durée de détention (exonération totale après 22 ans pour l\'IR, 30 ans pour les prélèvements sociaux).',
  };
}
