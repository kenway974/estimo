import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCRMAdapter } from '@/lib/crm'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const prospectId = searchParams.get('id')
  const event = searchParams.get('event')

  if (prospectId && event) {
    try {
      const lead = await prisma.lead.findUnique({ where: { prospectId } })
      if (lead) {
        await prisma.leadEvent.create({
          data: { leadId: lead.id, type: 'QUOTE_EMAIL_OPENED' },
        })
        const crm = getCRMAdapter()
        await crm.trackEvent(prospectId, { type: 'QUOTE_EMAIL_OPENED' })
      }
    } catch {}
  }

  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  )
  return new NextResponse(pixel, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prospectId, event, metadata } = body

    if (!prospectId || !event) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const lead = await prisma.lead.findUnique({ where: { prospectId } })
    if (!lead) return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 })

    await prisma.leadEvent.create({
      data: { leadId: lead.id, type: event, metadata: metadata || {} },
    })

    if (event === 'CONVERTED') {
      await prisma.lead.update({ where: { id: lead.id }, data: { status: 'CONVERTED' } })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/crm', err)
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
