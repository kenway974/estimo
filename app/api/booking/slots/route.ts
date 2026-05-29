import { NextRequest, NextResponse } from 'next/server'
import { getCalendarAdapter } from '@/lib/calendar'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date()
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const calendar = getCalendarAdapter()
    const slots = await calendar.getAvailableSlots(from, to)

    return NextResponse.json({ slots })
  } catch (err) {
    console.error('GET /api/booking/slots', err)
    return NextResponse.json({ slots: [] }, { status: 500 })
  }
}
