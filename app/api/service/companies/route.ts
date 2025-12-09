import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SERVICE_CONTACT_SEED } from '@/lib/service/serviceContactSeeds'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  address: z.string().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  category: z.string().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''

  if (typeof (prisma as any).serviceContact?.findMany !== 'function') {
    const filtered = SERVICE_CONTACT_SEED.filter((entry) => {
      if (!query.trim()) return true
      const term = query.toLowerCase()
      return (
        entry.name.toLowerCase().includes(term) ||
        (entry.email?.toLowerCase().includes(term) ?? false) ||
        (entry.address?.toLowerCase().includes(term) ?? false) ||
        (entry.category?.toLowerCase().includes(term) ?? false)
      )
    })
      .map((entry) => ({
        ...entry,
        category: entry.category ?? 'Versicherung',
      }))
    return NextResponse.json({ query, results: filtered })
  }

  const contacts = await prisma.serviceContact.findMany({
    orderBy: { name: 'asc' },
  })

  if (!query.trim()) {
    return NextResponse.json({ query, results: contacts })
  }

  const term = query.trim().toLowerCase()
  const filtered = contacts.filter((entry) => {
    const haystacks = [entry.name, entry.email, entry.address, entry.category]
      .filter(Boolean)
      .map((value) => value!.toLowerCase())
    return haystacks.some((value) => value.includes(term))
  })

  return NextResponse.json({ query, results: filtered })
}

export async function POST(req: Request) {
  try {
    const payload = createSchema.parse(await req.json())

    if (typeof (prisma as any).serviceContact?.create !== 'function') {
      return NextResponse.json({ message: 'Speichern aktuell nicht möglich (bitte Prisma Client aktualisieren).' }, { status: 501 })
    }

    const existing = await prisma.serviceContact.findFirst({
      where: {
        OR: [
          { name: payload.name },
          payload.email ? { email: payload.email } : undefined,
        ].filter(Boolean) as any,
      },
    })

    if (existing) {
      const updated = await prisma.serviceContact.update({
        where: { id: existing.id },
        data: {
          email: payload.email ?? existing.email,
          address: payload.address ?? existing.address,
          category: payload.category ?? existing.category,
          updatedAt: new Date(),
        },
      })
      return NextResponse.json(updated)
    }

    const created = await prisma.serviceContact.create({
      data: {
        name: payload.name,
        email: payload.email,
        address: payload.address,
        category: payload.category,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ message: 'Eingabe unvollständig', issues: err.issues }, { status: 400 })
    }
    console.error('service contact create error', err)
    return NextResponse.json({ message: 'Interner Fehler' }, { status: 500 })
  }
}

