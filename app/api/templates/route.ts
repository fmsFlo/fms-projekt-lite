import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import fs from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const templates = await prisma.contractTemplate.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    })
    return NextResponse.json(templates)
  } catch (err: any) {
    console.error('❌ Templates GET Error:', err)
    return NextResponse.json({ message: 'Interner Fehler' }, { status: 500 })
  }
}

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche'),
  description: z.string().optional().or(z.literal('')).transform(v => v || undefined),
  category: z.string().optional().or(z.literal('')).transform(v => v || 'Honorar Beratung'),
  fields: z.array(z.string()).default([]),
  templateContent: z.string().min(1)
})

export async function POST(req: Request) {
  try {
    const input = schema.parse(await req.json())
    const existing = await prisma.contractTemplate.findUnique({ where: { slug: input.slug } })
    if (existing) return NextResponse.json({ message: 'Slug bereits vergeben' }, { status: 400 })

    const template = await prisma.contractTemplate.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        category: input.category,
        fields: JSON.stringify(input.fields)
      }
    })

    const root = process.cwd()
    const dir = path.join(root, 'templates', 'contracts')
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, `${input.slug}.hbs`), input.templateContent, 'utf-8')

    return NextResponse.json(template)
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ message: 'Ungültige Eingabe', issues: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ message: 'Interner Fehler' }, { status: 500 })
  }
}

