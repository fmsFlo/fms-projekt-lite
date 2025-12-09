import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const clientSchema = z.object({
  firstName: z.string().min(1, 'Vorname erforderlich').optional(),
  lastName: z.string().optional().or(z.literal('')).transform(v => v || undefined),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  phone: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  street: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  houseNumber: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  city: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  zip: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  iban: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  crmId: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  isCompany: z.boolean().optional(),
  companyName: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  birthDate: z.string().optional().or(z.literal('').or(z.null())).transform(v => v ? new Date(v) : undefined),
  profession: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  employmentStatus: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  salaryGrade: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
  grvInsuranceStatus: z.string().optional().or(z.literal('').or(z.null())).transform(v => v || undefined),
})

interface Params { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const client = await prisma.client.findUnique({ where: { id: params.id } })
  if (!client) return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json()
    console.log('📝 Update Request:', body)
    
    const validated = clientSchema.parse(body)
    // Konvertiere leere Strings zu null für Prisma
    const data: any = {}
    for (const [key, value] of Object.entries(validated)) {
      if (value === undefined) {
        continue
      }

      if (key === 'birthDate') {
        if (value && value !== '' && value !== null) {
          const date = new Date(value as string)
          data[key] = !isNaN(date.getTime()) ? date : null
        } else {
          data[key] = null
        }
        continue
      }

      data[key] = value === '' ? null : value
    }
    console.log('✅ Validated Data:', data)
    
    // Entferne undefined-Werte, die Prisma nicht mag
    Object.keys(data).forEach(key => {
      if (data[key] === undefined) {
        delete data[key]
      }
    })
    
    const updated = await prisma.client.update({ where: { id: params.id }, data })
    console.log('✅ Updated Client:', updated)
    
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('❌ PATCH Error:', err)
    console.error('❌ Error Stack:', err.stack)
    
    if (err.code === 'P2025') {
      return NextResponse.json({ message: 'Client nicht gefunden' }, { status: 404 })
    }
    if (err?.name === 'ZodError') {
      console.error('Validation Errors:', err.issues)
      return NextResponse.json({ 
        message: 'Ungültige Eingabe', 
        issues: err.issues,
        details: err.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ')
      }, { status: 400 })
    }
    return NextResponse.json({ 
      message: 'Speichern fehlgeschlagen', 
      error: err.message,
      code: err.code,
      details: err.stack 
    }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    // Lösche zuerst alle abhängigen Datensätze
    await prisma.retirementConcept.deleteMany({ where: { clientId: params.id } })
    await prisma.contract.deleteMany({ where: { clientId: params.id } })
    await prisma.opportunity.deleteMany({ where: { clientId: params.id } })
    await prisma.lead.updateMany({ 
      where: { clientId: params.id },
      data: { clientId: null }
    })
    
    // Jetzt kann der Client gelöscht werden
    await prisma.client.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('❌ DELETE Error:', err)
    if (err.code === 'P2025') {
      return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
    }
    return NextResponse.json({ 
      message: 'Interner Fehler', 
      error: err.message,
      code: err.code 
    }, { status: 500 })
  }
}

