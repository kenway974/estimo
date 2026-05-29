import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SERVICE_LABELS, HOUSING_LABELS, calculateEstimation } from '@/lib/estimation'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const lead = await prisma.lead.findUnique({ where: { id } })
    if (!lead) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    const estimation = calculateEstimation({
      serviceType: lead.serviceType as Parameters<typeof calculateEstimation>[0]['serviceType'],
      housingType: lead.housingType as Parameters<typeof calculateEstimation>[0]['housingType'],
      surface: lead.surface || 50,
      buildingAge: (lead.buildingAge as Parameters<typeof calculateEstimation>[0]['buildingAge']) || 'DIX_VINGT_ANS',
      urgency: lead.urgency as Parameters<typeof calculateEstimation>[0]['urgency'],
      specificities: lead.specificities,
    })

    return NextResponse.json({
      estimateMin: lead.estimateMin,
      estimateMax: lead.estimateMax,
      serviceType: SERVICE_LABELS[lead.serviceType as keyof typeof SERVICE_LABELS] || lead.serviceType,
      housingType: HOUSING_LABELS[lead.housingType as keyof typeof HOUSING_LABELS] || lead.housingType,
      firstName: lead.firstName,
      city: lead.city,
      surface: lead.surface,
      details: estimation.details,
    })
  } catch (err) {
    console.error('GET /api/leads/[id]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
