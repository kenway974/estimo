import type { CRMAdapter, ProspectData, CRMEvent } from '../types'

export class PipedriveCRMAdapter implements CRMAdapter {
  private readonly baseUrl = `https://${process.env.PIPEDRIVE_COMPANY_DOMAIN}.pipedrive.com/api/v1`
  private readonly apiToken = process.env.PIPEDRIVE_API_TOKEN!

  private async request(path: string, method = 'GET', body?: unknown) {
    const url = `${this.baseUrl}${path}${path.includes('?') ? '&' : '?'}api_token=${this.apiToken}`
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(`Pipedrive API error ${res.status}`)
    const data = await res.json()
    return data.data
  }

  async createProspect(data: ProspectData): Promise<string> {
    const person = await this.request('/persons', 'POST', {
      name: data.firstName,
      email: data.email ? [{ value: data.email, primary: true }] : undefined,
      phone: [{ value: data.phone, primary: true }],
    })

    const deal = await this.request('/deals', 'POST', {
      title: `${data.firstName} - ${data.serviceType} (${data.city})`,
      person_id: person.id,
      value: Math.round((data.estimateMin + data.estimateMax) / 2),
      currency: 'EUR',
      status: 'open',
    })

    // Note avec l'ID JP Clim
    await this.request('/notes', 'POST', {
      content: `JP Clim Prospect ID: ${data.prospectId}\nService: ${data.serviceType}\nEstimation: ${data.estimateMin}-${data.estimateMax}€`,
      deal_id: deal.id,
    })

    return String(deal.id)
  }

  async updateProspect(prospectId: string, update: Partial<ProspectData>): Promise<void> {
    // Pipedrive: recherche par note contenant prospectId
    // En production, stocker le mapping prospectId→dealId en base
    console.log('[Pipedrive] updateProspect:', prospectId, update)
  }

  async trackEvent(prospectId: string, event: CRMEvent): Promise<void> {
    console.log('[Pipedrive] trackEvent:', prospectId, event.type)
  }
}