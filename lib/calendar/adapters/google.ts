import type { CalendarAdapter, TimeSlot, Booking } from '../types'
import { addHours, format } from 'date-fns'

export class GoogleCalendarAdapter implements CalendarAdapter {
  private readonly calendarId = process.env.GOOGLE_CALENDAR_ID!
  private accessToken: string | null = null

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken
    // OAuth2 client_credentials flow
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: 'TODO_JWT_HERE', // Générer un JWT signé avec la clé de service
      }),
    })
    const data = await res.json()
    this.accessToken = data.access_token
    return this.accessToken!
  }

  async getAvailableSlots(from: Date, to: Date): Promise<TimeSlot[]> {
    const token = await this.getAccessToken()
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/freeBusy`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeMin: from.toISOString(),
          timeMax: to.toISOString(),
          items: [{ id: this.calendarId }],
        }),
      }
    )
    const data = await res.json()
    const busyPeriods: { start: string; end: string }[] = data.calendars?.[this.calendarId]?.busy || []

    // Générer des créneaux de 2h sur la période, en excluant les occupés
    const slots: TimeSlot[] = []
    const current = new Date(from)
    while (current <= to) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0) { // pas dimanche
        for (const hour of [9, 11, 14, 16]) {
          const start = new Date(current)
          start.setHours(hour, 0, 0, 0)
          const end = addHours(start, 2)
          const isBusy = busyPeriods.some(
            (b) => new Date(b.start) < end && new Date(b.end) > start
          )
          if (!isBusy) {
            slots.push({
              id: `google-${start.getTime()}`,
              date: start,
              startTime: format(start, 'HH:mm'),
              endTime: format(end, 'HH:mm'),
              available: true,
              duration: 120,
            })
          }
        }
      }
      current.setDate(current.getDate() + 1)
    }
    return slots
  }

  async bookSlot(slotId: string, prospectId: string, data: { firstName: string; email?: string; phone: string; notes?: string }): Promise<Booking> {
    const timestamp = parseInt(slotId.replace('google-', ''))
    const start = new Date(timestamp)
    const end = addHours(start, 2)
    const token = await this.getAccessToken()

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: `Visite JP Clim - ${data.firstName}`,
          description: `Prospect: ${prospectId}\nTél: ${data.phone}\n${data.notes || ''}`,
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
          attendees: data.email ? [{ email: data.email }] : [],
        }),
      }
    )
    const event = await res.json()

    return {
      id: event.id,
      slotId,
      prospectId,
      firstName: data.firstName,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      status: 'PENDING',
      createdAt: new Date(),
    }
  }

  async cancelBooking(bookingId: string): Promise<void> {
    const token = await this.getAccessToken()
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${bookingId}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    )
  }

  async confirmBooking(_bookingId: string): Promise<void> {
    // Google Calendar gère ça via les confirmations d'invitation
  }
}