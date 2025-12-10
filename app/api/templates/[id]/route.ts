import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import fs from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const schema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche').optional(),
  description: z.string().optional().or(z.literal('')).transform(v => v || undefined),
  category: z.string().optional().or(z.literal('')).transform(v => v || undefined),
  fields: z.array(z.string()).optional(),
  templateContent: z.string().optional()
})

interface Params { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  try {
    const template = await prisma.contractTemplate.findUnique({ where: { id: params.id } })
    if (!template) {
      return NextResponse.json({ message: 'Template nicht gefunden' }, { status: 404 })
    }
    return NextResponse.json(template)
  } catch (err: any) {
    console.error('Template GET Error:', err)
    return NextResponse.json({ message: 'Interner Fehler', error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const input = schema.parse(await req.json())
    const existing = await prisma.contractTemplate.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })

    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await prisma.contractTemplate.findUnique({ where: { slug: input.slug } })
      if (slugTaken) return NextResponse.json({ message: 'Slug bereits vergeben' }, { status: 400 })
    }

    const updateData: any = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.category !== undefined) updateData.category = input.category
    if (input.fields !== undefined) updateData.fields = JSON.stringify(input.fields)
    if (input.slug && input.slug !== existing.slug) {
      updateData.slug = input.slug
      const root = process.cwd()
      const oldPath = path.join(root, 'templates', 'contracts', `${existing.slug}.hbs`)
      const newPath = path.join(root, 'templates', 'contracts', `${input.slug}.hbs`)
      try { await fs.rename(oldPath, newPath) } catch {}
    }

    if (input.templateContent) {
      const root = process.cwd()
      const filePath = path.join(root, 'templates', 'contracts', `${input.slug || existing.slug}.hbs`)
      await fs.writeFile(filePath, input.templateContent, 'utf-8')
    }

    const updated = await prisma.contractTemplate.update({ where: { id: params.id }, data: updateData })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('Template Update Error:', err)
    if (err.code === 'P2025') {
      return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
    }
    if (err?.name === 'ZodError') {
      console.error('Validation Errors:', err.issues)
      return NextResponse.json({ message: 'Ungültige Eingabe', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({ message: 'Interner Fehler', error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const template = await prisma.contractTemplate.findUnique({ where: { id: params.id } })
    if (!template) return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })

    await prisma.contractTemplate.delete({ where: { id: params.id } })
    const root = process.cwd()
    const filePath = path.join(root, 'templates', 'contracts', `${template.slug}.hbs`)
    try { await fs.unlink(filePath) } catch {}
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Interner Fehler' }, { status: 500 })
  }
}

