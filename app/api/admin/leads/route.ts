import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateSchema = z.object({
  id: z.string(),
  status: z.enum(['ESTIMATE_VIEWED', 'QUOTE_SENT', 'CALLBACK_REQUESTED', 'APPOINTMENT_BOOKED', 'CONTACTED', 'CONVERTED', 'LOST']).optional(),
})

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: { events: { orderBy: { createdAt: 'desc' }, take: 3 } },
    })
    return NextResponse.json({ leads })
  } catch {
    return NextResponse.json({ leads: [] }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = UpdateSchema.parse(body)
    const lead = await prisma.lead.update({ where: { id }, data })
    return NextResponse.json({ lead })
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
