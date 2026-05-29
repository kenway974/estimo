import { NextRequest, NextResponse } from 'next/server'
import { getCalendarAdapter } from '@/lib/calendar'
import { getCRMAdapter } from '@/lib/crm'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const BookSchema = z.object({
  slotId: z.string(),
  prospectId: z.string().optional(),
  firstName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slotId, prospectId, ...contactData } = BookSchema.parse(body)

    const calendar = getCalendarAdapter()

    let pid = prospectId
    if (!pid) {
      const { v4: uuidv4 } = await import('uuid')
      pid = uuidv4()
      await prisma.lead.create({
        data: {
          prospectId: pid,
          firstName: contactData.firstName,
          phone: contactData.phone,
          email: contactData.email,
          city: 'Île-de-France',
          serviceType: 'CHAUFFAGE',
          housingType: 'APPARTEMENT',
          urgency: 'PLANIFIE',
          specificities: [],
          estimateMin: 0,
          estimateMax: 0,
          status: 'APPOINTMENT_BOOKED',
        },
      })
    }

    const booking = await calendar.bookSlot(slotId, pid, contactData)

    const lead = await prisma.lead.findUnique({ where: { prospectId: pid } })
    if (lead) {
      await prisma.$transaction([
        prisma.lead.update({ where: { id: lead.id }, data: { status: 'APPOINTMENT_BOOKED' } }),
        prisma.leadEvent.create({
          data: { leadId: lead.id, type: 'APPOINTMENT_BOOKED', metadata: { slotId, bookingId: booking.id } },
        }),
      ])

      const crm = getCRMAdapter()
      await crm.trackEvent(pid, { type: 'APPOINTMENT_BOOKED', metadata: { slotId, bookingId: booking.id } })
      await crm.updateProspect(pid, { status: 'APPOINTMENT_BOOKED' })
    }

    return NextResponse.json({ booking }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 })
    }
    if (err instanceof Error && err.message === 'Créneau indisponible') {
      return NextResponse.json({ error: 'Ce créneau n\'est plus disponible' }, { status: 409 })
    }
    console.error('POST /api/booking/book', err)
    return NextResponse.json({ error: 'Erreur lors de la réservation' }, { status: 500 })
  }
}
