import type { CRMAdapter } from './types'
import { MockCRMAdapter } from './adapters/mock'
import { HubSpotCRMAdapter } from './adapters/hubspot'
import { PipedriveCRMAdapter } from './adapters/pipedrive'

let _adapter: CRMAdapter | null = null

export function getCRMAdapter(): CRMAdapter {
  if (_adapter) return _adapter

  const provider = process.env.CRM_PROVIDER || 'mock'

  switch (provider) {
    case 'hubspot':
      _adapter = new HubSpotCRMAdapter()
      break
    case 'pipedrive':
      _adapter = new PipedriveCRMAdapter()
      break
    default:
      _adapter = new MockCRMAdapter()
  }

  return _adapter
}

export type { CRMAdapter, ProspectData, CRMEvent } from './types'