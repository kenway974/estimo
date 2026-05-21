import type { TenantConfig } from '../config/tenants';
import type { Estimator } from './types';
import { ConfigEstimator } from './config-estimator';

/**
 * Fabrique d'estimateur. Aujourd'hui : ConfigEstimator (coefficients).
 * Demain : brancher ici un ApiEstimator (DVF, etc.) selon tenant.estimation
 * sans rien changer ailleurs dans l'application.
 */
export function createEstimator(tenant: TenantConfig): Estimator {
  return new ConfigEstimator(tenant.estimation);
}

export * from './types';
