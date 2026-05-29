import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCRMAdapter } from '@/lib/crm'
import { calculateEstimation } from '@/lib/estimation'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const CreateLeadSchema = z.object({
  serviceType: z.enum(['CHAUFFAGE', 'CLIMATISATION', 'VMC', 'PLOMBERIE', 'ELECTRICITE', 'ENTRETIEN', 'RENOVATION']),
  housingType: z.enum(['APPARTEMENT', 'MAISON', 'LOCAL_COMMERCIAL']),
  surface: z.number().min(10).max(1000).optional(),
  buildingAge: z.enum(['NEUF', 'MOINS_10_ANS', 'DIX_VINGT_ANS', 'PLUS_20_ANS']).optional(),
  urgency: z.enum(['URGENT', 'PLANIFIE']).default('PLANIFIE'),
  specificities: z.array(z.string()).default([]),
  firstName: z.string().min(2).max(50),
  phone: z.string().min(8).max(20),
  city: z.string().min(2).max(100),
  email: z.string().email().optional(),
})

const CallbackSchema = z.object({
  prospectId: z.string(),
  action: z.literal('CALLBACK_REQUESTED'),
  firstName: z.string(),
  phone: z.string(),
  preferredTime: z.string().optional(),
  message: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.action === 'CALLBACK_REQUESTED') {
      const data = CallbackSchema.parse(body)
      const lead = await prisma.lead.findUnique({ where: { prospectId: data.prospectId } })

      if (lead) {
        await prisma.$transaction([
          prisma.lead.update({
            where: { id: lead.id },
            data: { status: 'CALLBACK_REQUESTED' },
          }),
          prisma.leadEvent.create({
            data: { leadId: lead.id, type: 'CALLBACK_REQUESTED', metadata: { preferredTime: data.preferredTime, message: data.message } },
          }),
        ])
        const crm = getCRMAdapter()
        await crm.trackEvent(data.prospectId, { type: 'CALLBACK_REQUESTED', metadata: { preferredTime: data.preferredTime } })
      }

      return NextResponse.json({ ok: true })
    }

    const data = CreateLeadSchema.parse(body)
    const estimation = calculateEstimation({
      serviceType: data.serviceType,
      housingType: data.housingType,
      surface: data.surface || 50,
      buildingAge: data.buildingAge || 'DIX_VINGT_ANS',
      urgency: data.urgency,
      specificities: data.specificities,
    })

    const prospectId = uuidv4()

    const lead = await prisma.lead.create({
      data: {
        prospectId,
        firstName: data.firstName.trim(),
        email: data.email?.trim(),
        phone: data.phone.trim(),
        city: data.city.trim(),
        serviceType: data.serviceType,
        housingType: data.housingType,
        surface: data.surface,
        buildingAge: data.buildingAge,
        urgency: data.urgency,
        specificities: data.specificities,
        estimateMin: estimation.min,
        estimateMax: estimation.max,
        status: 'ESTIMATE_VIEWED',
        events: {
          create: { type: 'ESTIMATE_VIEWED' },
        },
      },
    })

    const crm = getCRMAdapter()
    crm.createProspect({
      prospectId,
      firstName: data.firstName,
      email: data.email,
      phone: data.phone,
      city: data.city,
      serviceType: data.serviceType,
      housingType: data.housingType,
      surface: data.surface,
      urgency: data.urgency,
      estimateMin: estimation.min,
      estimateMax: estimation.max,
      status: 'ESTIMATE_VIEWED',
    }).then((crmId) =>
      prisma.lead.update({ where: { id: lead.id }, data: { crmId } })
    ).catch(console.error)

    return NextResponse.json({ leadId: lead.id, prospectId, estimateMin: estimation.min, estimateMax: estimation.max }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 })
    }
    console.error('POST /api/leads', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { prospectId, action, ...rest } = body

    if (!prospectId || !action) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

    const lead = await prisma.lead.findUnique({ where: { prospectId } })
    if (!lead) return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })

    const statusMap: Record<string, 'CALLBACK_REQUESTED' | 'APPOINTMENT_BOOKED' | 'CONTACTED'> = {
      CALLBACK_REQUESTED: 'CALLBACK_REQUESTED',
      APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED',
      CONTACT_FORM_SUBMITTED: 'CONTACTED',
    }

    const newStatus = statusMap[action]
    if (newStatus) {
      await prisma.lead.update({ where: { id: lead.id }, data: { status: newStatus } })
    }

    await prisma.leadEvent.create({ data: { leadId: lead.id, type: action, metadata: rest } })

    const crm = getCRMAdapter()
    await crm.trackEvent(prospectId, { type: action, metadata: rest })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PATCH /api/leads', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
