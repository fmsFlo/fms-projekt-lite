import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const clientSchema = z.object({
  firstName: z.string().min(1, 'Vorname erforderlich'),
  lastName: z.string().optional().or(z.literal('')).transform(v => v || ''),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  phone: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  street: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  houseNumber: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  city: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  zip: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  iban: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  crmId: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  isCompany: z.boolean().optional().default(false),
  companyName: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
})

export async function POST(req: Request) {
  try {
    const data = clientSchema.parse(await req.json())
    const created = await prisma.client.create({ data })
    return NextResponse.json(created)
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ message: 'Ungültige Eingabe', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({ message: 'Interner Fehler' }, { status: 500 })
  }
}

