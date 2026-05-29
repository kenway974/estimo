import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays, setHours, setMinutes } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.autoGenerate) {
      const days = body.days || 30
      const slots = []
      for (let dayOffset = 1; dayOffset <= days; dayOffset++) {
        const date = addDays(new Date(), dayOffset)
        if (date.getDay() === 0) continue
        for (const hour of [8, 10, 14, 16]) {
          slots.push({ date: setMinutes(setHours(date, hour), 0), duration: 120, available: true })
        }
      }
      await prisma.availableSlot.createMany({ data: slots, skipDuplicates: true })
      return NextResponse.json({ ok: true, created: slots.length })
    }

    if (!body.date) return NextResponse.json({ error: 'Date requise' }, { status: 400 })

    const slot = await prisma.availableSlot.create({
      data: {
        date: new Date(body.date),
        duration: body.duration || 120,
        available: true,
      },
    })
    return NextResponse.json({ slot }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

  try {
    await prisma.availableSlot.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
