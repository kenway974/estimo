import type { CalendarAdapter } from './types'
import { InternalCalendarAdapter } from './adapters/internal'
import { GoogleCalendarAdapter } from './adapters/google'
import { CalendlyAdapter } from './adapters/calendly'

let _adapter: CalendarAdapter | null = null

export function getCalendarAdapter(): CalendarAdapter {
  if (_adapter) return _adapter

  const provider = process.env.CALENDAR_PROVIDER || 'internal'

  switch (provider) {
    case 'google':
      _adapter = new GoogleCalendarAdapter()
      break
    case 'calendly':
      _adapter = new CalendlyAdapter()
      break
    default:
      _adapter = new InternalCalendarAdapter()
  }

  return _adapter
}

export type { CalendarAdapter, TimeSlot, Booking } from './types'