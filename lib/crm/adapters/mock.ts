import type { CRMAdapter, ProspectData, CRMEvent } from '../types'

export class MockCRMAdapter implements CRMAdapter {
  private prospects: Map<string, ProspectData & { events: CRMEvent[] }> = new Map()

  async createProspect(data: ProspectData): Promise<string> {
    const crmId = `MOCK-${data.prospectId}`
    this.prospects.set(data.prospectId, { ...data, events: [] })
    if (process.env.NODE_ENV !== 'production') {
      console.log('[CRM Mock] Prospect créé:', crmId, data.firstName)
    }
    return crmId
  }

  async updateProspect(prospectId: string, update: Partial<ProspectData>): Promise<void> {
    const existing = this.prospects.get(prospectId)
    if (existing) {
      this.prospects.set(prospectId, { ...existing, ...update })
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[CRM Mock] Prospect mis à jour:', prospectId, update)
    }
  }

  async trackEvent(prospectId: string, event: CRMEvent): Promise<void> {
    const existing = this.prospects.get(prospectId)
    if (existing) {
      existing.events.push({ ...event, timestamp: event.timestamp || new Date() })
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[CRM Mock] Événement:', prospectId, event.type)
    }
  }
}