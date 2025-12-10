import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const opportunitySchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().optional(),
  phaseId: z.string().min(1, 'Phase ist erforderlich'),
  clientId: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  estimatedValue: z.number().optional().nullable(),
  probability: z.number().min(0).max(100).optional().nullable(),
  nextActionDate: z.string().optional().nullable(),
  nextActionNote: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const opportunities = await prisma.opportunity.findMany({
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
    return NextResponse.json(opportunities)
  } catch (err: any) {
    console.error('Error fetching opportunities:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = opportunitySchema.parse(body)
    
    // Konvertiere nextActionDate von String zu DateTime falls vorhanden
    const nextActionDate = data.nextActionDate 
      ? new Date(data.nextActionDate) 
      : null
    
    const opportunity = await prisma.opportunity.create({
      data: {
        title: data.title,
        description: data.description || null,
        phaseId: data.phaseId,
        clientId: data.clientId || null,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        estimatedValue: data.estimatedValue || null,
        probability: data.probability || null,
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
    
    return NextResponse.json(opportunity, { status: 201 })
  } catch (err: any) {
    console.error('Error creating opportunity:', err)
    if (err.name === 'ZodError') {
      return NextResponse.json({ message: 'Validierungsfehler', errors: err.errors }, { status: 400 })
    }
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}



