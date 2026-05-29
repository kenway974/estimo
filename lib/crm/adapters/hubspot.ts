import type { CRMAdapter, ProspectData, CRMEvent } from '../types'

const SERVICE_LABELS: Record<string, string> = {
  CHAUFFAGE: 'Chauffage',
  CLIMATISATION: 'Climatisation',
  VMC: 'Ventilation VMC',
  PLOMBERIE: 'Plomberie',
  ELECTRICITE: 'Électricité',
  ENTRETIEN: 'Entretien / Maintenance',
  RENOVATION: 'Rénovation',
}

export class HubSpotCRMAdapter implements CRMAdapter {
  private readonly baseUrl = 'https://api.hubapi.com'
  private readonly apiKey = process.env.HUBSPOT_API_KEY!

  private async request(path: string, method = 'GET', body?: unknown) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`HubSpot API error ${res.status}: ${err}`)
    }
    return res.json()
  }

  async createProspect(data: ProspectData): Promise<string> {
    const contact = await this.request('/crm/v3/objects/contacts', 'POST', {
      properties: {
        firstname: data.firstName,
        email: data.email,
        phone: data.phone,
        city: data.city,
        hs_lead_status: 'NEW',
        jpclim_service: SERVICE_LABELS[data.serviceType] || data.serviceType,
        jpclim_estimate_min: data.estimateMin,
        jpclim_estimate_max: data.estimateMax,
        jpclim_prospect_id: data.prospectId,
      },
    })
    return contact.id
  }

  async updateProspect(prospectId: string, update: Partial<ProspectData>): Promise<void> {
    // Chercher le contact par prospectId
    const search = await this.request('/crm/v3/objects/contacts/search', 'POST', {
      filterGroups: [{ filters: [{ propertyName: 'jpclim_prospect_id', operator: 'EQ', value: prospectId }] }],
    })
    if (!search.results?.length) return

    const contactId = search.results[0].id
    const props: Record<string, unknown> = {}
    if (update.status) props.hs_lead_status = update.status
    if (update.email) props.email = update.email

    await this.request(`/crm/v3/objects/contacts/${contactId}`, 'PATCH', { properties: props })
  }

  async trackEvent(prospectId: string, event: CRMEvent): Promise<void> {
    const search = await this.request('/crm/v3/objects/contacts/search', 'POST', {
      filterGroups: [{ filters: [{ propertyName: 'jpclim_prospect_id', operator: 'EQ', value: prospectId }] }],
    })
    if (!search.results?.length) return

    const contactId = search.results[0].id
    await this.request('/crm/v3/objects/notes', 'POST', {
      properties: {
        hs_note_body: `[JP Clim Site] ${event.type} - ${JSON.stringify(event.metadata || {})}`,
        hs_timestamp: (event.timestamp || new Date()).toISOString(),
      },
      associations: [{ to: { id: contactId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }] }],
    })
  }
}