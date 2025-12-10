import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const phaseSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  order: z.number().int().default(0),
  color: z.string().optional().nullable(),
  type: z.enum(['lead', 'opportunity']).default('opportunity'),
  description: z.string().optional().nullable(),
  probability: z.number().int().min(0).max(100).optional().nullable(),
  status: z.enum(['open', 'won', 'lost']).optional().nullable(),
  isDefault: z.boolean().default(false),
  isConverted: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export async function GET() {
  try {
    const phases = await prisma.pipelinePhase.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { 
            opportunities: true,
            leads: true
          }
        }
      }
    })
    return NextResponse.json(phases)
  } catch (err: any) {
    console.error('Error fetching pipeline phases:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = phaseSchema.parse(body)
    
    // Wenn isDefault=true, setze alle anderen Phasen des gleichen Typs auf false
    if (data.isDefault) {
      await prisma.pipelinePhase.updateMany({
        where: { 
          type: data.type,
          id: { not: undefined } // Alle anderen
        },
        data: { isDefault: false }
      })
    }
    
    const phase = await prisma.pipelinePhase.create({
      data: {
        name: data.name,
        slug: data.slug,
        order: data.order,
        color: data.color || null,
        type: data.type,
        description: data.description || null,
        probability: data.probability || null,
        status: data.status || null,
        isDefault: data.isDefault,
        isConverted: data.isConverted,
        isActive: data.isActive,
      }
    })
    
    return NextResponse.json(phase, { status: 201 })
  } catch (err: any) {
    console.error('Error creating pipeline phase:', err)
    if (err.name === 'ZodError') {
      return NextResponse.json({ message: 'Validierungsfehler', errors: err.errors }, { status: 400 })
    }
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
