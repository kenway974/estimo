import type { CalendarAdapter, TimeSlot, Booking } from '../types'
import { format } from 'date-fns'

export class CalendlyAdapter implements CalendarAdapter {
  private readonly apiToken = process.env.CALENDLY_API_TOKEN!
  private readonly eventTypeUri = process.env.CALENDLY_EVENT_TYPE_URI!

  private async request(path: string, method = 'GET', body?: unknown) {
    const res = await fetch(`https://api.calendly.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(`Calendly API error ${res.status}`)
    return res.json()
  }

  async getAvailableSlots(from: Date, to: Date): Promise<TimeSlot[]> {
    const data = await this.request(
      `/event_type_available_times?event_type=${encodeURIComponent(this.eventTypeUri)}&start_time=${from.toISOString()}&end_time=${to.toISOString()}`
    )

    return (data.collection || []).map((item: { start_time: string }, index: number) => {
      const start = new Date(item.start_time)
      const end = new Date(start.getTime() + 60 * 60000) // 1h par défaut Calendly
      return {
        id: `calendly-${index}-${start.getTime()}`,
        date: start,
        startTime: format(start, 'HH:mm'),
        endTime: format(end, 'HH:mm'),
        available: true,
        duration: 60,
      }
    })
  }

  async bookSlot(_slotId: string, _prospectId: string, _data: { firstName: string; email?: string; phone: string; notes?: string }): Promise<Booking> {
    // Calendly gère le booking via son propre widget ou single-use scheduling links
    throw new Error('Utilisez le widget Calendly pour les réservations directes')
  }

  async cancelBooking(bookingId: string): Promise<void> {
    await this.request(`/scheduled_events/${bookingId}/cancellation`, 'POST', {
      reason: 'Annulation demandée par le client',
    })
  }

  async confirmBooking(_bookingId: string): Promise<void> {
    // Géré automatiquement par Calendly
  }
}