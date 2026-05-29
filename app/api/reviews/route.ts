import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ReviewSchema = z.object({
  authorName: z.string().min(2).max(100),
  authorCity: z.string().max(100).optional(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(20).max(500),
  service: z.string().max(100).optional(),
})

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ reviews })
  } catch {
    return NextResponse.json({ reviews: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sanitize = (s: string) => s.replace(/<[^>]*>/g, '').trim()

    const data = ReviewSchema.parse({
      ...body,
      authorName: sanitize(body.authorName || ''),
      content: sanitize(body.content || ''),
    })

    const review = await prisma.review.create({
      data: {
        ...data,
        source: 'SITE',
        published: false,
        verified: false,
      },
    })

    return NextResponse.json({ ok: true, id: review.id }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 })
  }
}
