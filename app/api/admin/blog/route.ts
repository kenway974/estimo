import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const PostSchema = z.object({
  slug: z.string().min(3).max(100),
  title: z.string().min(5).max(200),
  excerpt: z.string().min(10).max(500),
  content: z.string().min(100),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  readingTime: z.number().int().min(1).default(5),
  published: z.boolean().default(false),
})

export async function GET() {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ posts })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = PostSchema.parse(body)
    const post = await prisma.blogPost.create({
      data: {
        ...data,
        publishedAt: data.published ? new Date() : null,
      },
    })
    return NextResponse.json({ post }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.published && !data.publishedAt ? new Date() : data.publishedAt,
      },
    })
    return NextResponse.json({ post })
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
