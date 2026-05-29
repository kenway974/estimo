export interface TimeSlot {
  id: string
  date: Date
  startTime: string // "09:00"
  endTime: string   // "11:00"
  available: boolean
  duration: number  // minutes
}

export interface Booking {
  id: string
  slotId: string
  prospectId: string
  firstName: string
  email?: string
  phone: string
  notes?: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  confirmedAt?: Date
  createdAt: Date
}

export interface CalendarAdapter {
  getAvailableSlots(from: Date, to: Date): Promise<TimeSlot[]>
  bookSlot(slotId: string, prospectId: string, data: { firstName: string; email?: string; phone: string; notes?: string }): Promise<Booking>
  cancelBooking(bookingId: string): Promise<void>
  confirmBooking(bookingId: string): Promise<void>
}