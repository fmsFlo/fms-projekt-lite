import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const leadSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  phaseId: z.string().min(1, 'Phase ist erforderlich'),
  clientId: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  nextActionDate: z.string().optional().nullable(),
  nextActionNote: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        phase: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(leads)
  } catch (err: any) {
    console.error('Error fetching leads:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = leadSchema.parse(body)
    
    const nextActionDate = data.nextActionDate 
      ? new Date(data.nextActionDate) 
      : null
    
    const lead = await prisma.lead.create({
      data: {
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        phaseId: data.phaseId,
        clientId: data.clientId || null,
        source: data.source || null,
        notes: data.notes || null,
        nextActionDate: nextActionDate,
        nextActionNote: data.nextActionNote || null,
      },
      include: {
        phase: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        }
      }
    })
    
    return NextResponse.json(lead, { status: 201 })
  } catch (err: any) {
    console.error('Error creating lead:', err)
    if (err.name === 'ZodError') {
      return NextResponse.json({ message: 'Validierungsfehler', errors: err.errors }, { status: 400 })
    }
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}



