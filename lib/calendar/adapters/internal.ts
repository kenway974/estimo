import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import type { CalendarAdapter, TimeSlot, Booking } from '../types'

export class InternalCalendarAdapter implements CalendarAdapter {
  async getAvailableSlots(from: Date, to: Date): Promise<TimeSlot[]> {
    const slots = await prisma.availableSlot.findMany({
      where: {
        date: { gte: from, lte: to },
        available: true,
      },
      orderBy: { date: 'asc' },
    })

    return slots.map((s) => {
      const startHour = s.date.getHours()
      const endDate = new Date(s.date.getTime() + s.duration * 60000)
      return {
        id: s.id,
        date: s.date,
        startTime: format(s.date, 'HH:mm'),
        endTime: format(endDate, 'HH:mm'),
        available: s.available,
        duration: s.duration,
      }
    })
  }

  async bookSlot(
    slotId: string,
    prospectId: string,
    data: { firstName: string; email?: string; phone: string; notes?: string }
  ): Promise<Booking> {
    const [slot, lead] = await Promise.all([
      prisma.availableSlot.findUnique({ where: { id: slotId } }),
      prisma.lead.findUnique({ where: { prospectId } }),
    ])

    if (!slot || !slot.available) throw new Error('Créneau indisponible')
    if (!lead) throw new Error('Prospect introuvable')

    const [booking] = await prisma.$transaction([
      prisma.booking.create({
        data: {
          leadId: lead.id,
          slotId,
          status: 'PENDING',
          notes: data.notes,
        },
      }),
      prisma.availableSlot.update({
        where: { id: slotId },
        data: { available: false },
      }),
    ])

    return {
      id: booking.id,
      slotId: booking.slotId,
      prospectId,
      firstName: data.firstName,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      status: booking.status as 'PENDING',
      createdAt: booking.createdAt,
    }
  }

  async cancelBooking(bookingId: string): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return

    await prisma.$transaction([
      prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } }),
      prisma.availableSlot.update({ where: { id: booking.slotId }, data: { available: true } }),
    ])
  }

  async confirmBooking(bookingId: string): Promise<void> {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    })
  }
}