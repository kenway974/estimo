import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendQuoteEmail } from '@/lib/email'
import { getCRMAdapter } from '@/lib/crm'
import { SERVICE_LABELS, HOUSING_LABELS, calculateEstimation } from '@/lib/estimation'
import { z } from 'zod'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import React from 'react'

const EmailSchema = z.object({
  leadId: z.string(),
  email: z.string().email(),
  prospectId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { leadId, email, prospectId } = EmailSchema.parse(body)

    const lead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (!lead) return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })

    if (!lead.email && email) {
      await prisma.lead.update({ where: { id: leadId }, data: { email } })
    }

    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { QuotePDF } = await import('@/lib/pdf/quote')

    const estimation = calculateEstimation({
      serviceType: lead.serviceType as Parameters<typeof calculateEstimation>[0]['serviceType'],
      housingType: lead.housingType as Parameters<typeof calculateEstimation>[0]['housingType'],
      surface: lead.surface || 50,
      buildingAge: (lead.buildingAge as Parameters<typeof calculateEstimation>[0]['buildingAge']) || 'DIX_VINGT_ANS',
      urgency: lead.urgency as Parameters<typeof calculateEstimation>[0]['urgency'],
      specificities: lead.specificities,
    })

    const pdfBuffer = await renderToBuffer(
      React.createElement(QuotePDF, {
        firstName: lead.firstName,
        serviceType: SERVICE_LABELS[lead.serviceType as keyof typeof SERVICE_LABELS] || lead.serviceType,
        housingType: HOUSING_LABELS[lead.housingType as keyof typeof HOUSING_LABELS] || lead.housingType,
        surface: lead.surface || undefined,
        city: lead.city,
        estimateMin: lead.estimateMin,
        estimateMax: lead.estimateMax,
        details: estimation.details,
        prospectId: lead.prospectId,
        date: format(new Date(), 'dd MMMM yyyy', { locale: fr }),
      })
    )

    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')

    await sendQuoteEmail({
      to: email,
      firstName: lead.firstName,
      serviceType: SERVICE_LABELS[lead.serviceType as keyof typeof SERVICE_LABELS] || lead.serviceType,
      estimateMin: lead.estimateMin,
      estimateMax: lead.estimateMax,
      pdfBase64,
      prospectId: lead.prospectId,
    })

    await prisma.$transaction([
      prisma.lead.update({ where: { id: leadId }, data: { status: 'QUOTE_SENT' } }),
      prisma.leadEvent.create({ data: { leadId, type: 'QUOTE_EMAIL_SENT', metadata: { email } } }),
    ])

    const pid = prospectId || lead.prospectId
    const crm = getCRMAdapter()
    await crm.trackEvent(pid, { type: 'QUOTE_EMAIL_SENT', metadata: { email } })
    await crm.updateProspect(pid, { status: 'QUOTE_SENT', email })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }
    console.error('POST /api/email', err)
    return NextResponse.json({ error: 'Erreur lors de l\'envoi' }, { status: 500 })
  }
}
